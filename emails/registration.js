const keys = require('../keys')

module.exports = function(email) {
    return {
        to: email,
        from: keys.EMAIL_FROM,
        subject: 'Аккаунт создан',
        html: `
            <h1>Добро пожаловать!</h1>
            <p>Ваш аккаунт был успешно создан с почтой - ${email}</p>
            <hr />
            <a href="https://worksearch-qhg0.onrender.com">Главная страница</a>
            `
    }
}