function ok(res, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    data
  });
}

function fail(res, error = 'Unknown error', status = 400, extra = {}) {
  return res.status(status).json({
    success: false,
    error,
    ...extra
  });
}

module.exports = {
  ok,
  fail
};