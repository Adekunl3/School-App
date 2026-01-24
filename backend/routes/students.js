const express = require('express');
const { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const router = express.Router();

// GET all students - protected
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), getAllStudents);

// GET student by id - protected
router.get('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), getStudentById);

// POST create student - admin only
router.post('/', authenticateToken, authorizeRole(['admin']), createStudent);

// PUT update student - admin only
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateStudent);

// DELETE student - admin only
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteStudent);

module.exports = router;