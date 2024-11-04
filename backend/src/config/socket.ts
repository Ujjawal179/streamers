import { Server } from 'socket.io';
import { createServer } from 'http';
import { Express } from 'express';
import prisma from './database';

export const configureSocket = (app: Express) => {
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('youtuber_online', async (youtuberId: string) => {
      socket.join(youtuberId);
      await prisma.youtuber.update({
        where: { id: youtuberId },
        data: { isLive: true }
      });
    });

    socket.on('youtuber_offline', async (youtuberId: string) => {
      socket.leave(youtuberId);
      await prisma.youtuber.update({
        where: { id: youtuberId },
        data: { isLive: false }
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return { server, io };
};
