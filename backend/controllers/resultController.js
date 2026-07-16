// Mock data for results
let results = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "John Doe",
    student: "John Doe",
    date: "2025-01-01",
    type: "exam",
    score: 90,
  },
  // Add more as needed
];

const getAllResults = (req, res) => {
  res.json(results);
};

const getResultById = (req, res) => {
  const result = results.find(r => r.id == req.params.id);
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ message: 'Result not found' });
  }
};

const createResult = (req, res) => {
  const newResult = { id: results.length + 1, ...req.body };
  results.push(newResult);
  res.status(201).json(newResult);
};

const updateResult = (req, res) => {
  const result = results.find(r => r.id == req.params.id);
  if (result) {
    Object.assign(result, req.body);
    res.json(result);
  } else {
    res.status(404).json({ message: 'Result not found' });
  }
};

const deleteResult = (req, res) => {
  const index = results.findIndex(r => r.id == req.params.id);
  if (index !== -1) {
    results.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Result not found' });
  }
};

export {
  getAllResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult
};