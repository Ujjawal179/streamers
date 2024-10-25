import express from "express";
import cors from "cors";
import {createClient} from 'redis';
import prisma from "./db/db";
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import bcrypt from 'bcrypt';

import {config} from 'dotenv';
import UserRouter from "./router/userRouter";
config();
const port=3001
const redisClient = createClient({
  url: 'redis://localhost:6379' // or use Redis Cloud URL
});

// Connect to Redis
redisClient.connect().catch(console.error);


// Create a new express application
const app = express();
app.use(express.json());
app.use(cors());
// Define a route to handle GET requests at the root path ("/")
app.get("/", (req, res) => {
  // Send a JSON response with the message "Hello, World!"
  res.json({ message: "Hello, World!" });
});
app.use('/api/v1', UserRouter);


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ||"",
  key_secret: process.env.RAZORPAY_KEY_SECRET ||"",
});

// Endpoint for creating a payment order
app.post('/create-payment', async (req, res) => {
  const { companyId, youtuberId, amount,currency } = req.body;

  // Validate required fields
  if (!companyId || !youtuberId || !amount) {
    return res.status(400).json({ 
      message: 'Missing required fields: companyId, youtuberId, and amount are required' 
    });
  }

  try {
    // Create a unique receipt ID using timestamp and random string
    const timestamp = Date.now().toString().slice(-6);
    const shortReceipt = `rcpt_${timestamp}`;

    const paymentOrder = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: currency,
      receipt: shortReceipt,
      payment_capture: true
    });

    await prisma.payment.create({
      data: {
        companyId,
        youtuberId,
        amount,
        orderId: paymentOrder.id,
        paymentId: shortReceipt,
        status: 'created',
      },
    });

    res.json(paymentOrder);
  } catch (error:any) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.error?.description || error.message 
    });
  }
});

