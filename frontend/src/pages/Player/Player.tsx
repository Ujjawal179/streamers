import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface Video {
  url: string;
  public_id: string;
  resource_type: string;
  uploaded_at: string;
}

const Player = () => {
  const { userId } = useParams<{ userId: string }>();
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [queueCompleted, setQueueCompleted] = useState(false);

  const fetchNextVideo = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<{ video: Video | null }>(`http://localhost:3001/user/${userId}/videos`);
      const fetchedVideo = response.data.video;

      if (fetchedVideo) {
        setCurrentVideo(fetchedVideo);
        setQueueCompleted(false);
      } else {
        setQueueCompleted(true);
        setCurrentVideo(null);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching video:', error);
      setIsLoading(false);
      setQueueCompleted(true);
      setCurrentVideo(null);
    }
  };

  useEffect(() => {
    fetchNextVideo();
  }, [userId]);

  const handleVideoEnded = () => {
    fetchNextVideo(); // Fetch the next video when the current one ends
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  const videoContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  };

  const messageStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: '1.5rem',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '8px',
    maxWidth: '80%',
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={messageStyle}>Loading...</div>
      </div>
    );
  }

  if (queueCompleted) {
    return (
      <div style={containerStyle}>
        <div style={messageStyle}>No more videos</div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div style={containerStyle}>
        <div style={messageStyle}>No videos available</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={videoContainerStyle}>
        <video
          key={currentVideo.url}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            width: 'auto',
            height: 'auto',
          }}
          autoPlay
          controls
          onEnded={handleVideoEnded} // Triggered when the video ends
        >
          <source src={currentVideo.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default Player;
