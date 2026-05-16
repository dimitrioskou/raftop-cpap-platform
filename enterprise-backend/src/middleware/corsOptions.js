function buildCorsOptions() {
  return {
    origin(origin, callback) {
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'x-tenant-id',
      'x-tenant',
      'x-super-admin-key',
      'x-frontend-dangerous-dev-controls'
    ],
    exposedHeaders: [
      'X-Tenant-Id',
      'X-Tenant-Context-Source',
      'X-Request-Id'
    ],
    optionsSuccessStatus: 204
  };
}

module.exports = {
  buildCorsOptions
};