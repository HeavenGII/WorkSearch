const { Router } = require('express')
const auth = require('../middleware/auth')
const db = require('../db')
const router = Router()

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

function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU')
}

router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.*, p.* 
            FROM Users u
            LEFT JOIN Portfolio p ON u.portfolioId = p.portfolioId
            WHERE u.userId = $1
        `, [req.user.userId])
        
        const userData = result.rows[0]

        if (!userData) {
            return res.status(404).render('error', {
                title: 'Ошибка',
                message: 'Пользователь не найден'
            })
        }

        const { portfolioid, ...user } = userData
        const portfolio = userData.portfolioid ? userData : {}

        const vacanciesResult = await db.query(`
            SELECT 
                v.*,
                to_char(v.created_at, 'DD.MM.YYYY') as formatted_date,
                CASE 
                    WHEN length(v.description) > 100 THEN substring(v.description, 1, 100) || '...'
                    ELSE v.description
                END as short_description
            FROM Vacancy v
            WHERE v.userId = $1
            ORDER BY v.created_at DESC
        `, [req.user.userId])
        
        const userVacancies = vacanciesResult.rows.map(vacancy => ({
            ...vacancy,
            salary: vacancy.salary ? Number(vacancy.salary) : null,
            employmentTypeText: getEmploymentTypeText(vacancy.employment_type),
            experienceText: getExperienceText(vacancy.experience)
        }))

        res.render('profile', {
            title: 'Profile',
            isProfile: true,
            user: user,
            portfolio: portfolio,
            userVacancies: userVacancies,
            csrf: req.csrfToken(),
            helpers: {
                getEmploymentTypeText: getEmploymentTypeText,
                getExperienceText: getExperienceText,
                formatDate: formatDate
            }
        })
    } catch (e) {
        console.error('Profile error:', e)
        res.status(500).render('error', {
            title: 'Ошибка',
            message: 'Не удалось загрузить профиль',
            error: e
        })
    }
})

router.post('/', auth, async (req, res) => {
    try {
        const toChange = {
            name: req.body.name,
            surname: req.body.surname,
            secondname: req.body.secondname,
            city: req.body.city,
            birthday: req.body.birthday,
            sex: req.body.sex,
            education: req.body.education,
            telephone: req.body.telephone,
            information: req.body.information,
            avatarUrl: req.file ? req.file.location : null
        }

        if (req.file) {
            toChange.avatarUrl = `/images/${req.file.filename}`
        }

        const userResult = await db.query('SELECT portfolioId FROM Users WHERE userId = $1', [req.user.userId])
        const portfolioId = userResult.rows[0].portfolioid

        if (portfolioId) {
            await db.query(
                `UPDATE Portfolio SET
                    name = $1,
                    surname = $2,
                    secondname = $3,
                    city = $4,
                    birthday = $5,
                    sex = $6,
                    education = $7,
                    telephone = $8,
                    information = $9,
                    avatarUrl = COALESCE($10, avatarUrl)
                WHERE portfolioId = $11`,
                [
                    toChange.name,
                    toChange.surname,
                    toChange.secondname,
                    toChange.city,
                    toChange.birthday,
                    toChange.sex,
                    toChange.education,
                    toChange.telephone,
                    toChange.information,
                    toChange.avatarUrl,
                    portfolioId
                ]
            )
        } else {
            const newPortfolio = await db.query(
                `INSERT INTO Portfolio (
                    name, surname, secondname, city, birthday, 
                    sex, education, telephone, information, avatarUrl
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING portfolioId`,
                [
                    toChange.name,
                    toChange.surname,
                    toChange.secondname,
                    toChange.city,
                    toChange.birthday,
                    toChange.sex,
                    toChange.education,
                    toChange.telephone,
                    toChange.information,
                    toChange.avatarUrl
                ]
            )
            await db.query(
                'UPDATE Users SET portfolioId = $1 WHERE userId = $2',
                [newPortfolio.rows[0].portfolioid, req.user.userId]
            )
        }

        res.redirect('/profile');
    } catch (e) {
        console.error('Update error:', e)
        res.status(500).render('error', {
            title: 'Ошибка',
            message: 'Произошла ошибка при обновлении профиля',
            error: e
        })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const userResult = await db.query(`
            SELECT u.*, p.* 
            FROM Users u
            LEFT JOIN Portfolio p ON u.portfolioId = p.portfolioId
            WHERE u.userId = $1
        `, [userId])
        
        const userData = userResult.rows[0]

        if (!userData) {
            return res.status(404).render('error', {
                title: 'Ошибка',
                message: 'Пользователь не найден'
            })
        }

        const { portfolioid, ...user } = userData
        const portfolio = portfolioid ? userData : {}

        res.render('profile-view', {
            title: `${user.nickname || user.email.split('@')[0]} - Profile`,
            user: user,
            portfolio: portfolio,
            helpers: {
                formatDate: function(date) {
                    if (!date) return ''
                    return new Date(date).toLocaleDateString('ru-RU')
                }
            }
        })
    } catch (e) {
        console.error('Ошибка при получении профиля пользователя:', e)
        res.status(500).render('error', {
            title: 'Ошибка',
            message: 'Ошибка при получении профиля пользователя',
            error: e
        })
    }
})

module.exports = router