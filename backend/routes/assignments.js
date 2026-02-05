import express from 'express';
import { getAllAssignments, getAssignmentById, createAssignment, updateAssignment, deleteAssignment } from '../controllers/assignmentController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all assignments - protected
router.get('/', authenticateToken, getAllAssignments);

// GET assignment by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getAssignmentById);

// POST create assignment - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createAssignment);

// PUT update assignment - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateAssignment);

// DELETE assignment - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteAssignment);

export default router;