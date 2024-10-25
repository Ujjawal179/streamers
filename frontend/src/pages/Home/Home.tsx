import React from 'react';
import { Box, Button, TextField } from '@mui/material';

const Home: React.FC = () => {
    const [charge, setCharge] = React.useState('');
    const [duration, setDuration] = React.useState('');

    const handleChargeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCharge(event.target.value);
    };

    const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDuration(event.target.value);
    };

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
                    maxWidth:'400px'}}>
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
                    <Button variant="contained" size="large" style={{ marginTop: '20px' }}
                        onClick={() => window.location.href = '/signup'}>
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
                backgroundColor: 'antiquewhite',
                alignContent: 'center',
                flexWrap: 'wrap-reverse',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh', gap: '10px'
            }}
            >
                
                <div className="image">
                    <img src="/advertiser.png" alt="Home" style={{ width:'100%', maxWidth:'500px'}}/>
                </div>
                <div className="content" style={{
                    maxWidth:'400px'}}>
                    <h1 style={{textTransform:'uppercase', fontStyle: 'italic', fontFamily:'monospace'}}>
                        Brand campaigns
                        <br />
                        In live streaming
                    </h1>
                    <p>
                    Leverage the power of the new Streamers self-service platform and reimagine how you activate audiences in Live Streaming.
                    </p>
                    <Button variant="contained" size="large" style={{ marginTop: '20px' }}
                        onClick={() => window.location.href = '/signup'}>
                        SetUp a Campaign
                    </Button>
                </div>
            </Box>
            <Box
            sx={{
                padding: '20px',
                display: 'flex',
                alignContent: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '90vh', gap: '30px'
            }}
            >
                <div className="content" style={{
                    maxWidth:'400px'}}>
                    <h1 style={{textTransform:'uppercase', fontStyle: 'italic', fontFamily:'monospace'}}>
                        LET'S TALK
                        <br />
                        ABOUT MONEY!!
                    </h1>
                    <p>
                    Play around with the deal calculator to get an idea of your revenue potential.
                    </p>
                    <p>
                    Simply enter the data in the deal calculator and get more information about how the money flows.
                    </p>
                    <Button 
                        variant="contained" 
                        size="large" 
                        style={{ marginTop: '20px' }} 
                        onClick={() => window.location.href = '/signup'}
                    >
                        SetUp a Campaign
                    </Button>
                </div>
                <div className="calculator" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '400px',
                    padding: '20px',
                    border: '1px solid black',
                    borderRadius: '10px',
                    boxShadow: 'rgb(88 118 222) 9px 9px 0px, rgb(68 78 129) 19px 19px 0px',
                    margin: '20px',
                }}>
                    <div className="info">
                        <h3>Deal Calculator</h3>
                        <p>Calculate your potential earnings and charges</p>
                    </div>

                    <div className="input" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <TextField
                            id="charge"
                            label="Streamer's Charge"
                            variant="outlined"
                            value={charge}
                            onChange={handleChargeChange}
                            style={{ width: '100%'}}/>
                        <TextField
                            id="duration"
                            label="Advertisement Duration"
                            variant="outlined"
                            value={duration}
                            onChange={handleDurationChange}
                            style={{ width: '100%'}}/>
                        
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                alignItems: 'center',
                                maxWidth: '300px',
                                border: '1px dashed black',
                                padding: '10px',
                            }}
                        >
                            <div>Advertisement Charges: </div>
                            <div><strong>{(Number(duration) * Number(charge)).toFixed(2)}</strong></div>
                            <div>Streamers Earning: </div>
                            <div><strong>{(Number(duration) * Number(charge) * 0.7).toFixed(2)}</strong></div>
                        </Box>
                    </div>
                </div>

            </Box>
        </>
    );
};

export default Home;