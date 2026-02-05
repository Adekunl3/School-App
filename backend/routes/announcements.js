import express from 'express';
import { getAllAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

// GET all announcements - protected
router.get('/', authenticateToken, getAllAnnouncements);

// GET announcement by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getAnnouncementById);

// POST create announcement - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createAnnouncement);

// PUT update announcement - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateAnnouncement);

// DELETE announcement - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteAnnouncement);

export default router;