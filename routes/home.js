const {Router} = require('express')
const router = Router()
const db = require('../db')

router.get('/', async (req, res) => {
    try {
        const popularResult = await db.query(`
            SELECT v.* FROM Vacancy v
            WHERE v.isConfirm = true
            ORDER BY v.created_at DESC
            LIMIT 3
        `)
        
        const popularVacancies = popularResult.rows.map(v => ({
            ...v
        }))

        res.render('index', {
            title: 'Главная',
            isAuth: !!req.user,
            popularVacancies,
            user: req.user || null,
            isHome: true
        })
    } catch (e) {
        console.error(e)
        res.status(500).send('Ошибка сервера')
    }
})

module.exports = router