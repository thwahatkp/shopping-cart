var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var fileupload = require('express-fileupload')
var Handlebars = require('handlebars');
var db = require('./config/connection');
const session = require('express-session')

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layouts',partialsDir:__dirname+'/views/partials/'}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload());
app.use(session({secret:'Key1',cookie:{maxAge:36000000}}));

/* This is a helper function that is used to increment the value of a variable. */
Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

/* This is a callback function that is called when the database is connected. */
db.connect((err)=>{
  if(err) console.log('Database not connected'+err);
  else console.log('Database successfully connected...');
});

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
