function errorHandler(err, req, res, next) {
  console.error('[errorHandler]', err);

  if (res.headersSent) {
    return next(err);
  }

  const status =
    Number(err?.status) ||
    Number(err?.statusCode) ||
    500;

  return res.status(status).json({
    message: err?.message || 'Internal server error'
  });
}

module.exports = {
  errorHandler
};