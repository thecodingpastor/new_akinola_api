const { TokenExpiredError } = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// This may not be needed if I replace the _id field with my own unique field
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  let tempValue;

  if (Object.keys(err.keyValue)[0] == 'email') {
    return new AppError(`Email already exists.`, 400);
  }

  const value = err.keyValue[tempValue];
  // const value = err.keyValue.name;
  const message = `${value} already exists, use another value`;
  return new AppError(message, 400);
};

const handleLoginValidationErrorDB = (err) => new AppError(err.message, 400);

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Please login in again before you can have access.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token Expired, please login again', 401);

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Expected errors
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming errors, Unexpected errors, from server, network, etc don't leak details to client
      // 1.) Log the error to the console
      console.log('**************************************************');
      console.error(err);

      // 2.) Send generic message to client
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong, please try again later',
      });
    }
  } else {
    // Expected errors
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Error',
        msg: err.message,
      });
    } else {
      // Programming errors, Unexpected errors, from server, network, etc don't leak details to client
      // 1.) Log the error to the console
      console.log('**************************************************');
      console.error(err);

      // 2.) Send generic message to client
      return res.status(500).render('error', {
        title: 'Error',
        msg: 'Something went wrong, please try again later',
      });
    }
  }
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      stack: err.stack,
      error: err,
      test: err.name,
      message: err.message,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Error!',
      msg: err.message,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.log('==========================================');
    console.log(err);
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // This extraction of error is not working well, not extracting every property and value of err into error
    let error = { ...err };

    // // Handle cast errors , Bad IDs
    if (err.name === 'CastError') error = handleCastErrorDB(error);

    // // Handle Duplicate Keys
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    // // Handle Input Validation
    // err.name changes ==== sometimes, its "ValidationError" for sign up and other times "Error" for login

    if (err.name === 'ValidationError') {
      // For Sign Up
      error = handleValidationErrorDB(error);
    }

    if (err.name === 'Error') {
      // For Login
      error = handleLoginValidationErrorDB(err);
    }

    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};
