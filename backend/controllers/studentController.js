// Mock data for students
let students = [
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

const getAllStudents = (req, res) => {
  res.json(students);
};

const getStudentById = (req, res) => {
  const student = students.find(s => s.id == req.params.id);
  if (student) {
    res.json(student);
  } else {
    res.status(404).json({ message: 'Student not found' });
  }
};

const createStudent = (req, res) => {
  const newStudent = { id: students.length + 1, ...req.body };
  students.push(newStudent);
  res.status(201).json(newStudent);
};

const updateStudent = (req, res) => {
  const student = students.find(s => s.id == req.params.id);
  if (student) {
    Object.assign(student, req.body);
    res.json(student);
  } else {
    res.status(404).json({ message: 'Student not found' });
  }
};

const deleteStudent = (req, res) => {
  const index = students.findIndex(s => s.id == req.params.id);
  if (index !== -1) {
    students.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Student not found' });
  }
};

export {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};