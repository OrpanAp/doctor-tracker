function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  } else if (!err.status && !err.statusCode) {
    console.error(err.message);
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed. Check the submitted fields.",
      ...(process.env.NODE_ENV !== "production" ? { details: err.message } : {}),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "The supplied identifier or value is invalid.",
    });
  }

  const statusCode = Number(err.statusCode || err.status);
  if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "The request could not be processed.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error. Please try again later.",
  });
}

module.exports = errorHandler;
