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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.getQueueItems = exports.getScheduledAds = exports.getQueueLength = exports.removeFromQueue = exports.getNextFromQueue = exports.addToQueue = exports.getRedisClient = exports.setupRedis = void 0;
const redis_1 = require("redis");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class RedisService {
    constructor() {
        this.connecting = false;
        this.connected = false;
        this.client = (0, redis_1.createClient)({
            username: process.env.REDIS_USERNAME || 'default',
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT)
            }
        });
        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
            this.connected = false;
        });
        this.client.on('connect', () => {
            console.log('Redis Client Connected');
            this.connected = true;
        });
        this.client.on('end', () => {
            console.log('Redis Client Disconnected');
            this.connected = false;
        });
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connecting) {
                console.log('Redis connection already in progress');
                return this.client;
            }
            if (this.connected) {
                console.log('Redis already connected');
                return this.client;
            }
            try {
                this.connecting = true;
                yield this.client.connect();
                this.connecting = false;
                // Test connection
                yield this.client.set('test', 'connection');
                const testResult = yield this.client.get('test');
                console.log('Redis connection test:', testResult);
                return this.client;
            }
            catch (error) {
                this.connecting = false;
                this.connected = false;
                console.error('Redis initialization failed:', error);
                throw error;
            }
        });
    }
    getClient() {
        if (!this.connected) {
            throw new Error('Redis not connected. Call initialize() first');
        }
        return this.client;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected) {
                yield this.client.quit();
                this.connected = false;
                this.connecting = false;
                console.log('Redis disconnected');
            }
        });
    }
}
exports.default = RedisService;
let initializationPromise = null;
// Export a single setupRedis function that ensures initialization
const setupRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (initializationPromise) {
        return initializationPromise;
    }
    initializationPromise = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const redisService = RedisService.getInstance();
            yield redisService.initialize();
            resolve(true);
        }
        catch (error) {
            console.error('Redis setup failed:', error);
            reject(error);
        }
    }));
    return initializationPromise;
});
exports.setupRedis = setupRedis;
const getRedisClient = () => {
    return RedisService.getInstance().getClient();
};
exports.getRedisClient = getRedisClient;
// Update existing functions to use the singleton client
const addToQueue = (key, data, score) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, exports.getRedisClient)();
    const timestamp = score || Date.now();
    return client.zAdd(key, [{ score: timestamp, value: JSON.stringify(data) }]);
});
exports.addToQueue = addToQueue;
const getNextFromQueue = (key_1, ...args_1) => __awaiter(void 0, [key_1, ...args_1], void 0, function* (key, currentTime = Date.now()) {
    const client = (0, exports.getRedisClient)();
    const items = yield client.zRangeWithScores(key, 0, 0);
    if (items.length === 0)
        return null;
    const [item] = items;
    if (item.score > currentTime)
        return null;
    return JSON.parse(item.value);
});
exports.getNextFromQueue = getNextFromQueue;
const removeFromQueue = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, exports.getRedisClient)();
    return client.zRemRangeByRank(key, 0, 0);
});
exports.removeFromQueue = removeFromQueue;
const getQueueLength = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, exports.getRedisClient)();
    return client.zCard(key);
});
exports.getQueueLength = getQueueLength;
const getScheduledAds = (key, start, end) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, exports.getRedisClient)();
    return client.zRangeByScore(key, start, end);
});
exports.getScheduledAds = getScheduledAds;
const getQueueItems = (key_1, ...args_1) => __awaiter(void 0, [key_1, ...args_1], void 0, function* (key, start = 0, end = -1) {
    const client = (0, exports.getRedisClient)();
    const items = yield client.zRange(key, start, end, { REV: true });
    return items.map((item) => JSON.parse(item));
});
exports.getQueueItems = getQueueItems;
