
const mysql = require('mysql2/promise')


DBConnectionRead = null;
module.exports = {
    readpool: null,
    getReadPool() {
        if (!this.readpool) {
            throw new Error('Pool is not instantiated')
        }
        return this.readpool
    },
    connectRead({ host, port, database, user, password }) {
        if (this.readpool) {
            throw new Error('Pool is already instantiated')
        }
        const dbreadpool = mysql.createPool({
            host,
            user,
            password,
            database,
            port,
        })
        this.readpool = dbreadpool
        DBConnectionRead = dbreadpool;
    },
    disconnectRead() {
        if (!this.readpool) {
            throw new Error('Cannot disconnect, there is no readpool instantiated')
        }
        return new Promise((resolve, reject) => {
            this.readpool.end(err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
            this.readpool = null
        })
    },
}
