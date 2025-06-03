const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

DBConnectionRead = null;
module.exports = {
    readpool: null,
    getReadPool() {
        if (!this.readpool) {
            logger.error('Read pool is not instantiated');
            throw new Error('Pool is not instantiated');
        }
        return this.readpool;
    },
    connectRead({ host, port, database, user, password }) {
        if (this.readpool) {
            logger.error('Read pool is already instantiated');
            throw new Error('Pool is already instantiated');
        }
        try {
            logger.info({ host, database }, 'Connecting to read database');
            const dbreadpool = mysql.createPool({
                host,
                user,
                password,
                database,
                port,
            });
            this.readpool = dbreadpool;
            DBConnectionRead = dbreadpool;
            logger.info('Successfully connected to read database');
        } catch (error) {
            logger.error({ err: error }, 'Failed to connect to read database');
            throw error;
        }
    },
    disconnectRead() {
        if (!this.readpool) {
            logger.error('Cannot disconnect, there is no read pool instantiated');
            throw new Error('Cannot disconnect, there is no readpool instantiated');
        }
        return new Promise((resolve, reject) => {
            this.readpool.end(err => {
                if (err) {
                    logger.error({ err }, 'Error disconnecting from read database');
                    reject(err);
                } else {
                    logger.info('Successfully disconnected from read database');
                    resolve();
                }
            });
            this.readpool = null;
        });
    },
}