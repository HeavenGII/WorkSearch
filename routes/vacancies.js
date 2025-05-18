const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = Router();
const nodemailer = require('nodemailer');
const replyVacancy = require('../reply/replyVacancy')
const keys = require('../keys');


function isOwner(vacancy, req) {
    return vacancy.userId === req.session.user.userId;
}

const transporter = nodemailer.createTransport({
    host: keys.SMTP_HOST,
    port: keys.SMTP_PORT,
    secure: true,
    auth: {
        user: keys.SMTP_USER,
        pass: keys.SMTP_PASSWORD
    }
});

router.get('/', async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.userid : null

        const result = await db.query(`
            SELECT 
                v.*,
                u.nickname as author_nickname,
                u.email as author_email,
                to_char(v.created_at, 'DD.MM.YYYY') as formatted_date,
                CONCAT(v.location, ', ', v.street) as full_location
            FROM Vacancy v
            LEFT JOIN Users u ON v.userId = u.userId
            WHERE v.isConfirm = true 
              AND ($1::int IS NULL OR v.userId <> $1)
            ORDER BY v.created_at DESC
        `, [userId])

        const vacancies = result.rows.map(vacancy => ({
            ...vacancy,
            salary: vacancy.salary,
            employmentTypeText: getEmploymentTypeText(vacancy.employment_type),
            experienceText: getExperienceText(vacancy.experience),
            shortDescription: vacancy.description.length > 100 
                ? vacancy.description.substring(0, 100) + '...' 
                : vacancy.description,
            author: vacancy.author_nickname || vacancy.author_email.split('@')[0]
        }))

        res.render('vacancies', {
            title: 'Вакансии',
            isVacancies: true,
            user: req.session.user || null,
            isAuth: !!req.session.user,
            csrf: req.csrfToken(),
            vacancies
        })
    } catch (e) {
        console.error('Ошибка при получении вакансий:', e)
        res.status(500).render('error', {
            title: 'Ошибка',
            message: 'Не удалось загрузить список вакансий',
            error: e
        })
    }
})

function getEmploymentTypeText(type) {
    const types = {
        'FULL': 'Полная занятость',
        'PART': 'Частичная занятость',
        'REMOTE': 'Удалённая работа',
        'INTERN': 'Стажировка'
    }
    return types[type] || 'Не указано'
}

function getExperienceText(exp) {
    const experiences = {
        'no': 'Без опыта',
        '1-3': '1-3 года',
        '3-5': '3-5 лет',
        '5+': 'Более 5 лет'
    }
    return experiences[exp] || 'Не имеет значения'
}

function getExperienceText(exp) {
    const experiences = {
        'no': 'Без опыта',
        '1-3': '1-3 года',
        '3-5': '3-5 лет',
        '5+': 'Более 5 лет'
    }
    return experiences[exp] || 'Не имеет значения'
}

router.get('/:id/edit', auth, async (req, res) => {
    if (!req.query.allow) {
        return res.redirect('/profile#vacancies')
    }
    try {
        const result = await db.query('SELECT * FROM Vacancy WHERE vacancyid = $1', [req.params.id])
        const vacancy = result.rows[0]

        if (!isOwner(vacancy, req)) {
            return res.redirect('/vacancies')
        }
        res.render('vacancy-edit', {
            title: `Редактировать ${vacancy.title}`,
            vacancy
        })
    } catch (e) {
        console.log(e)
    }
})

router.post('/edit', auth, async (req, res) => {
    try {
        const { 
            id,
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
        } = req.body
        
        const userId = req.user.userId

        const result = await db.query('SELECT * FROM Vacancy WHERE vacancyid = $1', [id])
        const vacancy = result.rows[0]
        
        if (!vacancy) {
            req.flash('error', 'Вакансия не найдена')
            return res.redirect('/vacancies')
        }
        
        if (vacancy.userid !== userId) {
            req.flash('error', 'Недостаточно прав для редактирования')
            return res.redirect('/vacancies')
        }
        const bool = false
        await db.query(
            `UPDATE Vacancy SET
                title = $1,
                salary = $2,
                company = $3,
                location = $4,
                street = $5,
                employment_type = $6,
                experience = $7,
                description = $8,
                requirements = $9,
                benefits = $10,
                isConfirm = $11
            WHERE vacancyid = $12`,
            [
                title,
                Number(salary),
                company,
                location,
                street,
                employmentType,
                experience,
                description,
                requirements,
                benefits,
                bool,
                id
            ]
        )
        res.redirect(`/profile#vacancies`)
    } catch (e) {
        console.error('Ошибка при редактировании вакансии:', e)
        req.flash('error', 'Произошла ошибка при обновлении вакансии')
        res.redirect('/vacancies')
    }
})

router.post('/remove', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM Vacancy WHERE vacancyId = $1 AND userid = $2', [req.body.id, req.user.userId])
        res.redirect('/profile#vacancies')
    } catch (e) {
        console.log(e)
    }
})


