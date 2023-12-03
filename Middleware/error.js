const ErrorHandler = require('../utils/errorhandler');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  //Mongodb Error handling
  if (err.name === 'CastError') {
    const message = `Resource not found, Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //duplicate key error
  if (err.code === 11000) {
    const message = `This ${Object.keys(err.keyValue)} is already in use...`;
    err = new ErrorHandler(message, 400);
  }

  //mistake jwt error
  if (err.name === 'JsonWebTokenError') {
    const message = `Json web token is invalid: Try Again `;
    err = new ErrorHandler(message, 400);
  }

  //jwt expire error
  if (err.name === 'TokenExpiredError') {
    const message = `Json web token is Expired: Try Again `;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
