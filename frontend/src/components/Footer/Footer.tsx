import React from 'react';
import styles from './Footer.module.css';
import { FaFacebookF, FaTwitter, FaGooglePlusG, FaTelegramPlane } from 'react-icons/fa';

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer} style={{WebkitTapHighlightColor: 'transparent'}}>
            <div className={styles.footerContainer}>
                <div className={styles.footerColumn}>
                    <h2 className='logo'>STREAMERS</h2>
                    <p>We enable creators to sell slots for Branded Content on their live channels. Directly, and within seconds.</p>
                </div>

                <div className={styles.footerColumn}>
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="#about">Somthing New</a></li>
                        <li><a href="/contact-us">Contact Us</a></li>
                    </ul>
                </div>

                <div className={styles.footerColumn}>
                    <h4>Policies</h4>
                    <ul>
                        <li><a href="privacy-policy">Privacy Policy</a></li>
                        <li><a href="terms-of-service">Terms of Service</a></li>
                        <li><a href="content-guidelines">Content Guidelines</a></li>
                        <li><a href="cancellation-and-refund-policy">Cancellation and Refund Policy</a></li>
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
                <p>&copy; All Rights Reserved | <a href="/privacy-policy">Privacy Policy</a></p>
                <p>Copyright &copy; MarkupX brands technolgies private limited 2024-2034 </p>
            </div>
        </footer>
    );
};

export default Footer;
