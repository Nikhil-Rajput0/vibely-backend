import AppError from "../utils/appError.js";

const handleValidatorErrorDB = (error) => {
  const value = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid date: ${value.join(". ")}`;
  return new AppError(message, 400);
};

const developmentError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const productionError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log("Error 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    developmentError(err, res);
  }
  if (process.env.NODE_ENV === "production") {
    let error = Object.create(err);
    Object.assign(error, err);

    if (error.name === "ValidationError") error = handleValidatorErrorDB(error);
    productionError(error, res);
  }
};

export default globalErrorHandler;
