import express, { Request, Response } from 'express';
import { Queue } from './queue'; // Assuming we have a custom Queue implementation

const app = express();
const port = 3003;

// Queue to store video hashes
const videoQueue = new Queue<string>();

// Current playing video hash
let currentVideoHash: string | null = null;

app.use(express.json());

// Endpoint to receive video hash from frontend
app.post('/add-video', (req: Request, res: Response) => {
    const { hash } = req.body;
    if (!hash) {
        return res.status(400).json({ error: 'Video hash is required' });
    }
    
    videoQueue.enqueue(hash);
    console.log(`Added video hash to queue: ${hash}`);
    
    if (!currentVideoHash) {
        playNextVideo();
    }
    
    res.status(200).json({ message: 'Video hash added to queue' });
});

// Endpoint to get current playing video
app.get('/current-video', (req: Request, res: Response) => {
    if (currentVideoHash) {
        res.json({ hash: currentVideoHash });
    } else {
        res.status(404).json({ message: 'No video currently playing' });
    }
});

// Function to play next video in queue
function playNextVideo() {
    if (!videoQueue.isEmpty()) {
        currentVideoHash = videoQueue.dequeue() ?? null;
        if (currentVideoHash) {
            console.log(`Now playing video: ${currentVideoHash}`);
        
            // Simulate video playback duration (e.g., 5 seconds)
            setTimeout(() => {
                console.log(`Finished playing video: ${currentVideoHash}`);
                currentVideoHash = null;
                playNextVideo(); // Play next video in queue
            }, 5000);
        }
    } else {
        console.log('No more videos in queue');
    }
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
// import express from 'express';
// import { Queue } from './queue'; // Assuming we have a custom Queue implementation

// const app = express();
// const port = 3000;

// // Queue to store video hashes
// const videoQueue = new Queue<string>();

// // Current playing video hash
// let currentVideoHash: string | null = null;

// app.use(express.json());

// // Endpoint to receive video hash from frontend
// app.post('/add-video', (req: Request, res:Response) => {
//     const { hash } = req.body;
//     if (!hash) {
//         return res.status(400).json({ error: 'Video hash is required' });
//     }
    
//     videoQueue.enqueue(hash);
//     console.log(`Added video hash to queue: ${hash}`);
    
//     if (!currentVideoHash) {
//         playNextVideo();
//     }
    
//     res.status(200).json({ message: 'Video hash added to queue' });
// });

// // Endpoint to get current playing video
// app.get('/current-video', (req, res) => {
//     if (currentVideoHash) {
//         res.json({ hash: currentVideoHash });
//     } else {
//         res.status(404).json({ message: 'No video currently playing' });
//     }
// });

// // Function to play next video in queue
// function playNextVideo() {
//     if (!videoQueue.isEmpty()) {
//         currentVideoHash = videoQueue.dequeue()!;
//         console.log(`Now playing video: ${currentVideoHash}`);
        
//         // Simulate video playback duration (e.g., 5 seconds)
//         setTimeout(() => {
//             console.log(`Finished playing video: ${currentVideoHash}`);
//             currentVideoHash = null;
//             playNextVideo(); // Play next video in queue
//         }, 5000);
//     } else {
//         console.log('No more videos in queue');
//     }
// }

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });