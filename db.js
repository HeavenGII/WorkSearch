const Pool = require('pg').Pool
const pool = new Pool({
    user: "postgres",
    password: "31052022",
    host: "localhost",
    port: 5432,
    database: "WorkSearch"
})

module.exports = pool