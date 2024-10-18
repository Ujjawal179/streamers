import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
    FormControl,
    Button,
    Box,
    Typography,
} from "@mui/material";
import { uploadMedia } from "../../api/UploadMedia";

const UploadAd: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [file, setFile] = useState<File | null>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [videoDuration, setVideoDuration] = useState<number | null>(null); // State for video duration

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
          setFile(droppedFile);
          extractVideoDuration(droppedFile); // Extract duration when file is dropped
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
          extractVideoDuration(uploadedFile); // Extract duration when file is uploaded
        }
    };

    // Function to extract video duration
    const extractVideoDuration = (file: File) => {
        const videoElement = document.createElement("video");
        videoElement.src = URL.createObjectURL(file);

        videoElement.onloadedmetadata = () => {
            setVideoDuration(videoElement.duration);
        };
    };

    const handleSubmit = async () => {
        if (file) {
            try {
                await uploadMedia(file,"1");
                alert("Media uploaded successfully!");
            } catch (error) {
                alert("Failed to upload media. Please try again.");
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
        <div style={{ minHeight: '80vh' }}>
            <Box sx={{ p: { xs: 1, sm: 2, md: 3, lg: 4 } }} alignItems={'center'}>
                <Typography variant="h4" gutterBottom>
                    Upload Your Advertisement for Streamer: {id}
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
                                <h3>{isHovered ? "" : `Total duration: ${videoDuration ? `${Math.round(videoDuration)} seconds` : "Loading..."}`}</h3>
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
                        <input  type="file" accept="video/*"  onChange={handleFileChange} style={{ width: '100%', minHeight: "250px", minWidth: "300px", opacity: '0' }} />
                    </Box>

                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        style={{ height: '60px', width: '50%', maxWidth: '250px', fontSize: '1.25rem', fontWeight: 'bold', margin: 'auto' }}
                        disabled={!file}
                    >
                        Continue
                    </Button>
                </FormControl>
            </Box>
        </div>
        
        
        <div className="streamer" style={{display:"flex", flexDirection:'column', background:"#4c76da" , color:"white", borderRadius: "50% / 100px 100px 0 0", marginTop:'60px', paddingTop:'60px', paddingBottom:'60px', minHeight:'80vh'}}>
            <h2 style={{textAlign:'center', padding:'5px'}}>Know More about streamer!!</h2>
            <div className="about-streamer" style={{display:'flex', alignContent:'center', justifyContent:'center', flexWrap:'wrap'}}>
                    <img src="https://resource-cdn.obsbothk.com/product_system_back/product_img/gamestreamer.jpg" alt="Streamer" style={{maxWidth:'400px', borderRadius:'15px', width:'70%' , objectFit: 'cover', margin:'25px'}}/>
                <div className="details" style={{ maxWidth: '450px', width: '60%', margin: '5px' }}>
                    <div className="name">
                        <h2 style={{ textAlign: 'center' }}>Streamer Name</h2>
                    </div>
                    <div className="desc">
                        <p>Streamer Description: Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt commodi qui ducimus? Libero corrupti ea placeat perspiciatis sint nam. Explicabo consectetur ducimus reprehenderit ullam quidem iste sit cumque perspiciatis sequi!</p>
                    </div>
                    <div className="channels">
                        <h3>Channels</h3>
                        <div className="channel">
                            <h4>Channel 1</h4>
                            <p>Channel 1 description</p>
                        </div>
                        <div className="channel">
                            <h4>Channel 2</h4>
                            <p>Channel 2 description</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default UploadAd;
