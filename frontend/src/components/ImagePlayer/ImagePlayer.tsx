import React, { useEffect } from 'react';

interface ImagePlayerProps {
    size: number;
    position: number;
    image: string;
    time: number;
}

const ImagePlayer: React.FC<ImagePlayerProps> = ({ size, position, image, time }) => {

    useEffect(() => {
        const timer = setTimeout(() => {
            const element = document.querySelector('.image-player') as HTMLElement;
            if (element) {
                element.style.opacity = '0';
            }
        }, time * 1000);

        return () => clearTimeout(timer);
    }, [time]);

    const calculatedSize = 100 / size;
    const top = (position / 3) * 100;
    const left = (position % 3) * 100;
    const style: React.CSSProperties = {
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