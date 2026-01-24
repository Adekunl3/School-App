const express = require('express');
const router = express.Router();

// Mock data for students
const students = [
  {
    id: 1,
    studentId: "1234567890",
    name: "John Doe",
    email: "john@doe.com",
    photo: "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg",
    phone: "1234567890",
    grade: 5,
    class: "1B",
    address: "123 Main St, Anytown, USA",
  },
  // Add more mock data as needed
];

// GET all students
router.get('/', (req, res) => {
  res.json(students);
});

// GET student by id
router.get('/:id', (req, res) => {
  const student = students.find(s => s.id == req.params.id);
  if (student) {
    res.json(student);
  } else {
    res.status(404).json({ message: 'Student not found' });
  }
});

// POST create student
router.post('/', (req, res) => {
  const newStudent = { id: students.length + 1, ...req.body };
  students.push(newStudent);
  res.status(201).json(newStudent);
});

module.exports = router;