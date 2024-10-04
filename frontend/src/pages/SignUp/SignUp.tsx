import React, { useState } from 'react';
import { TextField, Button, Grid, ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { signupUser } from '../../api/userService';

const SignUp: React.FC = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Creator');
    const [error, setError] = useState<string | null>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handlePhoneChange = (value?: string) => {
        setPhone(value || '');
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !password) {
            setError('All fields are required');
            return;
        }
        try {
            const response = await signupUser({ role, name, phone, password });
            console.log('User signed up successfully:', response);
            // Handle successful signup (e.g., redirect, display message)
        } catch (error: any) {
            console.error('Error signing up:', error);
            setError(error.message || 'An error occurred');
        }
    };

    const handleRoleChange = (event: React.MouseEvent<HTMLElement>, newRole: string) => {
        if (newRole !== null) {
            setRole(newRole);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" padding={'10px'}>
            <Grid container spacing={3} justifyContent="center" alignItems="center" >
                {window.innerWidth > 600 && (
                    <Grid item xs={12} sm={6} md={4}>
                        {role === 'Creator' ? (
                            <img src={'/creator.png'} alt="Creator" style={{ width: '100%', height: 'auto' , animation: 'fadeIn 1s'}} />
                        ) : (
                            <img src={'/advertiser.png'} alt="Advertiser" style={{ width: '100%', height: 'auto' , animation: 'fadeIn 1s'}} />
                        )}
                    </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                    <Box display="flex" flexDirection="column" >
                        <h1 className='heading'>Hello {role}!!</h1>
                        <span>Welcome to our platform, please sign up to continue!</span>
                        <ToggleButtonGroup
                            color="primary"
                            value={role}
                            exclusive
                            onChange={handleRoleChange}
                            aria-label="Role"
                            style={{ margin: '20px' }}
                        >
                            <ToggleButton value="Creator">Creator</ToggleButton>
                            <ToggleButton value="Advertiser">Advertiser</ToggleButton>
                        </ToggleButtonGroup>
                        <TextField
                            id="name"
                            label="Name"
                            variant="standard"
                            value={name}
                            onChange={handleNameChange}
                            style={{ margin: '10px' }}
                            fullWidth
                        />
                        <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="IN"
                            value={phone}
                            onChange={handlePhoneChange}
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
};

export default SignUp;