import express from "express";
import cors from "cors";
import {createClient} from 'redis';
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



app.post('/upload/:userId', async (req, res) => {
  const { hash } = req.body;
  const user_id  = req.params.userId;
  if (!user_id) {
      return res.status(400).json({ message: 'No user_id provided' });
  }
  
  if (!hash) {
      return res.status(400).json({ message: 'No hash provided' });
  }

  try {
      // Here you would typically save the hash to your database
      // For example:
      // await saveHashToDatabase(hash);
    
      // console.log("Received hash:", hash);
      redisClient.rPush(`user:${user_id}:video`, hash)
      res.json({ message: 'Hash received and saved successfully' });
  } catch (error) {
      console.error('Error saving hash:', error);
      res.status(500).json({ message: 'Failed to save hash' });
  }
});

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