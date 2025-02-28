"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
// helpers/email.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create reusable transporter
const transporter = nodemailer_1.default.createTransport({
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
const sendVerificationEmail = (email, token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use BACKEND_URL for verification endpoint
        const verificationUrl = `${process.env.BACKEND_URL}/api/v1/verify-email/${token}`;
        const info = yield transporter.sendMail({
            from: {
                name: 'Streamers App',
                address: process.env.EMAIL_USER
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
    }
    catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
