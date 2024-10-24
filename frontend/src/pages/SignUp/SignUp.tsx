import React, { useState } from 'react';
import { TextField, Button, Grid, ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { registerUser } from '../../api/userService';
import userEvent from '@testing-library/user-event';

const SignUp: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('youtuber');
    const [error, setError] = useState<string | null>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handleMailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("2de");
    
        try {
          const result = await registerUser({name, email, password, userType});
          setError(null);
        if (userType === 'youtuber') {
            window.location.href = '/setup';
        }
        else{
          window.location.href = '/';
        }
        } catch (error: any) {
          setError(error.message);
        }
    };

    const handleRoleChange = (event: React.MouseEvent<HTMLElement>, newRole: string | null) => {
        if (newRole !== null) {
            setUserType(newRole);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="90vh" padding={'10px'}>
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
                        <h1>Hello {userType === 'youtuber' ? 'Creator' : 'Advertiser'}!!</h1>
                        <span>Welcome to our platform, please sign up to continue!</span>
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
                            id="name"
                            label="Name"
                            variant="standard"
                            value={name}
                            onChange={handleNameChange}
                            style={{ margin: '10px' }}
                            fullWidth
                        />
                        <TextField
                            id="email"
                            label="Mail"
                            type="mail"
                            variant="standard"
                            value={email}
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
};

export default SignUp;