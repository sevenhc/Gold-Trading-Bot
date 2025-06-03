const NodeCache = require('node-cache');
const RedisCache = require('redis');
const logger = require('./logger');

const nodeCacheClient = new NodeCache();
let redisCacheClient;

const redisClusterConnection = async () => {
  try {
    logger.info("Initializing Redis connection");

    redisCacheClient = RedisCache.createClient({
      url: CACHE_DATA.redisurl,
      pingInterval: CACHE_DATA.redisping,
    }).on("error", error => logger.error({ err: error }, "Redis client error"));

    await redisCacheClient.connect();
    logger.info("Successfully connected to Redis");
  } catch (err) {
    logger.error({ err }, "Failed to establish Redis connection");
    throw err;
  }
};

const getRedisCachedData = async (key) => {
  try {
    logger.debug({ key }, "Fetching data from Redis");
    const result = await redisCacheClient.get(key);
    return result;
  } catch (err) {
    logger.error({ err, key }, "Error getting data from Redis");
    throw err;
  }
};

const setRedisCacheData = async (key, value) => {
  try {
    logger.debug({ key }, "Setting data in Redis");
    const result = await redisCacheClient.set(key, value, {
      EX: CACHE_DATA.redisttl
    });
    return result;
  } catch (err) {
    logger.error({ err, key }, "Error setting data in Redis");
    throw err;
  }
};

const delRedisCachedData = async (key) => {
  try {
    logger.debug({ key }, "Deleting data from Redis");
    const result = await redisCacheClient.del(key);
    return result;
  } catch (err) {
    logger.error({ err, key }, "Error deleting data from Redis");
    throw err;
  }
};

const flushRedisCluster = async () => {
  try {
    logger.info("Flushing Redis cluster");
    const [flush, ping] = await Promise.all([
      redisCacheClient.sendCommand(['FLUSHALL', 'SYNC']),
      redisCacheClient.ping(),
    ]);
    logger.info("Successfully flushed Redis cluster");
    return { flush, ping };
  } catch (err) {
    logger.error({ err }, "Error flushing Redis cluster");
    throw err;
  }
};

const getNodeCachedData = async (key) => {
  try {
    logger.debug({ key }, "Fetching data from Node cache");
    const result = nodeCacheClient.get(key);
    return result;
  } catch (err) {
    logger.error({ err, key }, "Error getting data from Node cache");
    throw err;
  }
};

const setNodeCacheData = async (key, value) => {
  try {
    logger.debug({ key }, "Setting data in Node cache");
    const result = nodeCacheClient.set(key, value, CACHE_DATA.nodettl);
    return result;
  } catch (err) {
    logger.error({ err, key }, "Error setting data in Node cache");
    throw err;
  }
};

const delNodeCachedData = async (key) => {
  try {
    logger.debug({ key }, "Deleting data from Node cache");
    const result = await nodeCacheClient.del(key);
    return result;
  } catch (err) {
    logger.error({ err, key }, "Error deleting data from Node cache");
    throw err;
  }
};

const flushNodeCluster = async () => {
  try {
    logger.info("Flushing Node cache cluster");
    const [flush, ping] = await Promise.all([
      nodeCacheClient.flushAll(),
      nodeCacheClient.flushStats(),
    ]);
    logger.info("Successfully flushed Node cache cluster");
    return { flush, ping };
  } catch (err) {
    logger.error({ err }, "Error flushing Node cache cluster");
    throw err;
  }
};

module.exports = {
  getRedisCachedData,
  setRedisCacheData,
  delRedisCachedData,
  redisClusterConnection,
  flushRedisCluster,
  getNodeCachedData,
  setNodeCacheData,
  delNodeCachedData,
  flushNodeCluster
};