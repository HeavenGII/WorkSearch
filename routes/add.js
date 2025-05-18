const { Router } = require('express')
const auth = require('../middleware/auth')
const db = require('../db')
const router = Router()

router.get('/', auth, async (req, res) => {
    console.log(req.user.userId)
    const user = await db.query(`SELECT * FROM Users WHERE UserId = ${req.user.userId}`)
    res.render('add', {
        title: 'Добавить вакансию',
        isAdd: true,
        user: user.rows[0],
        csrf: req.csrfToken() 
    })
})

router.post('/', auth, async (req, res) => {
    const { 
        title,
        salary,
        company,
        location,
        street,
        employmentType,
        experience,
        description,
        requirements,
        benefits
    } = req.body
    
    const userId = req.user.userId

    try {
        const user = await db.query('SELECT email FROM Users WHERE UserId = $1', [userId])
        const contactEmail = user.rows[0].email
        await db.query(
            `INSERT INTO Vacancy (
                title, 
                salary,
                company,
                location,
                street,
                employment_type,
                experience,
                description,
                requirements,
                benefits,
                contact_email,
                userId
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                title,
                salary,
                company,
                location,
                street,
                employmentType,
                experience,
                description,
                requirements,
                benefits,
                contactEmail,
                userId
            ]
        )
        res.redirect('/vacancies')
    } catch (e) {
        console.log(e)
        res.status(500).send('Ошибка при добавлении вакансии')
    }
})

module.exports = router