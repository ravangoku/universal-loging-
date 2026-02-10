const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  apiKey: process.env.API_KEY,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  retentionDays: parseInt(process.env.RETENTION_DAYS || '30', 10),
  slackWebhook: process.env.SLACK_WEBHOOK_URL || null,
  alertEmail: process.env.ALERT_EMAIL || null
};
