import React from "react";
import { useParams } from "react-router-dom";
import {
    InputLabel,
    MenuItem,
    FormControl,
    Button,
    Select,
    SelectChangeEvent,
    Slider,
    Box,
    Typography,
} from "@mui/material";
import { uploadMedia } from "../../api/UploadMedia";

const UploadAd: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [size, setSize] = React.useState<number>(0);
    const [position, setPosition] = React.useState<number>(0);
    const [timeDuration, setTimeDuration] = React.useState<number>(10);
    const [file, setFile] = React.useState<File | null>(null);
    const [isHovered, setIsHovered] = React.useState<boolean>(false);

    const handleSizeChange = (event: SelectChangeEvent<number>) => {
        setSize(Number(event.target.value));
    };

    const handlePositionChange = (event: SelectChangeEvent<number>) => {
        setPosition(Number(event.target.value));
    };

    const handleTimeDurationChange = (event: Event, value: number | number[]) => {
        setTimeDuration(Array.isArray(value) ? value[0] : value);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
          setFile(droppedFile);
        }
        setIsHovered(false); // Reset hover state on drop
      };
    
      const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
      };

      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
          setFile(uploadedFile);
        }
      };

    const handleSubmit = async () => {
        if (file) {
            try {
                await uploadMedia(file);
                alert("Media uploaded successfully!");
            } catch (error) {
                alert("Failed to upload media. Please try again.");
            }
        } else {
            alert("Please select a media file to upload.");
        }
    };

    const handleDragEnter = () => {
        setIsHovered(true); // Set hover state when user drags over
      };
    
    const handleDragLeave = () => {
        setIsHovered(false); // Reset hover state when user leaves the area
      };
    return (
        <>
        <div style={{minHeight:'100vh'}}>
        <Box sx={{ p: { xs: 1, sm: 2, md: 3, lg: 4 } }}>
            <Typography variant="h4" gutterBottom>
                Upload Your Advertisement for Streamer: {id}
            </Typography>
            <FormControl variant="standard" fullWidth>
                <Box
                    sx={{
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
                        backgroundColor: isHovered ? "grey" : "#fff", // Dark background on hover
                        color: isHovered ? "#fff" : "#000", // White text on hover
                        transition: "background-color 0.3s ease", // Smooth transition
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                >
                  {file ? (
                    <div style={{ marginTop: "10px", position:'absolute', width:'50%', textAlign:'center' }}>
                        <p>{isHovered ? "Drop it like it's hot!" : `Uploaded file: ${file.name}`}</p>
                    </div>
                  ) : (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "absolute",
                        }}>
                            {isHovered ? null : <img src="/dropfile.png" alt="Drop file here" style={{height:'150px', paddingTop:'15px'}}/> }
                            <p>{isHovered ? "Drop it like it's hot!" : "Drag and drop a file here or click to upload"}</p>
                    </div>
                  )}
                
          
                <input type="file" onChange={handleFileChange} style={{width:'100%', minHeight: "250px", minWidth: "300px", opacity:'0'}}/>
          
                </Box>

                <FormControl variant="standard" fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="size-label">Size</InputLabel>
                    <Select
                        labelId="size-label"
                        id="size"
                        value={size}
                        onChange={handleSizeChange}
                        label="Size"
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        <MenuItem value={3}>Small</MenuItem>
                        <MenuItem value={2}>Medium</MenuItem>
                        <MenuItem value={1}>Large</MenuItem>
                    </Select>
                </FormControl>

                <FormControl variant="standard" fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="position-label">Position</InputLabel>
                    <Select
                        labelId="position-label"
                        id="position"
                        value={position}
                        onChange={handlePositionChange}
                        label="Position"
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        <MenuItem value={0}>Top Left</MenuItem>
                        <MenuItem value={1}>Top Right</MenuItem>
                        <MenuItem value={2}>Bottom Left</MenuItem>
                        <MenuItem value={3}>Bottom Right</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="h6" gutterBottom>
                    Select Time Duration:
                </Typography>
                <Slider
                    aria-label="Time Duration"
                    defaultValue={timeDuration}
                    onChange={handleTimeDurationChange}
                    valueLabelDisplay="auto"
                    step={5}
                    marks
                    min={5}
                    max={120}
                    sx={{ mb: 2 }}
                />

                <Button variant="contained" onClick={handleSubmit}>
                    Submit
                </Button>
            </FormControl>
        </Box>
        </div>
        <div className="streamer" style={{display:"flex", flexDirection:'column', background:"#4c76da" , color:"white", borderRadius: "50% / 100px 100px 0 0", marginTop:'60px', paddingTop:'60px', minHeight:'100vh'}}>
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
