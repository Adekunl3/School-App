// Mock data for announcements
let announcements = [
  {
    id: 1,
    title: "About 4A Math Test",
    class: "4A",
    date: "2025-01-01",
  },
  {
    id: 2,
    title: "About 3A Math Test",
    class: "3A",
    date: "2025-01-01",
  },
  // Add more as needed
];

const getAllAnnouncements = (req, res) => {
  res.json(announcements);
};

const getAnnouncementById = (req, res) => {
  const announcement = announcements.find(a => a.id == req.params.id);
  if (announcement) {
    res.json(announcement);
  } else {
    res.status(404).json({ message: 'Announcement not found' });
  }
};

const createAnnouncement = (req, res) => {
  const newAnnouncement = { id: announcements.length + 1, ...req.body };
  announcements.push(newAnnouncement);
  res.status(201).json(newAnnouncement);
};

const updateAnnouncement = (req, res) => {
  const announcement = announcements.find(a => a.id == req.params.id);
  if (announcement) {
    Object.assign(announcement, req.body);
    res.json(announcement);
  } else {
    res.status(404).json({ message: 'Announcement not found' });
  }
};

const deleteAnnouncement = (req, res) => {
  const index = announcements.findIndex(a => a.id == req.params.id);
  if (index !== -1) {
    announcements.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Announcement not found' });
  }
};

export {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};