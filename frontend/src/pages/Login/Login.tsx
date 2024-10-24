import React, { useState } from 'react';
import { TextField, Button, Grid, ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { loginUser } from '../../api/userService';

function Login() {
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('youtuber');
    const [error, setError] = useState<string | null>(null);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleRoleChange = (event: React.MouseEvent<HTMLElement>, newRole: string | null) => {
        if (newRole !== null) {
            setUserType(newRole);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        const result = await loginUser({ email, password, userType });
    
        if (result.success) {
          // Redirect to another page, like the dashboard
          window.location.href = '/'; // You can use React Router to navigate instead
        } else {
          // Display the error message
          setError(result.message ?? null);
          console.error(result);
        }
      };

    return(
        <Box display="flex" flexWrap='wrap-reverse' justifyContent="center" alignItems="center" minHeight="90vh" padding={'10px'}>
            <Grid container spacing={3} justifyContent="center" alignItems="center" >
                {window.innerWidth > 600 && (
                    <Grid item xs={12} sm={6} md={4}>
                        {userType === 'youtuber' ? (
                            <img src={'/creator.png'} alt="Creator" style={{ width: '100%', height: 'auto' , animation: 'fadeIn 1s'}} />
                        ) : (
                            <img src={'/advertiser.png'} alt="Advertiser" style={{ width: '100%', height: 'auto' , animation: 'fadeIn 1s'}} />
                        )}
                    </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" flexDirection="column" >
                        <h1 className='heading'>Welcome Back!!</h1>
                        <span>If you don't have an account, <a href="/signup" style={{textDecoration:"none"}}>Sign Up</a>, else Log In to continue!</span>
                        <ToggleButtonGroup
                            color="primary"
                            value={userType}
                            exclusive
                            onChange={handleRoleChange}
                            aria-label="Role"
                            style={{ margin: '20px' }}
                        >
                            <ToggleButton value="youtuber">Creator</ToggleButton>
                            <ToggleButton value="company">Advertiser</ToggleButton>
                        </ToggleButtonGroup>
                        <TextField
                            id="email"
                            label="Email"
                            type="mail"
                            variant="standard"
                            value={email}
                            onChange={handleEmailChange}
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
                                Log In
                            </Button>
                        </form>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Login;