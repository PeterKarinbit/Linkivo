// DEPRECATED: Unified CORS config is now in src/app.js
// This file is no longer used. Please update CORS settings in app.js only.
module.exports = (req, res, next) => {
  throw new Error('Do not use src/middleware/cors.js. Use app.js CORS config instead.');
};
