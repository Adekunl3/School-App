// Mock data for teachers
let teachers = [
  {
    id: 1,
    teacherId: "1234567890",
    name: "John Doe",
    email: "john@doe.com",
    photo: "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Math", "Geometry"],
    classes: ["1B", "2A", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 2,
    teacherId: "1234567890",
    name: "Jane Doe",
    email: "jane@doe.com",
    photo: "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200",
    phone: "1234567890",
    subjects: ["Physics", "Chemistry"],
    classes: ["5A", "4B", "3C"],
    address: "123 Main St, Anytown, USA",
  },
  // Add more as needed
];

const getAllTeachers = (req, res) => {
  res.json(teachers);
};

const getTeacherById = (req, res) => {
  const teacher = teachers.find(t => t.id == req.params.id);
  if (teacher) {
    res.json(teacher);
  } else {
    res.status(404).json({ message: 'Teacher not found' });
  }
};

const createTeacher = (req, res) => {
  const newTeacher = { id: teachers.length + 1, ...req.body };
  teachers.push(newTeacher);
  res.status(201).json(newTeacher);
};

const updateTeacher = (req, res) => {
  const teacher = teachers.find(t => t.id == req.params.id);
  if (teacher) {
    Object.assign(teacher, req.body);
    res.json(teacher);
  } else {
    res.status(404).json({ message: 'Teacher not found' });
  }
};

const deleteTeacher = (req, res) => {
  const index = teachers.findIndex(t => t.id == req.params.id);
  if (index !== -1) {
    teachers.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Teacher not found' });
  }
};

export {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
};