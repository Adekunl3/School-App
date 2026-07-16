import express from 'express';
import { getAllParents, getParentById, createParent, updateParent, deleteParent } from '../controllers/parentController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all parents - protected
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), getAllParents);

// GET parent by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getParentById);

// POST create parent - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createParent);

// PUT update parent - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateParent);

// DELETE parent - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteParent);

export default router;