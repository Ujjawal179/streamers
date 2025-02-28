"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsConfigured = exports.corsOptions = void 0;
exports.corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
};
// Additional CORS configuration for specific routes
exports.corsConfigured = {
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',');
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
