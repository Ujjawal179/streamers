import { Button } from '@mui/material'
import React from 'react';

interface CopyToClipboardProps {
    text: string;
    style?: React.CSSProperties;
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ text, style }) => {
  
    const [copied, setCopied] = React.useState(false);

    const handleClick = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button style={{ ...style, backgroundColor: 'white', marginLeft:'-85px' }} onClick={handleClick}>
            {copied ? 'Copied' : 'Copy'}
        </Button>
    );
}

export default CopyToClipboard