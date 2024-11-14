import { createClient } from 'redis';

import { RedisClientType } from 'redis';

let redisClient: RedisClientType;

export const setupRedis = async () => {
  if (!redisClient) {
    

const redisClient = createClient({
    password: 'MbdvwKcaqGbBgMSlG3JvLfEhG4xrczhJ',
    socket: {
        host: 'redis-15241.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 15241
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
  await client.lPop(key);
};

export default getRedisClient;
