require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session')
var { engine } = require('express-handlebars')
var fileUpload = require('express-fileupload')
var db = require('./database/connection')

var usersRouter = require('./routes/users');
var sellersRouter = require('./routes/sellers');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layout'),
  partialsDir: path.join(__dirname, 'views/partials'),

  helpers: {
    eq: function (a, b) {
      return a === b;
    },
    subtract: (a, b) => Number(a) - Number(b),
    addition: (a, b) => Number(a) + Number(b),
    division: (a, b) => Number(a) / Number(b),
    multiply: (a, b) => Number(a) * Number(b),
    gt: (a, b) => Number(a) > Number(b),
    lt: (a, b) => Number(a) < Number(b),

    cartValue: (a, b, c) => Number(a) - Number(b) + Number(c)
  }
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((session({
  secret: process.env.EXPRESS_SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 6000000 }
})))

app.use((req, res, next) => {
  res.locals.message = req.session.message
  res.locals.error = req.session.error
  delete req.session.message
  delete req.session.error
  next()
})

app.use(fileUpload())
db.connect((err) => {
  if (err) console.log('Error connecting database :', err.message)
  else console.log('Connected to database successfully')
})

app.use('/', usersRouter);
app.use('/seller', sellersRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
