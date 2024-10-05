import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Player from './pages/Player/Player';
import SetupAd from './pages/SetupAd/SetupAd';
import UploadAd from './pages/UploadAd/UploadAd';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import Footer from './components/Footer/Footer';
import React from 'react';
import Navbar from './components/Navbar/Navbar';

const App: React.FC = () => {
  return (
    <>
      <Navbar />
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
          <Route path="/" element={<Home/>} />
          <Route path="/upload/:id" element={<UploadAd />} />
          <Route path="/setup" element={<SetupAd />} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<SignUp/>} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </Router>
      <Footer />
    </>
  );
}

export default App;