// Endpoint for verifying and updating payment status
app.post('/verify-payment', async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "")
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (signature === expectedSignature) {
      // Update payment status to 'paid'
      await prisma.payment.update({
        where: { orderId },
        data: { status: 'paid', paymentId },
      });

      // Find YouTuber details for payout
      const youtuber = await prisma.youtuber.findUnique({
        where: { id: payment.youtuberId },
      });
      if (!youtuber) {
        return res.status(404).json({ message: 'YouTuber not found' });
      }

      // Calculate 70% of the payment for the YouTuber
      const youtuberShare =payment.amount * 0.7; // 70% to YouTuber
      const platformShare = payment.amount * 0.3; // 30% to platform

      // Manually process payout to YouTuber's bank account using Razorpay Payout API
      const payoutOptions = {
        account_number: 'NZL4E084wCuKAX', // Your Razorpay account number
        amount: youtuberShare * 100, // Amount in paise (70% of the total)
        currency: 'INR',
        purpose: 'payout',
        fund_account: {
          account_type: 'bank_account',
          contact: {
            name: youtuber?.name,
            email: youtuber?.email,
          },
          bank_account: {
            name: youtuber?.name,
            ifsc: youtuber?.ifsc,
            account_number: youtuber?.accountNumber,
          },
        },
      };

      // Send payout request to Razorpay
      const payoutResponse = await axios.post('https://api.razorpay.com/v1/payouts', payoutOptions, {
        auth: {
          username: process.env.RAZORPAY_KEY_ID || "",
          password: process.env.RAZORPAY_KEY_SECRET || ""
        }
      });

      // Check if payout was successful
      if (payoutResponse.data && payoutResponse.data.status === "processed") {
        console.log('Payout created:', payoutResponse.data);

        // Add video to Redis queue for the YouTuber
       

        res.json({ message: 'Payment successful' });
      } else {
        res.status(500).json({ message: 'Failed to initiate payout to YouTuber' });
      }
    } else {
      res.status(400).json({ message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
});


app.post('/youtuber/:youtuberId/payout-details', async (req, res) => {
  const { youtuberId } = req.params;
  const { ifsc, accountNumber } = req.body;

  try {
    // Find the YouTuber by ID
    const youtuber = await prisma.youtuber.findUnique({
      where: { id: youtuberId },
    });

    if (!youtuber) {
      return res.status(404).json({ message: "YouTuber not found" });
    }

    // Ensure both IFSC and account number are provided
    if (!ifsc || !accountNumber) {
      return res.status(400).json({ message: "IFSC code and account number are required" });
    }

    // Update the YouTuber's payout details in the database
    const updatedYoutuber = await prisma.youtuber.update({
      where: { id: youtuberId },
      data: {
        ifsc,
        accountNumber,
      },
    });

    return res.json({ message: "Payout details updated successfully", youtuber: updatedYoutuber });

  } catch (error) {
    console.error("Error updating payout details:", error);
    return res.status(500).json({ message: "An error occurred while updating payout details" });
  }
});
app.get('/youtuber/:youtuberId/payments', async (req, res) => {
  const { youtuberId } = req.params;

  try {
    const payments = await prisma.payment.findMany({
      where: { youtuberId },
      select: {
        amount: true,
        currency: true,
        status: true,
        orderId: true,
        createdAt: true,
      },
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});




app.put('/youtuber/:youtuberId/update', async (req, res) => {
  const { youtuberId } = req.params;
  const { name, password, channelLink, email, ifsc, accountNumber, timeout, charge, phoneNumber } = req.body;

  try {
    // Find the YouTuber by ID
    const youtuber = await prisma.youtuber.findUnique({
      where: { id: youtuberId },
    });

    if (!youtuber) {
      return res.status(404).json({ message: "YouTuber not found" });
    }

    // Prepare data for update
    const updateData: any = {};

    if (name) updateData.name = name;
    if (channelLink) updateData.channelLink = channelLink;
    if (ifsc) updateData.ifsc = ifsc;  // Assuming the IFSC and accountNumber fields exist in the database
    if (accountNumber) updateData.accountNumber = accountNumber;
    if (timeout) updateData.timeout = timeout;
    if (charge) updateData.charge = charge;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    // Hash the password if it is provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update the YouTuber in the database
    const updatedYoutuber = await prisma.youtuber.update({
      where: { id: youtuberId },
      data: updateData,
    });

    return res.json({ message: "User details updated successfully", youtuber: updatedYoutuber });

  } catch (error) {
    console.error("Error updating YouTuber:", error);
    return res.status(500).json({ message: "An error occurred while updating user details" });
  }
});



const generateCloudinarySignature = (paramsToSign: string): string => {
  return crypto
    .createHash('sha256')
    .update(paramsToSign+process.env.CLOUDINARY_API_SECRET)
    .digest('hex');
};

// Generate signature for Cloudinary upload
app.get('/get-signature', (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'uploads';
    const uploadPreset = 'ml_default'; // Include the upload preset
    
    // Include all parameters that need to be signed
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`;
    const signature = generateCloudinarySignature(paramsToSign);
    res.json({
      signature,
      timestamp,
      folder,
      uploadPreset,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
});

// Save upload details
app.post('/upload/:userId', async (req, res) => {
  const { url, public_id, resource_type,time } = req.body;
  const userId = req.params.userId;
  console.log(userId)
  if (!userId || !url) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      details: !userId ? 'userId is required' : 'url is required'
    });
  }

  try {
    const videoData = {
      url,
      public_id: public_id || null,
      resource_type: resource_type || 'video',
      uploaded_at: new Date().toISOString(),
      time: time || null,
    };
    console.log(videoData)
    // Save to Redis with expiration (e.g., 24 hours)
    const key = `user:${userId}:videos`;
    console.log(key)
    await redisClient.rPush(key, JSON.stringify(videoData));
    await redisClient.expire(key, 24 * 60 * 60); // 24 hours TTL

    res.json({ 
      message: 'Upload details saved successfully', 
      data: videoData 
    });
  } catch (error) {
    console.error('Error saving upload details:', error);
    res.status(500).json({ 
      error: 'Failed to save upload details',
      details: error
    });
  }
});

// Get user's videos
app.get('/user/:userId/videos', async (req, res) => {
  const userId = req.params.userId;
  console.log("working...")
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get all videos instead of just popping one
    const key = `user:${userId}:videos`;
    console.log(key)
    const videos = await redisClient.lRange(key, 0, -1);
    console.log(videos)
    if (!videos || videos.length === 0) {
      console.log("no videos found")
      return res.status(404).json({ message: 'No videos found' });
    }

    const parsedVideos = videos.map(video => JSON.parse(video));
    console.log(parsedVideos)
    res.json({ videos: parsedVideos });
  } catch (error) {
    console.error('Error retrieving videos:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve videos',
      details: error
    });
  }
});


app.listen(port, () =>{
    console.log(`Server is running at http://localhost:${port}`);
  });








