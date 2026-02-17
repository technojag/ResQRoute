const logger = require('../utils/logger');

let redisClient = null;
let redisAvailable = false;

const connectRedis = async () => {
  try {
    const redis = require('redis');
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          if (retries > 2) return false;
          return 1000;
        }
      },
      password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', () => { redisAvailable = false; });
    redisClient.on('ready', () => {
      redisAvailable = true;
      logger.info('Redis Client Ready');
    });

    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);

    redisAvailable = true;
    return redisClient;
  } catch (error) {
    redisAvailable = false;
    redisClient = null;
    logger.warn('Redis not available - running without cache (OK for development)');
    return null;
  }
};

const getRedisClient = () => redisClient;

const cacheHelpers = {
  async set(key, value, expiry = 3600) {
    if (!redisAvailable || !redisClient) return false;
    try { await redisClient.setEx(key, expiry, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  },
  async get(key) {
    if (!redisAvailable || !redisClient) return null;
    try { const v = await redisClient.get(key); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  },
  async del(key) {
    if (!redisAvailable || !redisClient) return false;
    try { await redisClient.del(key); return true; }
    catch (e) { return false; }
  },
  async delPattern(pattern) {
    if (!redisAvailable || !redisClient) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) await redisClient.del(keys);
      return true;
    } catch (e) { return false; }
  },
  async exists(key) {
    if (!redisAvailable || !redisClient) return false;
    try { return await redisClient.exists(key); }
    catch (e) { return false; }
  },
  async hSet(key, field, value) {
    if (!redisAvailable || !redisClient) return false;
    try { await redisClient.hSet(key, field, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  },
  async hGet(key, field) {
    if (!redisAvailable || !redisClient) return null;
    try { const v = await redisClient.hGet(key, field); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  },
  async hGetAll(key) {
    if (!redisAvailable || !redisClient) return null;
    try {
      const values = await redisClient.hGetAll(key);
      const result = {};
      for (const [f, v] of Object.entries(values)) result[f] = JSON.parse(v);
      return result;
    } catch (e) { return null; }
  }
};

const closeRedis = async () => {
  try { if (redisClient) await redisClient.quit(); } catch (e) {}
};

module.exports = { connectRedis, getRedisClient, cacheHelpers, closeRedis };