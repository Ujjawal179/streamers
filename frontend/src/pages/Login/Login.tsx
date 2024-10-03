import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import { TextField, Button } from '@mui/material';
import { loginUser } from '../../api/userService';

function Login() {
    
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(e.target.value);
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
        <>
            <FormControl variant="standard" fullWidth sx={{ mb: 2 }}>
                <TextField
                    id="phone-number"
                    label="Phone Number"
                    variant="standard"
                    value={phone}
                    onChange={handlePhoneChange}
                />
                <TextField
                    id="Password"
                    label="Password"
                    type="password"
                    variant="standard"
                    value={password}
                    onChange={handlePasswordChange}
                />
            </FormControl>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <Button variant="contained" color="primary" onClick={handleSubmit}>
                Log In
            </Button>
        </>
    );
}

export default Login;