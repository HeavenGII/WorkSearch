module.exports = function(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    
    console.log('Session user:', req.session.user);
    
    req.user = {
        userId: req.session.user.userid 
    };
    
    next();
};