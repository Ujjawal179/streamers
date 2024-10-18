import React, { useState } from 'react';
import { TextField, Button, Grid, ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { loginUser } from '../../api/userService';

function Login() {
    
    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleMailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMail(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        const result = await loginUser({ mail, password });
    
        if (result.success) {
          // Redirect to another page, like the dashboard
          window.location.href = '/'; // You can use React Router to navigate instead
        } else {
          // Display the error message
          setError(result.message);
        }
      };

    return(
        <Box display="flex" flexWrap='wrap-reverse' justifyContent="center" alignItems="center" minHeight="90vh" padding={'10px'}>
            <Grid container spacing={3} justifyContent="center" alignItems="center" >
                {window.innerWidth > 600 && (
                    <Grid item xs={12} sm={6} md={4}>
                        <img src={'/creator.png'} alt="Sign Up" style={{ width: '100%', height: 'auto' }} />
                    </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" flexDirection="column" >
                        <h1 className='heading'>Welcome Back!!</h1>
                        <span>If you don't have an account, <a href="/signup" style={{textDecoration:"none"}}>Sign Up</a>, else Log In to continue!</span>
                        <TextField
                            id="mail"
                            label="Mail"
                            type="mail"
                            variant="standard"
                            value={mail}
                            onChange={handleMailChange}
                            style={{ margin: '10px' }}
                            fullWidth
                        />
                        <TextField
                            id="password"
                            label="Password"
                            type="password"
                            variant="standard"
                            value={password}
                            onChange={handlePasswordChange}
                            style={{ margin: '10px' }}
                            fullWidth
                        />
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <Button variant="contained" color="primary" type="submit" style={{ marginTop: '20px' }}>
                                Sign Up
                            </Button>
                        </form>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Login;