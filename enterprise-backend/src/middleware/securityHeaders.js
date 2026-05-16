function applySecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');

  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()'
    ].join(', ')
  );

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'"
    ].join('; ')
  );

  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  if (!req.headers['x-request-id']) {
    req.requestId = `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  } else {
    req.requestId = String(req.headers['x-request-id']);
  }

  res.setHeader('X-Request-Id', req.requestId);

  next();
}

module.exports = {
  applySecurityHeaders
};