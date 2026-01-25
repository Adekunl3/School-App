import express from 'express';
import { getAllResults, getResultById, createResult, updateResult, deleteResult } from '../controllers/resultController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all results - protected
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), getAllResults);

// GET result by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getResultById);

// POST create result - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createResult);

// PUT update result - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateResult);

// DELETE result - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteResult);

export default router;