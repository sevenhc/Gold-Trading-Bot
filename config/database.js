
const mysql = require('mysql2/promise')

DBConnection = null;
module.exports = {
    pool: null,
    getPool() {
        if (!this.pool) {
            throw new Error('Pool is not instantiated')
        }
        return this.pool
    },
    connect({ host, port, database, user, password }) {
        if (this.pool) {
            throw new Error('Pool is already instantiated')
        }
        const dbpool = mysql.createPool({
            host,
            user,
            password,
            database,
            port,
        })
        this.pool = dbpool
        DBConnection = dbpool;
    },
    disconnect() {
        if (!this.pool) {
            throw new Error('Cannot disconnect, there is no pool instantiated')
        }
        return new Promise((resolve, reject) => {
            this.pool.end(err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
            this.pool = null
        })
    },
}



// const mysql = require("mysql2");
// const DB = require("../Global");


//  let data = {
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE,
//     port: process.env.DB_PORT,
//     pool:100

// }
// let connectionPool  = mysql.createPool(data);

// module.exports = connectionPool.promise();