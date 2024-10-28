import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Player from './pages/Player/Player';
import SetupAd from './pages/SetupAd/SetupAd';
import UploadAd from './pages/UploadAd/UploadAd';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import Footer from './components/Footer/Footer';
import React from 'react';
import Navbar from './components/Navbar/Navbar';
import DashBoard from './pages/DashBoard/DashBoard';
import Setup from './pages/Setup/Setup';
import Page from './components/Page/Page';

const App: React.FC = () => {
  const user = localStorage.getItem('user');
  const userType = user ? JSON.parse(user).userType : null;
  const isLoggedIn = !!user;
  return (
    <Router>
      <Routes>
        <Route 
          path="/player/:userId" 
          element={
            <Player/>
          } 
        />
        <Route 
          path="*" 
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload/:userId"
                 element={
                 isLoggedIn ? <UploadAd />: <Navigate to="/signup" />
                } />
                {/* <Route path="/setup" element={<SetupAd />} /> */}
                <Route 
                  path="/login" 
                  element={
                  isLoggedIn ? <Navigate to="/dashboard" /> : <Login />
                  } 
                />
                <Route 
                  path="/signup" 
                  element={
                  isLoggedIn ? <Navigate to="/dashboard" /> : <SignUp />
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                  isLoggedIn ? <DashBoard userType={userType} /> : <Navigate to="/signup" />
                  } 
                />
                <Route 
                  path="/setup" 
                  element={
                  isLoggedIn ? <Setup /> : <Navigate to="/signup" />
                  } 
                />
                <Route path='privacy-policy' element={<Page page={"privacy-policy"}/>} />
                <Route path='terms-of-service' element={<Page page={"terms-of-service"}/>} />
                <Route path='content-guidelines' element={<Page page={"content-guidelines"}/>} />
                <Route path='contact-us' element={<Page page={"contact-us"}/>} />
                <Route path='cancellation-and-refund-policy' element={<Page page={"cancellation-and-refund-policy"}/>} />
                <Route path="*" element={<h1>404 Not Found</h1>} />
              </Routes>
              <Footer />
            </>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;