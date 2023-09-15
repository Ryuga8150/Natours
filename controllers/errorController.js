const AppError = require('./../utils/appError');
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  //console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};
const handleValidationError = (err) => {
  //to iterate over the object we use object.values
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please login Again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired!. Please login Again!', 401);
//For error handlers
const sendErrorDev = (err, req, res) => {
  //console.log('Development Hitttttttt');
  //console.log(err);

  //req.originalUrl => meaning url without localhost
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) Rendered Website
  console.error('Error', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message, //we are doing this because we are in development
  });
};
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  console.log(err);

  if (req.originalUrl.startsWith('/api')) {
    // A) Operational trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknown error: don't leak error details
    }
    // B) Programming or other unknown error: don't leak error details
    //for handling errors coming from mongoose for eg
    //1) log error
    console.log('ERROR !!!', err);

    //2) send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!!!',
    });
  }
  // B) RENDERED WEBSITE
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message, //we are doing this because we are in development
    });

    // Programming or other unknown error: don't leak error details
  } else {
    //for handling errors coming from mongoose for eg
    //1) log error
    console.log('ERROR !!!', err);

    //2) send generic message
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.',
    });
  }
};

module.exports = (err, req, res, next) => {
  //shows where the error has happened or where you have generated the error
  console.log(process.env.NODE_ENV);
  //console.log(err.stack);
  //as there mightsome errors thatre not coming from us
  // console.log('Hit in errorController');
  // console.log(err.isOperational);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error'; //eg for sc400 fail or 500 error

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    console.log('Hit In production');
    //should never modify passed value
    //let error = { ...err };
    let error = err; // difference as compared to jonas
    //spreading is changing the structure of err.

    //console.log(error);
    //this will generate a err mssg from our apperror class
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    //for validation errors
    if (error.name === 'ValidationError') error = handleValidationError(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
