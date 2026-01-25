import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import parentRoutes from './routes/parents.js';
import subjectRoutes from './routes/subjects.js';
import classRoutes from './routes/classes.js';
import announcementRoutes from './routes/announcements.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

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
app.use('/api/v1', routes);
app.use('/api/v1/Login', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/parents', parentRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/announcements', announcementRoutes);

// Error handling middleware
app.use(errorHandler);

// TODO: Add routes for teachers, etc.

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});