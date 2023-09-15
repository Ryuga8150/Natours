const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); //the naming is done like that in documentation
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes'); //js not required
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

//Setting up the engine with pug
app.set('view engine', 'pug');
//describing where our views are stored
//since our path is relative to current folder
// here is the alternative for dir command
app.set('views', path.join(__dirname, 'views'));
//We always don't know that the path we are receiving already has a slash or not

//Serving static files
//earlier: app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//1) Global MidlleWaress
//app.use(helmet());
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         connectSrc: ["'self'", 'http://127.0.0.1:3000'],
//       },
//     },
//   })
// );
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb', //specifying how much data can be allowed in the body
  })
);
//above one parses data from body

//to parse data coming from the form
app.use(express.urlencoded({ extended: true, limit: '10kb ' }));

//below one parses data from cookie
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XS5
app.use(xss());

//Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//Test MiddleWare
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

// Routes
console.log('Reached App');
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Below one will be called when none of the above route are hit
//* means all other paths
app.all('*', (req, res, next) => {
  console.log(`Global Error collector called`);

  const errObj = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  console.log(errObj);
  next(errObj);
});

//error handling middleware fro Global error handling
app.use(globalErrorHandler);

module.exports = app;
