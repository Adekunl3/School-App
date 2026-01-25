import express from 'express';
import { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all teachers - protected
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), getAllTeachers);

// GET teacher by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getTeacherById);

// POST create teacher - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createTeacher);

// PUT update teacher - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateTeacher);

// DELETE teacher - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteTeacher);

export default router;