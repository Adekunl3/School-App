import express from 'express';
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all events - protected
router.get('/', authenticateToken, getAllEvents);

// GET event by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getEventById);

// POST create event - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createEvent);

// PUT update event - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateEvent);

// DELETE event - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteEvent);

export default router;