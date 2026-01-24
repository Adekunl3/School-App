const express = require('express');
const router = express.Router();

// Example route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy', timestamp: new Date().toISOString() });
});

module.exports = router;