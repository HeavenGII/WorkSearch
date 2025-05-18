const { Router } = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const router = Router();

router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await db.query(`
            SELECT v.* 
            FROM Favourite f
            JOIN Vacancy v ON f.vacancyId = v.vacancyId
            WHERE f.userId = $1
        `, [userId]);

        const vacancies = result.rows.map(vacancy => ({
            ...vacancy,
            id: vacancy.vacancyid
        }))

        res.render('favourite', {
            title: 'Избранные вакансии',
            isFavourite: true,
            vacancies: vacancies,
            userId: req.user.userId,
            _csrf: req.csrfToken()
        })
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).render('error', { 
            message: 'Ошибка при получении избранных вакансий',
            error: error 
        })
    }
})

router.post('/add', auth, async (req, res) => {
    try {
        const vacancyId = req.body.id
        const userId = req.user.userId
        await db.query(
            'INSERT INTO Favourite (userId, vacancyId) VALUES ($1, $2) ON CONFLICT (userId, vacancyId) DO NOTHING',
            [userId, vacancyId]
        )
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при добавлении вакансии в избранное' })
    }
})

router.post('/remove/:id', auth, async (req, res) => {
    try {
        const userId = req.user.userId
        const vacancyId = req.params.id
        
        await db.query(
            'DELETE FROM Favourite WHERE userId = $1 AND vacancyId = $2',
            [userId, vacancyId]
        )
        
        res.redirect('/favourite')
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка при удалении вакансии' })
    }
})


module.exports = router