import express from 'express';
import { getAllClasses, getClassById, createClass, updateClass, deleteClass } from '../controllers/classController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all classes - protected
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), getAllClasses);

// GET class by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getClassById);

// POST create class - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createClass);

// PUT update class - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateClass);

// DELETE class - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteClass);

export default router;