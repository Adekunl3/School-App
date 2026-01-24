const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to School App Backend!' });
});

// Routes
const routes = require('./routes/index');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
app.use('/api/v1', routes);
app.use('/api/v1/Login', authRoutes);
app.use('/api/v1/students', studentRoutes);

// Error handling middleware
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// TODO: Add routes for teachers, etc.

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});