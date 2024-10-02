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
            const videoElement = document.querySelector('.video-player');
            if (videoElement) {
                videoElement.remove();
            }
        }, time * 1000);

        return () => clearTimeout(timer);
    }, [time]);

    const calculatedSize = 100 / size;
    const top = (position / 3) * 100;
    const left = (position % 3) * 100;
    const style: React.CSSProperties = {
        width: calculatedSize + '%',
        height: calculatedSize + '%',
        top: top + '%',
        left: left + '%',
        position: 'absolute'
    };

    return (
        <div className="video-player" style={style}>
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