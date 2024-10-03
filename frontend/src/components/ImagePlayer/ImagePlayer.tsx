import React, { useEffect, useRef } from 'react';

interface ImagePlayerProps {
    size: number;
    position: number;
    image: string;
    time: number;
}

const ImagePlayer: React.FC<ImagePlayerProps> = ({ size, position, image, time }) => {
    const timeRef = useRef(time);
    
    useEffect(() => {
        if (time < 1 && time !== -1) timeRef.current = 1;

        if (time === -1) {
            const element = document.querySelector('.image-player') as HTMLElement;
            if (element) {
                element.style.opacity = '1';
            }
            return;
        }

        const timer = setTimeout(() => {
            const element = document.querySelector('.image-player') as HTMLElement;
            if (element) {
                element.style.opacity = '0';
            }
        }, timeRef.current * 1000);

        return () => clearTimeout(timer);
    }, [time]);

    
    if (!image) {
        return null;
    }
    if( size < 1) size = 1;

    const calculatedSize = 100 / size;
    const top = Math.floor((position -1 )/ size) * 100/size;
    const left = ((position-1) % size)/size * 100;
    const style: React.CSSProperties = {
        position: 'absolute',
        width: `${calculatedSize}%`,
        height: `${calculatedSize}%`,
        top: `${top}%`,
        left: `${left}%`,
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        animation: `slide ${time}s linear infinite`,
        animationFillMode: 'forwards',
        opacity: 1,
        transition: `opacity ${time}s ease-out`
    };

    return (
        <div className="image-player" style={style}></div>
    );
};

export default ImagePlayer;