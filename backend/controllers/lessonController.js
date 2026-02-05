// Mock data for lessons
let lessons = [
  {
    id: 1,
    subject: "Math",
    class: "1A",
    teacher: "Tommy Wise",
  },
  {
    id: 2,
    subject: "English",
    class: "2A",
    teacher: "Rhoda Frank",
  },
  // Add more as needed
];

const getAllLessons = (req, res) => {
  res.json(lessons);
};

const getLessonById = (req, res) => {
  const lesson = lessons.find(l => l.id == req.params.id);
  if (lesson) {
    res.json(lesson);
  } else {
    res.status(404).json({ message: 'Lesson not found' });
  }
};

const createLesson = (req, res) => {
  const newLesson = { id: lessons.length + 1, ...req.body };
  lessons.push(newLesson);
  res.status(201).json(newLesson);
};

const updateLesson = (req, res) => {
  const lesson = lessons.find(l => l.id == req.params.id);
  if (lesson) {
    Object.assign(lesson, req.body);
    res.json(lesson);
  } else {
    res.status(404).json({ message: 'Lesson not found' });
  }
};

const deleteLesson = (req, res) => {
  const index = lessons.findIndex(l => l.id == req.params.id);
  if (index !== -1) {
    lessons.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Lesson not found' });
  }
};

export {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson
};