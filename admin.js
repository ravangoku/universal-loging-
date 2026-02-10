const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const User = require('../models/User');
const Session = require('../models/Session');

router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.sendStatus(200);
});

router.get('/stats', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalUsers = await User.countDocuments();
    const activeSessionsData = await Session.find({ isActive: true }).lean();
    const activeUserIds = new Set(activeSessionsData.map(s => s.userId.toString()));
    const activeUsers = activeUserIds.size;

    const sessions = activeSessionsData.map(s => ({
      userId: s.userId,
      email: s.email,
      name: s.name,
      loginTime: s.loginTime,
      duration: Date.now() - new Date(s.loginTime).getTime()
    }));

    res.json({ totalUsers, activeUsers, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
