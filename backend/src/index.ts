import express from "express";
import cors from "cors";
import multer from 'multer';
import PinataClient  from '@pinata/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Create a new express application
const app = express();
app.use(express.json());
app.use(cors());
// Define a route to handle GET requests at the root path ("/")
app.get("/", (req, res) => {
  // Send a JSON response with the message "Hello, World!"
  res.json({ message: "Hello, World!" });
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pinata = new PinataClient(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// Endpoint to handle video uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // const filePath = path.join(__dirname, req.file.path);
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    

    try {
        const hash = await uploadVideoToPinata(filePath);
        res.json({ hash });
    } catch (error: unknown) {
      let errorMessage = 'Failed to upload video to Pinata';
      if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ message: errorMessage });
      }
     finally {
        fs.unlinkSync(filePath); // Clean up uploaded file
    }
});
async function uploadVideoToPinata(filePath: string) {
  try {
      const readableStreamForFile = fs.createReadStream(filePath);
      const options = {
          pinataMetadata: {
              name: path.basename(filePath),
          },
      };

      const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
      return result.IpfsHash;
  } catch (error: unknown) {
    if (error instanceof Error) {
        throw new Error('Error uploading file to Pinata: ' + error.message);
    } else {
        throw new Error('Error uploading file to Pinata: ' + String(error));
    }
}
}
// Define a route to handle POST requests at the "/api/echo" path
