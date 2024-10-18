import React from 'react';
import { Box, Button } from '@mui/material';

const Home: React.FC = () => {
    return (
        <>
            <Box
                sx={{
                    padding: '20px',
                    display: 'flex',
                    alignContent: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh'
                }}
            >
                <div className="content" style={{
                    maxWidth:'500px'}}>
                    <h1 style={{textTransform:'uppercase', fontStyle: 'italic', fontFamily:'monospace'}}>
                        Instant
                        <br />
                        Brand deals
                        <br />
                        for live streamers
                    </h1>
                    <p>
                        Streamers enables creators to sell slots for Branded Content on their live channels.
                        Directly, and within seconds.
                    </p>
                    <Button variant="contained" size="large" style={{ marginTop: '20px' }}>
                        Become a Streamer
                    </Button>
                </div>
                <div className="image">
                    <img src="/stream.png" alt="Home" style={{ width:'100%', maxWidth:'500px'}}/>
                </div>
            </Box>
            <Box
                sx={{
                    padding: '20px',
                    display: 'flex',
                    alignContent: 'center',
                    flexWrap: 'wrap-reverse',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh'
                }}
            >
                
                <div className="image">
                    <img src="/advertiser.png" alt="Home" style={{ width:'100%', maxWidth:'500px'}}/>
                </div>
                <div className="content" style={{
                    maxWidth:'500px'}}>
                    <h1 style={{textTransform:'uppercase', fontStyle: 'italic', fontFamily:'monospace'}}>
                        Brand campaigns
                        <br />
                        In live streaming
                    </h1>
                    <p>
                    Leverage the power of the new Streamers self-service platform and reimagine how you activate audiences in Live Streaming.
                    </p>
                    <Button variant="contained" size="large" style={{ marginTop: '20px' }}>
                        SetUp a Campaign
                    </Button>
                </div>
            </Box>
        </>
    );
};

export default Home;