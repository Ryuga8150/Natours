// class AppError extends Error {
//   constructor(message, statusCode) {
//     super(message);
//     this.statusCode = statusCode;
//     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

//     //These errors are operational errors
//     this.isOperational = true;
//     //for eg:- bugs due to packages will not have this property

//     //will not pollute our stackTrace
//     Error.captureStackTrace(this, this.constructor);

//     //this.message not added because we are using super which will sethat property
//   }
// }
// module.exports = AppError;
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    console.log(this.isOperational);
  }
}

module.exports = AppError;
