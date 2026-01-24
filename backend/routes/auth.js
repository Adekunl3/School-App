const express = require('express');
const { login, refreshToken } = require('../controllers/authController');
const router = express.Router();

// Login
router.post('/login', login);

// Refresh Token
router.post('/refresh', refreshToken);

module.exports = router;