router.get('/filter', async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.userid : null
        const { 
            search, 
            employmentType, 
            experience, 
            location, 
            salaryMin, 
            salaryMax,
            page = 1,
            limit = 10 
        } = req.query

        let countQuery = `
            SELECT COUNT(*) 
            FROM Vacancy v
            WHERE v.isConfirm = true
              AND ($1::int IS NULL OR v.userId <> $1)
        `

        let query = `
            SELECT 
                v.*,
                u.nickname as author_nickname,
                u.email as author_email,
                to_char(v.created_at, 'DD.MM.YYYY') as formatted_date,
                CONCAT(v.location, ', ', v.street) as full_location
            FROM Vacancy v
            LEFT JOIN Users u ON v.userId = u.userId
            WHERE v.isConfirm = true
              AND ($1::int IS NULL OR v.userId <> $1)
        `

        const conditions = []
        const params = [userId]
        let paramIndex = 2

        if (search) {
            conditions.push(`(v.title ILIKE $${paramIndex} OR v.description ILIKE $${paramIndex})`)
            params.push(`%${search}%`)
            paramIndex++
        }
        if (employmentType) {
            conditions.push(`v.employment_type = $${paramIndex}`)
            params.push(employmentType)
            paramIndex++
        }
        if (experience) {
            conditions.push(`v.experience = $${paramIndex}`)
            params.push(experience)
            paramIndex++
        }
        if (location) {
            conditions.push(`(v.location ILIKE $${paramIndex} OR v.street ILIKE $${paramIndex})`)
            params.push(`%${location}%`)
            paramIndex++
        }
        if (salaryMin && !isNaN(parseFloat(salaryMin))) {
            conditions.push(`v.salary >= $${paramIndex}`)
            params.push(parseFloat(salaryMin))
            paramIndex++
        }
        if (salaryMax && !isNaN(parseFloat(salaryMax))) {
            conditions.push(`v.salary <= $${paramIndex}`)
            params.push(parseFloat(salaryMax))
            paramIndex++
        }

        if (conditions.length > 0) {
            const whereClause = ` AND ${conditions.join(' AND ')}`
            query += whereClause
            countQuery += whereClause
        }

        const countResult = await db.query(countQuery, params)
        const total = parseInt(countResult.rows[0].count)
        const totalPages = Math.ceil(total / limit)

        query += ` 
            ORDER BY v.vacancyId DESC, v.created_at DESC 
            LIMIT $${paramIndex} 
            OFFSET $${paramIndex + 1}
        `
        params.push(limit, (page - 1) * limit)

        const result = await db.query(query, params)

        const vacancies = result.rows.map(vacancy => ({
            ...vacancy,
            salary: vacancy.salary,
            employmentTypeText: getEmploymentTypeText(vacancy.employment_type),
            experienceText: getExperienceText(vacancy.experience),
            shortDescription: vacancy.description.length > 100 
                ? vacancy.description.substring(0, 100) + '...' 
                : vacancy.description,
            author: vacancy.author_nickname || vacancy.author_email.split('@')[0]
        }))
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: true,
            vacancies,
            pagination: { 
                page: parseInt(page),
                totalPages,
                totalItems: total,
                hasPrev: page > 1,
                hasNext: page < totalPages
             },
            user: req.session.user || null,
            isAuth: !!req.session.user,
            _csrf: req.csrfToken()
        })
    } catch (e) {
        console.error('Ошибка при фильтрации вакансий:', e)
        res.status(500).json({ 
            success: false,
            error: 'Ошибка сервера',
            details: e.message
        })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.userid : null
        const vacancyId = req.params.id

        const result = await db.query(`
            SELECT 
                v.*,
                u.nickname as author_nickname,
                u.email as author_email,
                to_char(v.created_at, 'DD.MM.YYYY') as formatted_date,
                EXISTS(
                    SELECT 1 FROM Replys r 
                    WHERE r.userId = $1 AND r.vacancyId = v.vacancyId
                ) as has_applied
            FROM Vacancy v
            LEFT JOIN Users u ON v.userId = u.userId
            WHERE v.vacancyId = $2
        `, [userId, vacancyId])

        if (!result.rows[0]) {
            return res.status(404).render('404', { title: 'Вакансия не найдена' })
        }

        const vacancy = result.rows[0]
        
        res.render('vacancy', {
            title: vacancy.title,
            vacancy: {
                ...vacancy,
                employmentTypeText: getEmploymentTypeText(vacancy.employment_type),
                experienceText: getExperienceText(vacancy.experience),
                author: vacancy.author_nickname || vacancy.author_email.split('@')[0]
            },
            user: req.session.user || null,
            isAuth: !!req.session.user,
            csrf: req.csrfToken(),
            hasApplied: vacancy.has_applied
        })
    } catch (e) {
        console.error('Ошибка при получении вакансии:', e)
        res.status(500).render('error', {
            title: 'Ошибка',
            message: 'Не удалось загрузить вакансию',
            error: e
        })
    }
})


router.post('/reply/:id', auth, async (req, res) => {
    try {
        const userId = req.session.user.userid
        const vacancyId = req.params.id

        const vacancyResult = await db.query(`
            SELECT v.*, u.email as owner_email, u.userId as owner_id 
            FROM Vacancy v 
            JOIN Users u ON v.userId = u.userId 
            WHERE v.vacancyId = $1`,
            [vacancyId]
        )

        if (!vacancyResult.rows[0]) {
            return res.status(404).json({ success: false, error: 'Вакансия не найдена' })
        }

        const vacancy = vacancyResult.rows[0]

        const existingReply = await db.query(
            'SELECT * FROM Replys WHERE userId = $1 AND vacancyId = $2',
            [userId, vacancyId]
        )

        if (existingReply.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Вы уже откликались на эту вакансию' 
            })
        }

        if (userId === vacancy.owner_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Нельзя откликаться на собственную вакансию' 
            })
        }

        await db.query(
            'INSERT INTO Replys (userId, vacancyId) VALUES ($1, $2)',
            [userId, vacancyId]
        )

        await transporter.sendMail(replyVacancy(vacancy.owner_email, vacancy, req.session.user))

        res.json({ success: true, message: 'Отклик успешно отправлен' })

    } catch (e) {
        console.error('Ошибка при обработке отклика:', e)
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при обработке отклика' 
        })
    }
})

module.exports = router