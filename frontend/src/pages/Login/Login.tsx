import React, { useState } from 'react';
import { TextField, Button, Grid, ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import PhoneInput from 'react-phone-number-input';
import { loginUser } from '../../api/userService';

function Login() {
    
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handlePhoneChange = (value?: string) => {
        setPhone(value || '');
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ( !phone || !password) {
            setError('All fields are required');
            return;
        }
        try {
            const response = await loginUser({ phone, password });
            console.log('User logged in successfully:', response);
            // Handle successful login (e.g., redirect, display message)
        } catch (error: any) {
            console.error('Error logging in:', error);
            setError(error.message || 'An error occurred');
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
                        <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="IN"
                            value={phone}
                            onChange={(value) => handlePhoneChange(value)}
                            style={{ margin: '10px', marginTop: '20px' }}
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
                        <Button variant="contained" color="primary" onClick={handleSubmit} style={{ marginTop: '20px' }}>
                            Sign Up
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Login;