import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import { TextField, Button } from '@mui/material';
import { signupUser } from '../../api/userService';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

function SignUp() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = React.useState('creator');
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
            console.log('User logged in successfully:', response);
            // Handle successful login (e.g., redirect, display message)
        } catch (error: any) {
            console.error('Error logging in:', error);
            setError(error.message || 'An error occurred');
        }
    };

    const handleRoleChange = (event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
        setRole(newAlignment);
    }

    return (
        <>
            <FormControl variant="standard" fullWidth sx={{ mb: 2 }}>
            <ToggleButtonGroup
                color="primary"
                value={role}
                exclusive
                onChange={handleRoleChange}
                aria-label="Platform"
                >
                <ToggleButton value="creator">Creator</ToggleButton>
                <ToggleButton value="advertiser">Advertiser</ToggleButton>
            </ToggleButtonGroup>
                <TextField
                    id="Name"
                    label="Name"
                    variant="standard"
                    value={name}
                    onChange={handleNameChange}
                />
                <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="IN"
                    value={phone}
                    onChange={handlePhoneChange}/>
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
                Sign Up
            </Button>
        </>
    );
}

export default SignUp;