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
exports.emitQueueUpdate = exports.configureSocket = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const database_1 = __importDefault(require("./database"));
const configureSocket = (app) => {
    const server = (0, http_1.createServer)(app);
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('youtuber_online', (youtuberId) => __awaiter(void 0, void 0, void 0, function* () {
            socket.join(youtuberId);
            yield database_1.default.youtuber.update({
                where: { id: youtuberId },
                data: { isLive: true }
            });
        }));
        socket.on('youtuber_offline', (youtuberId) => __awaiter(void 0, void 0, void 0, function* () {
            socket.leave(youtuberId);
            yield database_1.default.youtuber.update({
                where: { id: youtuberId },
                data: { isLive: false }
            });
        }));
        socket.on('joinYoutuberRoom', (youtuberId) => {
            socket.join(`youtuber:${youtuberId}`);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    return { server, io };
};
exports.configureSocket = configureSocket;
const emitQueueUpdate = (io, youtuberId, queueData) => {
    io.to(`youtuber:${youtuberId}`).emit('queueUpdate', queueData);
};
exports.emitQueueUpdate = emitQueueUpdate;
