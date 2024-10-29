import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    FormControl,
    Button,
    Box,
    Typography,
    CircularProgress,
} from "@mui/material";
import { uploadMedia } from "../../api/UploadMedia";
import {useRazorpay} from 'react-razorpay';
import { getUsernameById } from "../../api/userService";

const UploadAd: React.FC = () => {
    const { userId } = useParams<{ userId: string }>(); // Extract userId from URL
    const companyId= localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : '';
    console.log(companyId);
    const [file, setFile] = useState<File | null>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false); // State to manage loading
    const {Razorpay}= useRazorpay();
    const [username, setUsername] = useState<string | null>(null);
    const [charge, setCharge] = useState<number | null>(null);
    const [isUsernameLoading, setIsUsernameLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUsername = async () => {
          setIsUsernameLoading(true);
          if (userId) {
            const result = await getUsernameById(userId);
            
            if ('username' in result && 'charge' in result) {
                setUsername(result.username ?? null);
                setCharge(result.charge ?? null);
                console.log(result.charge);
            } else {
              alert(result.message);
              window.location.href = "/"; // Redirect to home page if user not found
            }
          }
          setIsUsernameLoading(false);
        };
    
        fetchUsername();
      }, [userId]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            extractVideoDuration(droppedFile);
        }
        setIsHovered(false);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            extractVideoDuration(uploadedFile);
        }
    };

    const extractVideoDuration = (file: File) => {
        const videoElement = document.createElement("video");
        videoElement.src = URL.createObjectURL(file);

        videoElement.onloadedmetadata = () => {
            setVideoDuration(videoElement.duration);
            if (videoElement.duration > 30) {
            alert("Maximum video duration is 30 seconds so the initial 30 seconds will be uploaded");
            setVideoDuration(30);
            }
        };
    };

    const handleSubmit = async () => {
        if (file) {
            setIsLoading(true);  // Set loading to true when the process starts
            try {
                if(!userId){
                    return alert("Please provide a valid Streamer");
                }
                if (videoDuration !== null) {
                    await uploadMedia(file, userId, companyId, videoDuration,Razorpay); // Pass userId and companyId
                    alert("Media uploaded successfully!");
                } else {
                    alert("Failed to get video duration. Please try again.");
                }
                alert("Media uploaded successfully!");
            } catch (error) {
                alert("Failed to upload media. Please try again.");
            } finally {
                setIsLoading(false);  // Set loading to false when the process finishes
            }
        } else {
            alert("Please select a media file to upload.");
        }
    };

    const handleDragEnter = () => {
        setIsHovered(true);
    };

    const handleDragLeave = () => {
        setIsHovered(false);
    };

    return (
        <>
        {isUsernameLoading ? (
            <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '95vh',
            }}
            >
            <CircularProgress />
            </Box>
        ) : (
            <div style={{ minHeight: '95vh' }}>
            <Box sx={{ p: { xs: 1, sm: 2, md: 3, lg: 4 } }} alignItems={'center'}>
                <Typography variant="h5" gutterBottom>
                Upload Your Advertisement for Streamer: {username || "Loading..."}
                </Typography>
                <FormControl variant="standard" fullWidth>
                <Box
                    sx={{ my: { xs: 2, sm: 3, md: 4, lg: 5 },
                    margin: "auto",
                    textAlign: "center",
                    width: "60%",
                    border: "2px dashed #ccc",
                    borderRadius: "20px",
                    height: "250px",
                    minWidth: "300px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    mb: 2,
                    backgroundColor: isHovered ? "grey" : "#fff",
                    color: isHovered ? "#fff" : "#000",
                    transition: "background-color 0.3s ease",
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                >
                    {file ? (
                    <div style={{ marginTop: "10px", position: 'absolute', width: '50%', textAlign: 'center' }}>
                        <p>{isHovered ? "Drop it like it's hot!" : `Uploaded file: ${file.name}`}</p>
                        <h3>{isHovered ? "" : `Duration: ${videoDuration ? `${Math.round(videoDuration)} seconds`: "Loading..."}`}</h3>
                        <h3>{isHovered ? "" : `Charges: ₹${charge && videoDuration !== null ? (videoDuration * charge).toFixed(2) : "Loading..."} (Rate: ₹${charge}/second)`}</h3>
                    </div>
                    ) : (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "absolute",
                    }}>
                        {isHovered ? null : <img src="/dropfile.png" alt="Drop file here" style={{ height: '150px', paddingTop: '15px' }} />}
                        <p>{isHovered ? "Drop it like it's hot!" : "Drag and drop a file here or click to upload"}</p>
                    </div>
                    )}
                    <input type="file" accept="video/*" onChange={handleFileChange} style={{ width: '100%', minHeight: "250px", minWidth: "300px", opacity: '0' }} />
                </Box>

                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    style={{ height: '60px', width: '50%', maxWidth: '250px', fontSize: '1.25rem', fontWeight: 'bold', margin: 'auto' }}
                    disabled={!file || isLoading} // Disable button if loading
                >
                    {isLoading ? <CircularProgress size={24} /> : "Continue"}  {/* Show loading spinner when isLoading */}
                </Button>
                </FormControl>
            </Box>
            </div>
        )}
        </>
    );
};

export default UploadAd;
