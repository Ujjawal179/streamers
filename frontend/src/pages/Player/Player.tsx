
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface Video {
  url: string;
  public_id: string;
  resource_type: string;
  uploaded_at: string;
}

interface PlayerProps {
  type: 'image' | 'video';
  size: number;
  position: number;
  media: string;
  time: number;
}

const Player = ({ type, size, position, media, time }: PlayerProps) => {
  const { id } = useParams<{ id: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [queueCompleted, setQueueCompleted] = useState(false);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      setQueueCompleted(false);
      const response = await axios.get<{ videos: Video[] }>(`http://localhost:3001/user/${id}/videos`);
      const fetchedVideos = response.data.videos;
      
      if (fetchedVideos.length > 0) {
        setVideos(fetchedVideos.slice(1)); // Store remaining videos
        setCurrentVideo(fetchedVideos[0]); // Set first video as current
      } else {
        setQueueCompleted(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setIsLoading(false);
      setQueueCompleted(true);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [id]);

  const handleVideoEnded = () => {
    if (videos.length > 0) {
      setCurrentVideo(videos[0]); // Get the next video
      setVideos(videos.slice(1)); // Remove the used video from the queue
    } else {
      setCurrentVideo(null);
      setQueueCompleted(true);
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // backgroundColor: '#000',
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
          onEnded={handleVideoEnded}
        >
          <source src={currentVideo.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default Player;