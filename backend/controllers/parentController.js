// Mock data for parents
let parents = [
  {
    id: 1,
    name: "John Doe",
    students: ["Sarah Brewer"],
    email: "john@doe.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 2,
    name: "Jane Doe",
    students: ["Cecilia Bradley"],
    email: "jane@doe.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
  },
  // Add more as needed
];

const getAllParents = (req, res) => {
  res.json(parents);
};

const getParentById = (req, res) => {
  const parent = parents.find(p => p.id == req.params.id);
  if (parent) {
    res.json(parent);
  } else {
    res.status(404).json({ message: 'Parent not found' });
  }
};

const createParent = (req, res) => {
  const newParent = { id: parents.length + 1, ...req.body };
  parents.push(newParent);
  res.status(201).json(newParent);
};

const updateParent = (req, res) => {
  const parent = parents.find(p => p.id == req.params.id);
  if (parent) {
    Object.assign(parent, req.body);
    res.json(parent);
  } else {
    res.status(404).json({ message: 'Parent not found' });
  }
};

const deleteParent = (req, res) => {
  const index = parents.findIndex(p => p.id == req.params.id);
  if (index !== -1) {
    parents.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Parent not found' });
  }
};

export {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent
};