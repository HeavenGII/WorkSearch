const keys = require('../keys')

module.exports = function(email, token) {
    return{
        to: email,
        from: keys.EMAIL_FROM,
        subject: 'Change password',
        html: `
            <h1>Забыл пароль?<h1>
            <p>Если нет, то проигнорируйте данное сообщение</p>
            <p>Иначе перейдите по ссыолке ниже:</p>
            <p><a href="https://worksearch-qhg0.onrender.com/auth/password/${token}">Изменить пароль</a></p>
            <hr />
            <a href="https://worksearch-qhg0.onrender.com">Главная страница</a>
            `
    }
}