import { createClient } from 'redis';
import { config } from 'dotenv';

config();

class RedisService {
  private static instance: RedisService;
  private client: any;
  private connectionPromise: Promise<any> | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.client = createClient({
      username: 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error('Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      return this.client;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.client.connect()
        .then(() => {
          this.isInitialized = true;
          console.log('Redis initialized successfully');
          return this.client;
        })
        .catch((error: any) => {
          this.connectionPromise = null;
          console.error('Redis initialization failed:', error);
          throw error;
        });
    }

    return this.connectionPromise;
  }

  getClient() {
    if (!this.isInitialized) {
      throw new Error('Redis not initialized. Call initialize() first');
    }
    return this.client;
  }

  async disconnect() {
    if (this.isInitialized) {
      await this.client.quit();
      this.isInitialized = false;
      this.connectionPromise = null;
      console.log('Redis disconnected');
    }
  }
}

// Singleton instance for the entire application
let redisInstance: any = null;

// Export a single setupRedis function that ensures initialization
export const setupRedis = async () => {
  if (!redisInstance) {
    const redisService = RedisService.getInstance();
    redisInstance = await redisService.initialize();
  }
  return redisInstance;
};

// Get the Redis client (only after setup)
export const getRedisClient = () => {
  if (!redisInstance) {
    throw new Error('Redis not initialized. Call setupRedis() first');
  }
  return redisInstance;
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

export default RedisService;