import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // You can add your custom styles here

function App() {
    const [videoFile, setVideoFile] = useState(null);
    const [message, setMessage] = useState('');
    const [videoUrl, setVideoUrl] = useState('');

    const handleFileChange = (event) => {
        setVideoFile(event.target.files[0]);
    };

    const uploadVideo = async () => {
        if (!videoFile) {
            alert('Please select a video file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', videoFile);

        try {
            // POST request to backend to handle Pinata upload
            const response = await axios.post('http://localhost:3005/upload', formData);
            const { hash } = response.data;
            setMessage('Upload Successful! IPFS Hash: ' + hash);

            // Fetch the video URL using the hash
            fetchVideoUrl(hash);

            // Post the IPFS hash to another API
            await postHash(hash);
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const fetchVideoUrl = async (hash) => {
        try {
            const response = await axios.get(`http://localhost:3005/video/${hash}`);
            setVideoUrl(response.data.videoUrl);
        } catch (error) {
            setMessage(prev => prev + '\nError fetching video URL: ' + (error.response?.data?.message || error.message));
        }
    };

    const postHash = async (hash) => {
        try {
            const response = await axios.post('http://localhost:3005/api/receive-hash', {
                hash,
            });

            if (response.status === 200) {
                setMessage(prev => prev + '\nHash posted to API successfully!');
            } else {
                throw new Error('Failed to send hash to API');
            }
        } catch (error) {
            setMessage(prev => prev + '\nError posting hash to API: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="App">
            <h1>Upload Your Video</h1>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            <button onClick={uploadVideo}>Upload</button>
            <p>{message}</p>
            {videoUrl && (
                <div>
                    <h2>Video Preview:</h2>
                    <video width="600" controls>
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
        </div>
    );
}

export default App;
