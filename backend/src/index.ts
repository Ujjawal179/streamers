import express from "express";
import cors from "cors";
import {createClient} from 'redis';
import prisma from "./db/db";
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import bcrypt from 'bcrypt';
// import multer from 'multer';
// import PinataClient  from '@pinata/sdk';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
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
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Endpoint for creating a payment order
app.post('/create-payment', async (req, res) => {
  const { companyId, youtuberId, amount } = req.body;

  try {
    const paymentOrder = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${youtuberId}_${companyId}`,
      payment_capture: true // Auto-capture payment

    });

     await prisma.payment.create({
      data: {
        companyId,
        youtuberId,
        amount,
        orderId: paymentOrder.id,
        status: 'created',
      },
    });
    

    res.json({
      orderId: paymentOrder.id,
      amount: amount,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Endpoint for verifying and updating payment status
app.post('/verify-payment', async (req, res) => {
  const { orderId, paymentId, signature, videoHash,time } = req.body; // videoHash is now passed by the company

  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ||"")
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (signature === expectedSignature) {
      // Update payment status
      await prisma.payment.update({
        where: { orderId },
        data: { status: 'paid', paymentId },
      });

      // Transfer the payment to the YouTuber's bank account using Razorpay Payout
      const youtuber = await prisma.youtuber.findUnique({
        where: { id: payment.youtuberId },
      });
      if(!youtuber){

        return res.status(404).json({ message: 'Youtuber not found' });
      }

      const payoutOptions = {
        account_number: 'YOUR_RAZORPAY_ACCOUNT', // Your Razorpay account number
        amount: payment.amount * 100, // Amount in paise
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

      const payoutResponse = await axios.post('https://api.razorpay.com/v1/payouts', payoutOptions, {
        auth: {
          username: process.env.RAZORPAY_KEY_ID||"",
          password: process.env.RAZORPAY_KEY_SECRET||""
        }
      });
      console.log('Payout created:', payoutResponse);

      // After successful payout, add video to Redis queue for the Youtuber
      await redisClient.rPush(`user:${youtuber.id}:videos`, JSON.stringify({
        videoHash: videoHash,
        time:time
      }));

      res.json({ message: 'Payment successful, payout initiated, and video added to Redis queue' });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
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
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});



app.put('/youtuber/:youtuberId/update', async (req, res) => {
  const { youtuberId } = req.params;
  const { name, password, channelLink, email, ifsc, accountNumber } = req.body;

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



// app.post('/upload/:userId', async (req, res) => {
//   const { hash } = req.body;
//   const user_id  = req.params.userId;
//   if (!user_id) {
//       return res.status(400).json({ message: 'No user_id provided' });
//   }
  
//   if (!hash) {
//       return res.status(400).json({ message: 'No hash provided' });
//   }

//   try {
//       // Here you would typically save the hash to your database
//       // For example:
//       // await saveHashToDatabase(hash);
    
//       // console.log("Received hash:", hash);
//       redisClient.rPush(`user:${user_id}:video`, hash)
//       res.json({ message: 'Hash received and saved successfully' });
//   } catch (error) {
//       console.error('Error saving hash:', error);
//       res.status(500).json({ message: 'Failed to save hash' });
//   }
// });

//redis lpop endpoints
app.get('/user/:userId/videos', async (req, res) => {
  const user_id  = req.params.userId;
  if (!user_id) {
      return res.status(400).json({ message: 'No user_id provided' });
  }

  try {
    // const hash = await redisClient.lIndex(`user:${user_id}:video`, 0);
    const hash = await redisClient.lPop(`user:${user_id}:video`);

    console.log("success", hash);
    if (!hash) {
      return res.status(404).json({ message: 'No hashes available' });
    }
    res.json({ video: `https://gateway.pinata.cloud/ipfs/${hash}` });
  } catch (error) {
      console.error('Error retrieving hashes:', error);
      res.status(500).json({ message: 'Failed to retrieve hashes' });
  }
});
// app.get('/user/1/videos', async (req, res) => {
//   const user_id  = 1;
//   if (!user_id) {
//       return res.status(400).json({ message: 'No user_id provided' });
//   }

//   try {
//     const hash= await redisClient.lIndex(`user:${user_id}:video`,0);
//     console.log("success",hash)
//     if (!hash) {
//       return res.status(404).json({ message: 'No hashes available' });
//     }
//     res.json({ video:`https://gateway.pinata.cloud/ipfs/${hash}` });
     

//   } catch (error) {
//       console.error('Error retrieving hashes:', error);
//       res.status(500).json({ message: 'Failed to retrieve hashes' });
//   }
// });
// Define a route to handle POST requests at the "/api/echo" path
app.listen(port, () =>{
    console.log(`Server is running at http://localhost:${port}`);
  });










// const __dirname = path.dirname(new URL(import.meta.url).pathname);
// const pinata = new PinataClient(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
// const upload = multer({ dest: 'uploads/' });

// app.post('/upload', upload.single('file'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ message: 'No file uploaded' });
//     }
//     console.log("received file:", req.file);

//     const filePath = path.join(__dirname, req.file.path);
//     console.log("File path:", filePath);

//     try {
//         const hash = await uploadVideoToPinata(filePath);
//         console.log("Pinata hash:", hash);
//         res.json({ hash });
//     } catch (error: unknown) {
//         let errorMessage = 'Failed to upload video to Pinata';
//         if (error instanceof Error) {
//             errorMessage += `: ${error.message}`;
//         }
//         res.status(500).json({ message: errorMessage });
//     } finally {
//         fs.unlink(filePath, (err) => {
//             if (err) console.error("Error deleting file:", err);
//         });
//     }
// });

// async function uploadVideoToPinata(filePath: string) {
//     try {
//         const readableStreamForFile = fs.createReadStream(filePath);
//         const options = {
//             pinataMetadata: {
//                 name: path.basename(filePath),
//             },
//         };
//         console.log("Uploading to Pinata...");

//         const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
//         console.log("Pinata result:", result);
//         return result.IpfsHash;
//     } catch (error: unknown) {
//         if (error instanceof Error) {
//             throw new Error('Error uploading file to Pinata: ' + error.message);
//         } else {
//             throw new Error('Error uploading file to Pinata: ' + String(error));
//         }
//     }
// }