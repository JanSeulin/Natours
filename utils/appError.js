class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); // when a new object is created and the constructor function is called then that function call wil not appear in the stack trace and pollute it
  }
}

module.exports = AppError;
