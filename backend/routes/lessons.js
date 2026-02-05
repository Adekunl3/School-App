import express from 'express';
import { getAllLessons, getLessonById, createLesson, updateLesson, deleteLesson } from '../controllers/lessonController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all lessons - protected
router.get('/', authenticateToken, getAllLessons);

// GET lesson by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getLessonById);

// POST create lesson - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createLesson);

// PUT update lesson - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateLesson);

// DELETE lesson - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteLesson);

export default router;