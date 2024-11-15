import { createClient, RedisClientType } from 'redis';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

let redisClient: RedisClientType;

export const setupRedis = async () => {
  if (!redisClient) {
    redisClient = createClient({
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await redisClient.connect();
    console.log('Connected to Redis');
  }
  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client is not initialized. Call setupRedis first.');
  }
  return redisClient;
};

export const addToQueue = async (key: string, value: any) => {
  const client = getRedisClient();
  await client.rPush(key, JSON.stringify(value));
  await client.expire(key, 24 * 60 * 60); // 24 hours TTL
};

export const getNextFromQueue = async (key: string) => {
  const client = getRedisClient();
  const item = await client.lIndex(key, 0);
  if (!item) return null;
  return JSON.parse(item);
};

export const removeFromQueue = async (key: string) => {
  const client = getRedisClient();
  const video =await client.lPop(key);
  return video;
};

export const getQueueLength = async (key: string) => {
  const client = getRedisClient();
  return await client.lLen(key);
};

export default getRedisClient;
