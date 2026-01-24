const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Mock user for demo
const mockUser = {
  id: 1,
  username: 'admin',
  password: 'password', // In real app, hash passwords
  role: 'admin'
};

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === mockUser.username && password === mockUser.password) {
    const accessToken = jwt.sign({ id: mockUser.id, role: mockUser.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: mockUser.id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    res.json({ accessToken, refreshToken });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Refresh Token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id, role: mockUser.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;