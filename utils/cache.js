const NodeCache = require('node-cache')
const RedisCache = require('redis')
// const {getKeyValueParameters} = require('@pulse/aws/ssm')
// const {Redis_Endpoint, Cache_TTL} = getKeyValueParameters()

//initialising caching clients
// console.log('REDIS ENDPOINT: ', Redis_Endpoint)
const nodeCacheClient = new NodeCache()
let redisCacheClient;

const redisClusterConnection = async () => {
  try {
    console.log("start  connection");

    redisCacheClient = RedisCache.createClient({
      // url: `redis://offerwall-stg-serverless-jint5n.serverless.apse1.cache.amazonaws.com:6379`,
      url: CACHE_DATA.redisurl,
      // url: "redis://127.0.0.1:6379",
      pingInterval: CACHE_DATA.redisping,
      
    }).on("error", error => console.log("REDIS CLIENT ERROR : ", error))


    await redisCacheClient.connect()
    console.log("start  connection done")

  } catch (err) {
    console.log('Open Redis Connection: ', err)
  }
}

const getRedisCachedData = async (key) => {
  //if (Cache_Type == 'Redis') {
  try {

    const result = await redisCacheClient.get(key)
    return result
  } catch (err) {
    console.log('Redis Err GET: ', err)
  }
  // } else if (Cache_Type == 'Node_Cache') {
  //   const result = nodeCacheClient.get(key)
  //   return result
  // }
}

const setRedisCacheData = async (key, value) => {
  // if (Cache_Type == 'Redis') {
  try {
    const result = await redisCacheClient.set(key, value, {
      EX: CACHE_DATA.redisttl
    })
    // console.log("REDIS SET DONE : ", result)

    return result
  } catch (err) {
    console.log('Redis Err SET: ', err)
  }
  // } else if (Cache_Type == 'Node_Cache') {
  //   const result = nodeCacheClient.set(key, value, Cache_TTL)
  //   return result
  // }
}

const delRedisCachedData = async (key) => {
  //if (Cache_Type == 'Redis') {
  try {
    const result = await redisCacheClient.del(key);

    return result
  } catch (err) {
    console.log('Redis Err DEL: ', err)
  }
  // } else if (Cache_Type == 'Node_Cache') {
  //   const result = nodeCacheClient.set(key, value, Cache_TTL)
  //   return result
  // }
}

const flushRedisCluster = async () => {
  try {
    const [flush, ping] = await Promise.all([
      redisCacheClient.sendCommand(['FLUSHALL', 'SYNC']),
      redisCacheClient.ping(),
    ])

    return { flush, ping }
  } catch (err) {
    console.log('Flush Redis Cluster Err: ', err)
    throw new Error(err)
  }
}



const getNodeCachedData = async (key) => {
  try {

    const result = nodeCacheClient.get(key)
    // console.log("NODE Result : ", result)
    return result;
  } catch (err) {
    console.log('NODE Err GET: ', err)
  }
}

const setNodeCacheData = async (key, value) => {
  try {
    const result = nodeCacheClient.set(key, value, CACHE_DATA.nodettl)

    // console.log("NODE SET DONE : ", result)

    return result
  } catch (err) {
    console.log('NODE Err SET: ', err)
  }
}

const delNodeCachedData = async (key) => {
  try {
    const result = await nodeCacheClient.del(key);

    return result
  } catch (err) {
    console.log('NODE Err DEL: ', err)
  }
}

const flushNodeCluster = async () => {
  try {
    const [flush, ping] = await Promise.all([
      nodeCacheClient.flushAll(),
      nodeCacheClient.flushStats(),
    ])

    return { flush, ping }
  } catch (err) {
    console.log('Flush Redis Cluster Err: ', err)
    throw new Error(err)
  }
}




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
}
