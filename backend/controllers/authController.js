import jwt from 'jsonwebtoken';

// Mock users for demo
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 2,
    username: 'teacher',
    password: 'teacher123',
    role: 'teacher'
  },
  {
    id: 3,
    username: 'parent',
    password: 'parent123',
    role: 'parent'
  },
  {
    id: 4,
    username: 'student',
    password: 'student123',
    role: 'student'
  }
];

const login = (req, res) => {
  const { username, password } = req.body;
  const user = mockUsers.find(u => u.username === username && u.password === password);
  if (user) {
    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    res.json({ accessToken, refreshToken, role: user.role });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

const refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = mockUsers.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const newAccessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

export {
  login,
  refreshToken
};