const { body } = require('express-validator');
const db = require('../db');

exports.registerValidators = [
    body('email')
        .isEmail().withMessage('Введите корректную почту')
        .custom(async (value, { req }) => {
            try {
                const result = await db.query('SELECT * FROM Users WHERE email = $1', [value]);
                if (result.rows.length > 0) {
                    return Promise.reject('Эта почта занят');
                }
            } catch (e) {
                console.log(e);
            }
        })
        .normalizeEmail(),
    body('password', 'Пароль должен содержать минимум 6 символов')
        .isLength({ min: 6, max: 56 })
        .isAlphanumeric()
        .trim(),
    body('confirm')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Пароли должны совпадать');
            }
            return true;
        })
        .trim(),
    body('name')
        .isLength({ min: 3 }).withMessage('Имя должно содержать минимум 3 символа')
        .trim()
];