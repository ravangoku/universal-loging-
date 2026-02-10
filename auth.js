const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const config = require('../config');
const User = require('../models/User');
const Session = require('../models/Session');
const { requireAuth } = require('../middleware/auth');

router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.sendStatus(200);
});

const ADMIN_EMAIL = 'sriram@gmail.com';
const ADMIN_PASSWORD = 'ram557';

async function getOrCreateAdmin() {
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = new User({
      email: ADMIN_EMAIL,
      name: 'Admin User',
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    await admin.save();
  }
  return admin;
}

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase(), authProvider: 'local' });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered for local login' });
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      authProvider: 'local',
      role: 'user'
    });

    await user.save();

    const session = new Session({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      loginTime: new Date(),
      isActive: true
    });

    await session.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, method = 'local' } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user;

    if (method === 'local') {
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      user = await User.findOne({ email: email.toLowerCase(), authProvider: 'local' });
      
      if (!user && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        user = await getOrCreateAdmin();
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } else if (method === 'google') {
      user = await User.findOne({ email: email.toLowerCase(), authProvider: 'google' });
      if (!user) {
        return res.status(401).json({ error: 'Google account not linked. Please sign up first.' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid login method' });
    }

    const session = new Session({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      loginTime: new Date(),
      isActive: true
    });

    await session.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    await Session.updateMany(
      { userId, isActive: true },
      { isActive: false, logoutTime: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body || {};

    if (!email || !name || !googleId) {
      return res.status(400).json({ error: 'Email, name, and googleId are required' });
    }

    let user = await User.findOne({ email: email.toLowerCase(), authProvider: 'google' });

    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        name,
        authProvider: 'google',
        googleId,
        avatar,
        role: 'user'
      });
      await user.save();
    }

    const session = new Session({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      loginTime: new Date(),
      isActive: true
    });

    await session.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
