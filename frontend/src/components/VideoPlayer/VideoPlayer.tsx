import React from 'react';

interface VideoPlayerProps {
    video: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
    return (
        <>
        {video && (
            <div>
                <h2>Video Preview:</h2>
                <video width="600" controls>
                    <source src={video} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        )}
        </>
    );
};

export default VideoPlayer;

// import React, { useEffect } from 'react';

// interface VideoPlayerProps {
//     video: string;
// }
// // interface VideoPlayerProps {
// //     size: number;
// //     position: number;
// //     video: string;
// //     time: number;
// // }

// const VideoPlayer: React.FC<VideoPlayerProps> = ({  video }) => {

//     // useEffect(() => {
//     //     const timer = setTimeout(() => {
//     //         const videoElement = document.querySelector('.image-player');
//     //         if (videoElement) {
//     //             videoElement.remove();
//     //         }
//     //     }, time * 1000);

//     //     return () => clearTimeout(timer);
//     // }, [time]);

//     // if (!video) {
//     //     return null;
//     // }
//     // if( size < 1) size = 1;

//     // const calculatedSize = 100 / size;
//     // const top = (position / size) * 100;
//     // const left = (position % size) * 100;
//     // const style: React.CSSProperties = {
//     //     width: calculatedSize + '%',
//     //     height: calculatedSize + '%',
//     //     top: top + '%',
//     //     left: left + '%',
//     //     position: 'absolute'
//     // };

//     return (
//         // <div className="image-player" style={style}>
//         // <div className="image-player" >
//         //     {/* <video
//         //         src={video}
//         //         style={{ width: '100%', height: '100%' }}
//         //         autoPlay
//         //         loop
//         //         muted
//         //     /> */}
//         //     <video width="600" controls>
//         //             <source src={video} type="video/mp4" />
//         //                 Your browser does not support the video tag.
//         //     </video>
//         // </div>\

//         <>
//         {video && (
//             <div>
//                 <h2>Video Preview:</h2>
//                 <video width="600" controls>
//                     <source src={video} type="video/mp4" />
//                     Your browser does not support the video tag.
//                 </video>
//             </div>
//         ) }
//         </>
//     );
// }

// export default VideoPlayer;