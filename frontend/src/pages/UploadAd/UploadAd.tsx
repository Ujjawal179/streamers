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
    const [media, setMedia] = React.useState<File | null>(null);

    const handleSizeChange = (event: SelectChangeEvent<number>) => {
        setSize(Number(event.target.value));
    };

    const handlePositionChange = (event: SelectChangeEvent<number>) => {
        setPosition(Number(event.target.value));
    };

    const handleTimeDurationChange = (event: Event, value: number | number[]) => {
        setTimeDuration(Array.isArray(value) ? value[0] : value);
    };

    const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setMedia(event.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (media) {
            try {
                await uploadMedia(media);
                alert("Media uploaded successfully!");
            } catch (error) {
                alert("Failed to upload media. Please try again.");
            }
        } else {
            alert("Please select a media file to upload.");
        }
    };

    return (
        <>
        <div style={{minHeight:'100vh'}}>
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Upload Your Advertisement for Streamer: {id}
            </Typography>
            <FormControl variant="standard" fullWidth>
                <Box
                    sx={{
                        margin: "auto",
                        width: "50%",
                        border: "2px black dotted",
                        borderRadius: "20px",
                        minHeight: "300px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        mb: 2,
                    }}
                >
                    <input
                        type="file"
                        id="mediaUpload"
                        name="media"
                        accept="image/*,video/*"
                        onChange={handleMediaChange}
                        aria-label="Upload Media"
                    />
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
        <div className="streamer" style={{display:"flex", flexDirection:'column', background:"#3a76d6" , color:"white", borderRadius: "50% / 100px 100px 0 0", marginTop:'60px', paddingTop:'60px', minHeight:'100vh'}}>
            <h1 style={{textAlign:'center', padding:'20px'}}>Know More about streamer!!</h1>
            <div className="about-streamer" style={{display:'flex', alignContent:'center', justifyContent:'center', flexWrap:'wrap'}}>
                    <img src="https://yt3.googleusercontent.com/aeR0gGkDfPbQqy8QgJHUJ6D7LArHl-PZP0TUX_fozFhpvlJIXb2MPoWrJfiLL1vdUaMwXCfr=s900-c-k-c0x00ffffff-no-rj" alt="Streamer" style={{maxWidth:'400px', borderRadius:'15px', width:'60%' , objectFit: 'cover'}}/>
                <div className="details" style={{maxWidth:'450px', margin:'30px', width:"60%"}}>
                    <div className="name">
                        <h2 style={{textAlign:"center"}}>Streamer Name</h2>
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
