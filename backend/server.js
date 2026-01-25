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
import assignmentRoutes from './routes/assignments.js';
import eventRoutes from './routes/events.js';
import examRoutes from './routes/exams.js';
import lessonRoutes from './routes/lessons.js';
import resultRoutes from './routes/results.js';
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
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/lessons', lessonRoutes);
app.use('/api/v1/results', resultRoutes);

// Error handling middleware
app.use(errorHandler);

// TODO: Add routes for teachers, etc.

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});