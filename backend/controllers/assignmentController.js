// Mock data for assignments
let assignments = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "Anthony Boone",
    dueDate: "2025-01-01",
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "Clifford Bowen",
    dueDate: "2025-01-01",
  },
  // Add more as needed
];

const getAllAssignments = (req, res) => {
  res.json(assignments);
};

const getAssignmentById = (req, res) => {
  const assignment = assignments.find(a => a.id == req.params.id);
  if (assignment) {
    res.json(assignment);
  } else {
    res.status(404).json({ message: 'Assignment not found' });
  }
};

const createAssignment = (req, res) => {
  const newAssignment = { id: assignments.length + 1, ...req.body };
  assignments.push(newAssignment);
  res.status(201).json(newAssignment);
};

const updateAssignment = (req, res) => {
  const assignment = assignments.find(a => a.id == req.params.id);
  if (assignment) {
    Object.assign(assignment, req.body);
    res.json(assignment);
  } else {
    res.status(404).json({ message: 'Assignment not found' });
  }
};

const deleteAssignment = (req, res) => {
  const index = assignments.findIndex(a => a.id == req.params.id);
  if (index !== -1) {
    assignments.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Assignment not found' });
  }
};

export {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment
};