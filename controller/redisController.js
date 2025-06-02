const { getCachedData, flushRedisCluster, flushNodeCluster } = require("../utils/cache");




exports.FlushRedisCache = async (req, res, next) => {
    try {

        const result = await flushRedisCluster()
        res.status(200).json(result);
    } catch (error) {
        if (error?.response?.status) {
            console.log("Redis Error: ", error.response.status, error.response.data)
        } else {
            console.log("Redis Error 2: ", error)
        }
        res.status(400).json({
            "message": "No Redis",
            "code": "OWER0010"
        });
    }
}

exports.FlushNodeCache = async (req, res, next) => {
    try {
       
        const result = await flushNodeCluster()
        res.status(200).json(result);
    } catch (error) {
        if (error?.response?.status) {
            console.log("Node Error: ", error.response.status, error.response.data)
        } else {
            console.log("Node Error 2: ", error)
        }
        res.status(400).json({
            "message": "No Node",
            "code": "OWER0010"
        });
    }
}
