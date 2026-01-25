// Mock data for subjects
let subjects = [
  {
    id: 1,
    name: "Math",
    teachers: ["Alice Phelps", "Russell Davidson"],
  },
  {
    id: 2,
    name: "English",
    teachers: ["Manuel Becker", "Eddie Chavez"],
  },
  // Add more as needed
];

const getAllSubjects = (req, res) => {
  res.json(subjects);
};

const getSubjectById = (req, res) => {
  const subject = subjects.find(s => s.id == req.params.id);
  if (subject) {
    res.json(subject);
  } else {
    res.status(404).json({ message: 'Subject not found' });
  }
};

const createSubject = (req, res) => {
  const newSubject = { id: subjects.length + 1, ...req.body };
  subjects.push(newSubject);
  res.status(201).json(newSubject);
};

const updateSubject = (req, res) => {
  const subject = subjects.find(s => s.id == req.params.id);
  if (subject) {
    Object.assign(subject, req.body);
    res.json(subject);
  } else {
    res.status(404).json({ message: 'Subject not found' });
  }
};

const deleteSubject = (req, res) => {
  const index = subjects.findIndex(s => s.id == req.params.id);
  if (index !== -1) {
    subjects.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Subject not found' });
  }
};

export {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};