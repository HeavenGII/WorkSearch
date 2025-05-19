// In middleware/csrfDouble.js
const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
});

const doubleCsrf = (req, res, next) => {
  // Only set XSRF-TOKEN cookie if it doesn't exist
  if (!req.cookies['XSRF-TOKEN']) {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      sameSite: 'strict'
    });
  }
  next();
};

module.exports = { csrfProtection, doubleCsrf }