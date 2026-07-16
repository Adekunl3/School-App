// Mock data for events
let events = [
  {
    id: 1,
    title: "Lake Trip",
    class: "1A",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: 2,
    title: "Picnic",
    class: "2A",
    date: "2025-01-01",
    startTime: "10:00",
    endTime: "11:00",
  },
  // Add more as needed
];

const getAllEvents = (req, res) => {
  res.json(events);
};

const getEventById = (req, res) => {
  const event = events.find(e => e.id == req.params.id);
  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

const createEvent = (req, res) => {
  const newEvent = { id: events.length + 1, ...req.body };
  events.push(newEvent);
  res.status(201).json(newEvent);
};

const updateEvent = (req, res) => {
  const event = events.find(e => e.id == req.params.id);
  if (event) {
    Object.assign(event, req.body);
    res.json(event);
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

const deleteEvent = (req, res) => {
  const index = events.findIndex(e => e.id == req.params.id);
  if (index !== -1) {
    events.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

export {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};