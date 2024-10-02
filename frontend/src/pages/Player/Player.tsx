import React, { useEffect, useState } from 'react';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import ImagePlayer from '../../components/ImagePlayer/ImagePlayer';
import axios from 'axios';

interface PlayerProps {
    type: 'image' | 'video';
    size: number;
    position: number;
    media: string;
    time: number;
}

interface PlayerData {
    type: 'image' | 'video';
    size: number;
    position: number;
    media: string;
    time: number;
}

const Player = ({ type, size, position, media, time }: PlayerProps) => {
    const [playerData, setPlayerData] = useState<PlayerData>({ type, size, position, media, time });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/user/1/videos');
                setPlayerData(response.data);
            } catch (error) {
                console.error('Error fetching player data:', error);
            }
        };

        fetchData();
    }, []);

    const style: React.CSSProperties = {
        width: '100%',
        height: '100%',
    };

    return (
        <>
        <div className={`${type}-player`} style={style}>
            {type === 'image' ? (
                <ImagePlayer size={size} position={position} image={media} time={time} />
            ) : (
                <VideoPlayer size={size} position={position} video={media} time={time} />
            )}
        </div>
        </>
    );
};

export default Player;