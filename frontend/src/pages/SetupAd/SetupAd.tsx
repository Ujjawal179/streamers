import React from 'react';
import { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import PlayerPreview from '../../components/PlayerPreview/PlayerPreview';

const SetupAd: React.FC = () => {
    const [size, setSize] = React.useState<number>(0);
    const [position, setPosition] = React.useState<number>(0);

    const handleSizeChange = (event: SelectChangeEvent<number>) => {
        setSize(Number(event.target.value));
        setPosition(0); // Reset position when size changes
    };

    const handlePositionChange = (event: SelectChangeEvent<number>) => {
        setPosition(Number(event.target.value));
    };

    return (
        <>
            <h1>SetupAd: streamer will use this page to set up types of ads are possible</h1>
            
            <FormControl variant="standard" fullWidth sx={{ mb: 2 }}>
                <InputLabel id="size-label">Size</InputLabel>
                <Select
                    labelId="size-label"
                    id="size"
                    value={size}
                    onChange={handleSizeChange}
                    label="Size"
                >
                    <MenuItem value={0}>
                        <em>None</em>
                    </MenuItem>
                    <MenuItem value={4}>Small</MenuItem>
                    <MenuItem value={3}>Medium</MenuItem>
                    <MenuItem value={2}>Large</MenuItem>
                    <MenuItem value={1}>Full Screen</MenuItem>
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
                    disabled={size === 0} // Disable if no size is selected
                >
                    <MenuItem value={0}>
                        <em>None</em>
                    </MenuItem>
                    {Array.from({ length: size ** 2 }, (_, index) => (
                        <MenuItem key={index} value={index + 1}>Position {index + 1}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {size > 0 && (
                <PlayerPreview size={size} position={position}  />
            )}

        </>
    );
};

export default SetupAd;