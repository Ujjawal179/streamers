import React, { useEffect, useState, useRef } from 'react';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface PlayerProps {
    type: 'image' | 'video';
    size: number;
    position: number;
    media: string;
    time: number;
}

interface PlayerData {
    video: string;
}

const Player = ({ type, size, position, media, time }: PlayerProps) => {
    const { id } = useParams<{ id: string }>();
    const [playerData, setPlayerData] = useState<PlayerData>({ video: '' });
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null); // Reference to the video element

    // Fetch player data (video)
    const fetchData = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/user/${id}/videos`);
            setPlayerData(response.data);
            setIsVideoEnded(false); // Reset when a new video is fetched
        } catch (error) {
            console.error('Error fetching player data:', error);
        }
    };

    useEffect(() => {
        // Fetch data when the component mounts
        fetchData();

        return () => {
            // Clear any running intervals if the component unmounts
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, []);

    // Poll for a new video every 5 seconds when the video has ended
    useEffect(() => {
        if (isVideoEnded) {
            intervalIdRef.current = setInterval(() => {
                setPlayerData({ video: '' }); // Clear the video source
                console.log('Checking for new video...');
                fetchData();
            }, 5000); // Check every 5 seconds
        } else if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current); // Clear polling if video hasn't ended
        }

        return () => {
            // Cleanup interval on component unmount
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, [isVideoEnded]);

    // Handle video end
    const handleVideoEnded = () => {
        setIsVideoEnded(true);

        setPlayerData({ video: '' }); // Clear the video source
        // Fetch new video after the current one ends
        fetchData();
    };

    // Play video automatically when the video source is updated
    useEffect(() => {
        if (videoRef.current && playerData.video) {
            videoRef.current.load(); // Reload the video with the new source
            videoRef.current.play(); // Automatically play the new video
        }
    }, [playerData.video]);

    const style: React.CSSProperties = {
        width: '100%',
        height: '100%',
        display:'flex',
        justifyContent:'center',
    };

    return (
        <>
            {playerData.video && (
                <div className={`${type}-player`} style={style}>
                    <video ref={videoRef} height="100%" muted autoPlay onEnded={handleVideoEnded}>
                        <source src={playerData.video} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
        </>
    );
};

export default Player;



// import React, { useEffect, useState } from 'react';
// import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
// // import ImagePlayer from '../../components/ImagePlayer/ImagePlayer';
// import axios from 'axios';

// interface PlayerProps {
//     type: 'image' | 'video';
//     size: number;
//     position: number;
//     media: string;
//     time: number;
// }

// interface PlayerData {
//     media: string;
// }

// const Player = ({ type, size, position, media, time }: PlayerProps) => {
//     const [playerData, setPlayerData] = useState<PlayerData>({  media });

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await axios.get('http://localhost:3001/user/1/videos');
//                 // console.log(response.data)
//                 setPlayerData(response.data.video);
//             } catch (error) {
//                 console.error('Error fetching player data:', error);
//             }
//         };

//         fetchData();
//     }, []);

//     const style: React.CSSProperties = {
//         width: '100%',
//         height: '100%',
//     };

//     return (
//         <>
//         <div className={`${type}-player`} style={style}>
//                 <VideoPlayer video={playerData.media} />
//         </div>
//         </>
//     );
// };

// export default Player;


// import React, { useEffect, useState } from 'react';
// import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
// import ImagePlayer from '../../components/ImagePlayer/ImagePlayer';
// import axios from 'axios';

// interface PlayerProps {
//     type: 'image' | 'video';
//     size: number;
//     position: number;
//     media: string;
//     time: number;
// }

// interface PlayerData {
//     type: 'image' | 'video';
//     size: number;
//     position: number;
//     media: string;
//     time: number;
// }

// const Player = ({ type, size, position, media, time }: PlayerProps) => {
//     const [playerData, setPlayerData] = useState<PlayerData>({ type, size, position, media, time });

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await axios.get('http://localhost:3001/user/1/videos');
//                 setPlayerData(response.data);
//             } catch (error) {
//                 console.error('Error fetching player data:', error);
//             }
//         };

//         fetchData();
//     }, []);

//     const style: React.CSSProperties = {
//         width: '100%',
//         height: '100%',
//     };

//     return (
//         <>
//         <div className={`${type}-player`} style={style}>
//             {type === 'image' ? (
//                 <ImagePlayer size={size} position={position} image={media} time={time} />
//             ) : (
//                 <VideoPlayer size={size} position={position} video={media} time={time} />
//             )}
//         </div>
//         </>
//     );
// };

// export default Player;