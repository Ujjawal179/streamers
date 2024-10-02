import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Home from './pages/Home/Home';
import Player from './pages/Player/Player';
import SetupAd from './pages/SetupAd/SetupAd';
import UploadAd from './pages/UploadAd/UploadAd';
import React from 'react';

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route 
            path="/player" 
            element={
              <Player 
                type="video" 
                size={1} 
                position={1} 
                media="media-url" 
                time={120} 
              />
            } 
          />
          <Route path="/upload/:id" element={<UploadAd />} />
          <Route path="/setup" element={<SetupAd />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;