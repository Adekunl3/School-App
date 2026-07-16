import express from 'express';
import { getAllExams, getExamById, createExam, updateExam, deleteExam } from '../controllers/examController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all exams - protected
router.get('/', authenticateToken, getAllExams);

// GET exam by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getExamById);

// POST create exam - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createExam);

// PUT update exam - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateExam);

// DELETE exam - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteExam);

export default router;