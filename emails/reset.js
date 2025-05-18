const keys = require('../keys')

module.exports = function(email, token) {
    return{
        to: email,
        from: keys.EMAIL_FROM,
        subject: 'Change password',
        html: `
            <h1>Забыл пароль?/h1>
            <p>Если нет, то проигнорируйте данное сообщение</p>
            <p>Иначе перейдите по ссыолке ниже:</p>
            <p><a href="${keys.BASE_URL}/auth/password/${token}">Изменить пароль</a></p>
            <hr />
            <a href="${keys.BASE_URL}">Главная страница</a>
            `
    }
}