const app = require('../server/server');

module.exports = app;

// Disable Vercel's default body parser so Express can receive raw request streams
// (Essential for Razorpay webhook HMAC-SHA256 signature verification)
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

