const express = require('express')
const path = require('path')
const csrf = require('csurf')
const cookieParser = require('cookie-parser')
const { csrfProtection, doubleCsrf } = require('./middleware/csrfDouble')
const flash = require('connect-flash')
const helmet = require('helmet')
const compression = require('compression')
const session = require('express-session')
const { engine } = require('express-handlebars')
const homeRoutes = require('./routes/home')
const addRoutes = require('./routes/add')
const vacanciesRoutes = require('./routes/vacancies')
const favouriteRoutes = require('./routes/favourite')
const authRoutes = require('./routes/auth')
const profileRoutes = require('./routes/profile')
const varMiddleware = require('./middleware/variables')
const userMiddleware = require('./middleware/user')
const errorHandler = require('./middleware/error')
const fileMiddleware = require('./middleware/file')
const keys = require('./keys')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')
const Handlebars = require('handlebars')


const app = express();


app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: 'hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars), 
    helpers: require('./utils/hbs-helpers')
}))

app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.static(path.join(__dirname, 'public')))
const imagesDir = path.join(__dirname, 'images')
app.use('/images', express.static(imagesDir))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(session({
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}))
app.use(fileMiddleware.single('avatar'))
app.use(flash())
app.use(helmet())
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
            "'self'", 
            "https://cdnjs.cloudflare.com", 
            "'unsafe-inline'",
            "'unsafe-eval'"
        ],
        styleSrc: [
            "'self'", 
            "https://cdnjs.cloudflare.com", 
            "'unsafe-inline'",
            "https://fonts.googleapis.com"
        ],
        fontSrc: [
            "'self'", 
            "https://fonts.gstatic.com", 
            "https://cdnjs.cloudflare.com"
        ],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
    }
}))
app.use(csrfProtection)
app.use(doubleCsrf)
app.use(compression())
app.use(varMiddleware)
app.use(userMiddleware)

app.use('/', homeRoutes)
app.use('/add', addRoutes)
app.use('/vacancies', vacanciesRoutes)
app.use('/auth', authRoutes)
app.use('/favourite', favouriteRoutes)
app.use('/profile', profileRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('server is running on port: ', PORT);
})


/*
const express = require('express');
const path = require('path');
const flash = require('connect-flash');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const { engine } = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const cookieParser = require('cookie-parser');
const { csrfProtection, doubleCsrf } = require('./middleware/csrfDouble');
const homeRoutes = require('./routes/home');
const addRoutes = require('./routes/add');
const vacanciesRoutes = require('./routes/vacancies');
const favouriteRoutes = require('./routes/favourite');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const varMiddleware = require('./middleware/variables');
const userMiddleware = require('./middleware/user');
const errorHandler = require('./middleware/error');
const fileMiddleware = require('./middleware/file');
const keys = require('./keys');

const app = express();

app.engine('hbs', engine({
  defaultLayout: 'main',
  extname: 'hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: require('./utils/hbs-helpers')
}));

app.set('view engine', 'hbs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use(session({
  secret: keys.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(fileMiddleware.single('avatar'));
app.use(flash());
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'", 
      "https://cdnjs.cloudflare.com", 
      "'unsafe-inline'",
      "'unsafe-eval'"
    ],
    styleSrc: [
      "'self'", 
      "https://cdnjs.cloudflare.com", 
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ],
    fontSrc: [
      "'self'", 
      "https://fonts.gstatic.com", 
      "https://cdnjs.cloudflare.com"
    ],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"]
  }
}))
app.use(compression());
app.use(csrfProtection);
app.use(doubleCsrf);

app.use(varMiddleware);
app.use(userMiddleware);

app.use('/', homeRoutes);
app.use('/add', addRoutes);
app.use('/vacancies', vacanciesRoutes);
app.use('/auth', authRoutes);
app.use('/favourite', favouriteRoutes);
app.use('/profile', profileRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port `, PORT);
}); 
*/