import React from 'react';
import styles from './Footer.module.css';
import { FaFacebookF, FaTwitter, FaGooglePlusG, FaTelegramPlane } from 'react-icons/fa';

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerColumn}>
                    <h2 className='logo'>STREAMERS</h2>
                    <p>Your one-stop shop for the latest smartphones and accessories.</p>
                </div>

                <div className={styles.footerColumn}>
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#products">Products</a></li>
                        <li><a href="#about">About Us</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>

                <div className={styles.footerColumn}>
                    <h4>Contact Us</h4>
                    <ul>
                        <li>Email: support@vv.com</li>
                        <li>Phone: +855 (123) 123-123</li>
                        <li>Address: nv pp yg ng</li>
                    </ul>
                </div>

                <div className={styles.footerColumn}>
                    <h4>Follow Us</h4>
                    <div className={styles.socialIcons}>
                        <a href="#" rel="noopener noreferrer"><FaFacebookF /></a>
                        <a href="#" rel="noopener noreferrer"><FaGooglePlusG /></a>
                        <a href="#" rel="noopener noreferrer"><FaTelegramPlane /></a>
                        <a href="#" rel="noopener noreferrer"><FaTwitter /></a>
                    </div>
                </div>
            </div>
            <div className={styles.footerBottom}>
                <p>&copy; All Rights Reserved | <a href="#privacy-policy">Privacy Policy</a></p>
            </div>
        </footer>
    );
};

export default Footer;
