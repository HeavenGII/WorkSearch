module.exports = function(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    
    req.user = {
        userId: req.session.user.userid 
    };
    
    next();
};