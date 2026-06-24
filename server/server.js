const http = require('http');
require('dotenv').config();

// Enforce strict startup environment validation
const REQUIRED_ENV = ['JWT_SECRET', 'GROQ_API_KEY', 'GEMINI_API_KEY'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ FATAL STARTUP ERROR: Missing critical environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.error('Please configure them in your .env file before starting the server.');
  process.exit(1);
}

const app = require('./app');
const { initSocket } = require('./sockets');
const { startJobs } = require('./jobs');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start cron jobs
startJobs();

server.listen(PORT, () => {
  console.log(`🚀 FinBuddy server running on port ${PORT}`);
});