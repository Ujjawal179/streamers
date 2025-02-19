import { createClient } from 'redis';
import { config } from 'dotenv';

config();

class RedisService {
  private static instance: RedisService;
  private client: any;
  private connecting: boolean = false;
  private connected: boolean = false;

  private constructor() {
    this.client = createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
      }
    });

    this.client.on('error', (err: any) => {
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

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async initialize() {
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
      await this.client.connect();
      this.connecting = false;
      
      // Test connection
      await this.client.set('test', 'connection');
      const testResult = await this.client.get('test');
      console.log('Redis connection test:', testResult);
      
      return this.client;
    } catch (error) {
      this.connecting = false;
      this.connected = false;
      console.error('Redis initialization failed:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.connected) {
      throw new Error('Redis not connected. Call initialize() first');
    }
    return this.client;
  }

  async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
      this.connecting = false;
      console.log('Redis disconnected');
    }
  }
}

let initializationPromise: Promise<boolean> | null = null;

// Export a single setupRedis function that ensures initialization
export const setupRedis = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      const redisService = RedisService.getInstance();
      await redisService.initialize();
      resolve(true);
    } catch (error) {
      console.error('Redis setup failed:', error);
      reject(error);
    }
  });

  return initializationPromise;
};

export const getRedisClient = () => {
  return RedisService.getInstance().getClient();
};

// Update existing functions to use the singleton client
export const addToQueue = async (key: string, data: any, score?: number) => {
  const client = getRedisClient();
  const timestamp = score || Date.now();
  return client.zAdd(key, [{score: timestamp, value: JSON.stringify(data)}]);
};

export const getNextFromQueue = async (key: string, currentTime = Date.now()) => {
  const client = getRedisClient();
  const items = await client.zRangeWithScores(key, 0, 0);
  if (items.length === 0) return null;
  
  const [item] = items;
  if (item.score > currentTime) return null;
  
  return JSON.parse(item.value);
};

export const removeFromQueue = async (key: string) => {
  const client = getRedisClient();
  return client.zRemRangeByRank(key, 0, 0);
};

export const getQueueLength = async (key: string) => {
  const client = getRedisClient();
  return client.zCard(key);
};

export const getScheduledAds = async (key: string, start: number, end: number) => {
  const client = getRedisClient();
  return client.zRangeByScore(key, start, end);
};

export const getQueueItems = async (key: string, start = 0, end = -1) => {
  const client = getRedisClient();
  const items = await client.zRange(key, start, end, { REV: true });
  interface QueueItem {
    [key: string]: any;  // This allows for flexible item structure
  }

  return items.map((item: string): QueueItem => JSON.parse(item));
};

export {
  RedisService as default
};
