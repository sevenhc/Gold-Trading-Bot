const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

DBConnection = null;
module.exports = {
    pool: null,
    getPool() {
        if (!this.pool) {
            logger.error('Pool is not instantiated');
            throw new Error('Pool is not instantiated');
        }
        return this.pool;
    },
    connect({ host, port, database, user, password }) {
        if (this.pool) {
            logger.error('Pool is already instantiated');
            throw new Error('Pool is already instantiated');
        }
        try {
            logger.info({ host, database }, 'Connecting to main database');
            const dbpool = mysql.createPool({
                host,
                user,
                password,
                database,
                port,
            });
            this.pool = dbpool;
            DBConnection = dbpool;
            logger.info('Successfully connected to main database');
        } catch (error) {
            logger.error({ err: error }, 'Failed to connect to main database');
            throw error;
        }
    },
    disconnect() {
        if (!this.pool) {
            logger.error('Cannot disconnect, there is no pool instantiated');
            throw new Error('Cannot disconnect, there is no pool instantiated');
        }
        return new Promise((resolve, reject) => {
            this.pool.end(err => {
                if (err) {
                    logger.error({ err }, 'Error disconnecting from main database');
                    reject(err);
                } else {
                    logger.info('Successfully disconnected from main database');
                    resolve();
                }
            });
            this.pool = null;
        });
    },
}