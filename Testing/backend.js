import express from 'express';
import multer from 'multer';
import PinataClient  from '@pinata/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3005;
import cors from 'cors'; // Import the cors package
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pinata API credentials
const PINATA_API_KEY = '2beb59cb7381843fcbf8';
const PINATA_SECRET_API_KEY = 'b7119f5b469bd15168973cd01fab7f0e5d4d2bd091b1a6402c6a26d5f9876041';

// Initialize Pinata
const pinata = new PinataClient(PINATA_API_KEY, PINATA_SECRET_API_KEY);

const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// Endpoint to handle video uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const filePath = path.join(__dirname, req.file.path);
    
    try {
        const hash = await uploadVideoToPinata(filePath);
        res.json({ hash });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload video to Pinata', error: error.message });
    } finally {
        fs.unlinkSync(filePath); // Clean up uploaded file
    }
});

async function uploadVideoToPinata(filePath) {
    try {
        const readableStreamForFile = fs.createReadStream(filePath);
        const options = {
            pinataMetadata: {
                name: path.basename(filePath),
            },
        };

        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
        return result.IpfsHash;
    } catch (error) {
        throw new Error('Error uploading file to Pinata: ' + error.message);
    }
}

// Endpoint to receive the hash
app.post('/api/receive-hash', express.json(), (req, res) => {
    const { hash } = req.body;
    console.log('Received hash:', hash);
    // Handle the received hash (e.g., store it or forward it)
    res.json({ message: 'Hash received successfully' });
});

app.get('/video/:hash', (req, res) => {
    const { hash } = req.params;
    const videoUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
    res.json({ videoUrl });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

