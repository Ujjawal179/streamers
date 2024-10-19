import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  video: string;
  onVideoEnd?: () => void;
}

const VideoPlayer = ({ video, onVideoEnd }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Reset the video when the source changes
      videoElement.load();
      videoElement.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, [video]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && onVideoEnd) {
      videoElement.addEventListener('ended', onVideoEnd);
    }

    return () => {
      if (videoElement && onVideoEnd) {
        videoElement.removeEventListener('ended', onVideoEnd);
      }
    };
  }, [onVideoEnd]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <video 
        ref={videoRef}
        height="100%"
        muted
        autoPlay
        playsInline
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        <source src={video} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};


export default VideoPlayer;
