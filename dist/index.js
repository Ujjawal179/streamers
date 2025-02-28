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
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = require("dotenv");
const redis_1 = require("./config/redis");
const cors_2 = require("./config/cors");
const socket_1 = require("./config/socket");
const queueWorker_1 = require("./workers/queueWorker");
// Import routes
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const donationRoutes_1 = __importDefault(require("./routes/donationRoutes"));
const campaignRoutes_1 = __importDefault(require("./routes/campaignRoutes"));
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes"));
const youtuberRoutes_1 = __importDefault(require("./routes/youtuberRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const mediaRoutes_1 = __importDefault(require("./routes/mediaRoutes")); // Import media routes
const clickCounterRoutes_1 = __importDefault(require("./routes/clickCounterRoutes"));
(0, dotenv_1.config)();
let globalIo;
const initializeApp = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Initialize Redis first
        yield (0, redis_1.setupRedis)();
        const app = (0, express_1.default)();
        const server = (0, http_1.createServer)(app);
        const io = new socket_io_1.Server(server, { cors: cors_2.corsOptions });
        // Store io instance globally
        exports.io = globalIo = io;
        // Middleware
        app.use(express_1.default.json());
        app.use((0, cors_1.default)(cors_2.corsOptions));
        app.options('*', (0, cors_1.default)(cors_2.corsOptions));
        // Add headers middleware
        app.use((req, res, next) => {
            // Allow specific origins
            const origin = req.headers.origin;
            if (origin && cors_2.corsOptions.origin) {
                if (typeof cors_2.corsOptions.origin === 'function') {
                    cors_2.corsOptions.origin(origin, (err, allowed) => {
                        if (allowed) {
                            res.setHeader('Access-Control-Allow-Origin', origin);
                        }
                    });
                }
            }
            // Allow credentials
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            // Allow specific headers
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            // Allow specific methods
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            if (req.method === 'OPTIONS') {
                return res.status(204).end();
            }
            next();
        });
        // Start queue worker after Redis is initialized
        (0, queueWorker_1.startQueueWorker)();
        // Setup Socket.IO
        (0, socket_1.configureSocket)(app);
        // Routes
        app.use('/api/v1/payments', paymentRoutes_1.default);
        app.use('/api/v1/donations', donationRoutes_1.default);
        app.use('/api/v1/campaigns', campaignRoutes_1.default);
        app.use('/api/v1/companies', companyRoutes_1.default);
        app.use('/api/v1/youtubers', youtuberRoutes_1.default);
        app.use('/api/v1', userRoutes_1.default);
        app.use('/api/v1/media', mediaRoutes_1.default); // Use media routes
        app.use('/api/v1', clickCounterRoutes_1.default);
        const port = process.env.PORT || 3001;
        server.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
        return { app, server, io };
    }
    catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
});
// Start the application
initializeApp();
exports.default = initializeApp;
