import express from 'express';
import { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all subjects - protected
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), getAllSubjects);

// GET subject by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getSubjectById);

// POST create subject - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createSubject);

// PUT update subject - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateSubject);

// DELETE subject - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteSubject);

export default router;