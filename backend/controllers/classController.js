// Mock data for classes
let classes = [
  {
    id: 1,
    name: "1A",
    capacity: 20,
    grade: 1,
    supervisor: "Joseph Padilla",
  },
  {
    id: 2,
    name: "2B",
    capacity: 22,
    grade: 2,
    supervisor: "Blake Joseph",
  },
  // Add more as needed
];

const getAllClasses = (req, res) => {
  res.json(classes);
};

const getClassById = (req, res) => {
  const cls = classes.find(c => c.id == req.params.id);
  if (cls) {
    res.json(cls);
  } else {
    res.status(404).json({ message: 'Class not found' });
  }
};

const createClass = (req, res) => {
  const newClass = { id: classes.length + 1, ...req.body };
  classes.push(newClass);
  res.status(201).json(newClass);
};

const updateClass = (req, res) => {
  const cls = classes.find(c => c.id == req.params.id);
  if (cls) {
    Object.assign(cls, req.body);
    res.json(cls);
  } else {
    res.status(404).json({ message: 'Class not found' });
  }
};

const deleteClass = (req, res) => {
  const index = classes.findIndex(c => c.id == req.params.id);
  if (index !== -1) {
    classes.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Class not found' });
  }
};

export {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};