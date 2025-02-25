// helpers/email.ts
import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  pool: true, // Enable connection pooling
  maxConnections: 5, // Adjust based on your needs
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Use Gmail App Password
  }
});

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    // Use BACKEND_URL for verification endpoint
    const verificationUrl = `${process.env.BACKEND_URL}/api/v1/verify-email/${token}`;

    const info = await transporter.sendMail({
      from: {
        name: 'Streamers App',
        address: process.env.EMAIL_USER as string
      },
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Streamers App!</h2>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 10px 20px; 
                    background-color: #4CAF50; color: white; 
                    text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link:</p>
          <p>${verificationUrl}</p>
        </div>
      `
    });

    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};