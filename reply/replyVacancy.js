const keys = require('../keys')

module.exports = function(ownerEmail,vacancy, user) {
    return{
        from: keys.EMAIL_FROM,
        to: ownerEmail,
        subject: `Новый отклик на вакансию "${vacancy.title}"`,
        html: `
                <h2>Новый отклик на вакансию</h2>
                <p>Пользователь <a href="http://localhost:3000/profile/${user.userid}">${user.nickname}</a> откликнулся на вакансию 
                <a href="http://localhost:3000/vacancies/${vacancy.vacancyid}">${vacancy.title}</a>.</p>
                <p>Вы можете связаться с кандидатом по email: ${user.email}</p>
                <hr>
                <p>Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
            `
    }
}