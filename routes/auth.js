const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const keys = require('../keys');
const regEmail = require('../emails/registration');
require('dotenv').config();
const resetEmail = require('../emails/reset');
const { registerValidators } = require('../utils/validators');
const db = require('../db');
const router = Router();

const transporter = nodemailer.createTransport({
    host: keys.SMTP_HOST,
    port: keys.SMTP_PORT,
    secure: true,
    auth: {
        user: keys.SMTP_USER,
        pass: keys.SMTP_PASSWORD
    }
});

router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: "Authorization",
        isLogin: true,
        loginError: req.flash('loginError'),
        registerError: req.flash('registerError')
    })
})


router.post('/register', registerValidators, async (req, res) => {
    console.log('=== REGISTER START ===');
    console.log('Request body:', req.body);
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('registerError', errors.array()[0].msg)
            return res.redirect('/auth/login#register')
        }
        const { name, email, password, confirm } = req.body
        
        if (password !== confirm) {
            req.flash('registerError', 'Пароли не совпадают')
            return res.redirect('/auth/login#register')
        }

        const result = await db.query('SELECT * FROM Users WHERE email = $1 OR nickname = $2', [email, name])
        const candidate = result.rows[0]

        if (candidate) {
            console.log('Found existing user:', candidate)
            if (candidate.email === email) {
                req.flash('registerError', 'Эта почта уже зарегистрирована')
                return res.redirect('/auth/login#register')
            }
            if (candidate.nickname === name) {
                req.flash('registerError', 'Это имя уже занято')
                return res.redirect('/auth/login#register')
            }
        }

        const hashPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO Users (nickname, email, password) VALUES ($1, $2, $3)',
            [name, email, hashPassword]
        )

        await transporter.sendMail(regEmail(email))
            .then(() => console.log('Email sent successfully'))
            .catch(error => console.error('Error sending email:', error))

        res.redirect('/auth/login#login')
    } catch (e) {
        console.error('Register error:', e);
        req.flash('registerError', 'Ошибка сервера при регистрации');
        return res.redirect('/auth/login#register');
    }
})


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const result = await db.query('SELECT * FROM Users WHERE email = $1', [email])
        const candidate = result.rows[0]
        if (!candidate) {
            req.flash('loginError', 'Такой пользователь не существует')
            return res.redirect('/auth/login#login')
        }

        if (candidate) {
            const areSame = await bcrypt.compare(password, candidate.password)

            if (areSame) {
                req.session.user = candidate
                req.session.isAuthenticated = true
                req.session.save((err) => {
                    if (err) {
                        throw err
                    }
                    res.redirect('/')
                });
            } else {
                req.flash('loginError', 'Неверная почта или пароль')
                res.redirect('/auth/login#login')
            }
        } else {
            req.flash('loginError', 'Пользователь не существует')
            res.redirect('/auth/login#login')
        }
    } catch (e) {
        console.log(e)
    }
})


router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login')
    })
})


router.get('/reset', (req, res) => {
    res.render('auth/reset', {
        title: 'Забыли пароль',
        error: req.flash('error')
    })
})


router.post('/reset', async (req, res) => {
    try {
        if (!req.body.email) {
            req.flash('error', 'Почта некорректа')
            return res.redirect('/auth/reset')
        }

        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash('error', 'Ошибка содания токена')
                return res.redirect('/auth/reset')
            }

            const token = buffer.toString('hex')
            const expiryDate = new Date(Date.now() + 3600000)
            
            try {
                const result = await db.query('SELECT * FROM Users WHERE email = $1', [req.body.email])
                const candidate = result.rows[0]
                
                if (!candidate) {
                    req.flash('error', 'Пользователь с такой почтой не сущесвтует')
                    return res.redirect('/auth/reset')
                }

                await db.query(
                    'UPDATE Users SET resetToken = $1, resetTokenExp = $2 WHERE userid = $3',
                    [token, expiryDate, candidate.userid]
                )

                await transporter.sendMail(resetEmail(candidate.email, token))
                res.redirect('/auth/login')
            } catch (dbError) {
                console.error('Database error:', dbError);
                req.flash('error', 'Error processing your request')
                res.redirect('/auth/reset');
            }
        })
    } catch (e) {
        console.error('Reset error:', e)
        req.flash('error', 'An error occurred')
        res.redirect('/auth/reset')
    }
})


router.get('/password/:token', async (req, res) => {
    try {
        if (!req.params.token) {
            req.flash('loginError', 'Некрректный токен')
            return res.redirect('/auth/login')
        }

        const result = await db.query(
            'SELECT * FROM Users WHERE resetToken = $1 AND resetTokenExp > NOW()',
            [req.params.token]
        )

        const user = result.rows[0]

        if (!user) {
            req.flash('loginError', 'Неверный или истёкший токен')
            return res.redirect('/auth/login')
        }

        res.render('auth/password', {
            title: 'Сброс пароля',
            error: req.flash('error'),
            token: req.params.token,
            userid: user.userid
        })
    } catch (e) {
        req.flash('loginError', 'Ошибка подтверждения токена')
        res.redirect('/auth/login')
    }
})


router.post('/password', async (req, res) => {
    try {
        const { userId, token, password, confirm } = req.body;
        
        if (!userId || !token || !password || !confirm) {
            req.flash('error', 'Заполните все поля')
            return res.redirect(`/auth/password/${token}`)
        }

        if (password !== confirm) {
            req.flash('error', 'Пароли не совпадают');
            return res.redirect(`/auth/password/${token}`)
        }

        if (password.length < 6) {
            req.flash('error', 'Пароль должен быть не менее 6 символов')
            return res.redirect(`/auth/password/${token}`)
        }

        const userResult = await db.query(
            'SELECT * FROM Users WHERE userid = $1 AND resetToken = $2 AND resetTokenExp > NOW()',
            [userId, token]
        )

        const user = userResult.rows[0]
        if (!user) {
            req.flash('loginError', 'Ссылка для сброса устарела')
            return res.redirect('/auth/login')
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await db.query(
            'UPDATE Users SET password = $1, resetToken = NULL, resetTokenExp = NULL WHERE userid = $2',
            [hashedPassword, userId]
        )

        req.flash('success', 'Пароль успешно изменён')
        res.redirect('/auth/login')
    } catch (e) {
        console.error('Password reset error:', e)
        req.flash('error', 'Ошибка при смене пароля')
        res.redirect(`/auth/password/${req.body.token}`)
    }
})

module.exports = router