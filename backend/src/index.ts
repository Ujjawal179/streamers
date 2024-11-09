import express from "express";
import cors from "cors";
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { setupRedis } from './config/redis';
import { corsOptions } from './config/cors';
import { configureSocket } from './config/socket';

// Import routes
import paymentRoutes from './routes/paymentRoutes';
import donationRoutes from './routes/donationRoutes';
import campaignRoutes from './routes/campaignRoutes';
import companyRoutes from './routes/companyRoutes';
import youtuberRoutes from './routes/youtuberRoutes';
import userRoutes from './routes/userRoutes';
import MediaRouter from "./routes/mediaRoutes"; // Import media routes

config();
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Setup Redis
setupRedis();

// Setup Socket.IO
configureSocket(app);

// Routes
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/youtubers', youtuberRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1/media', MediaRouter); // Use media routes

const port = process.env.PORT || 3001;
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
