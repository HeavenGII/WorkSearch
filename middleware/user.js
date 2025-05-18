const db = require('../db')

module.exports = async function(req, res, next) {
    if (!req.session.user) {
        return next()
    }

    try {
        const result = await db.query('SELECT * FROM Users WHERE userId = $1', [req.session.user._id])
        req.user = result.rows
    } catch (e) {
        console.error(e)
    }
    
    next()
}