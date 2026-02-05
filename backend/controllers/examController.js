// Mock data for exams
let exams = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "Martha Morris",
    date: "2025-01-01",
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "Randall Garcia",
    date: "2025-01-01",
  },
  // Add more as needed
];

const getAllExams = (req, res) => {
  res.json(exams);
};

const getExamById = (req, res) => {
  const exam = exams.find(e => e.id == req.params.id);
  if (exam) {
    res.json(exam);
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
};

const createExam = (req, res) => {
  const newExam = { id: exams.length + 1, ...req.body };
  exams.push(newExam);
  res.status(201).json(newExam);
};

const updateExam = (req, res) => {
  const exam = exams.find(e => e.id == req.params.id);
  if (exam) {
    Object.assign(exam, req.body);
    res.json(exam);
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
};

const deleteExam = (req, res) => {
  const index = exams.findIndex(e => e.id == req.params.id);
  if (index !== -1) {
    exams.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Exam not found' });
  }
};

export {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam
};