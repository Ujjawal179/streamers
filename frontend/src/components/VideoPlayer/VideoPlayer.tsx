import React, { useEffect } from 'react';

interface VideoPlayerProps {
    size: number;
    position: number;
    video: string;
    time: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ size, position, video, time }) => {

    useEffect(() => {
        const timer = setTimeout(() => {
            const videoElement = document.querySelector('.image-player');
            if (videoElement) {
                videoElement.remove();
            }
        }, time * 1000);

        return () => clearTimeout(timer);
    }, [time]);

    if (!video) {
        return null;
    }
    if( size < 1) size = 1;

    const calculatedSize = 100 / size;
    const top = (position / size) * 100;
    const left = (position % size) * 100;
    const style: React.CSSProperties = {
        width: calculatedSize + '%',
        height: calculatedSize + '%',
        top: top + '%',
        left: left + '%',
        position: 'absolute'
    };

    return (
        <div className="image-player" style={style}>
            <video
                src={video}
                style={{ width: '100%', height: '100%' }}
                autoPlay
                loop
                muted
            />
        </div>
    );
}

export default VideoPlayer;