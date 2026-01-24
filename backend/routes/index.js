const express = require('express');
const router = express.Router();

// Example route
router.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;