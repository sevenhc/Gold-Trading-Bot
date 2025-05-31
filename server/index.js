import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory storage (replace with a proper database in production)
const users = [];
const appointments = [];

const packages = [
  { id: 1, name: 'Thai 1hr', price: 8000 },
  { id: 2, name: 'Oil 1hr', price: 9000 },
  { id: 3, name: 'Thai 1.5hrs', price: 10000 },
  { id: 4, name: 'Oil 1.5hrs', price: 11000 }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      id: users.length + 1,
      username: req.body.username,
      password: hashedPassword
    };
    users.push(user);
    res.status(201).json({ message: 'User created successfully' });
  } catch {
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.post('/api/login', async (req, res) => {
  const user = users.find(u => u.username === req.body.username);
  if (!user) return res.status(400).json({ message: 'User not found' });

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, 'your-secret-key');
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch {
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.get('/api/packages', authenticateToken, (req, res) => {
  res.json(packages);
});

app.post('/api/appointments', authenticateToken, (req, res) => {
  const appointment = {
    id: appointments.length + 1,
    ...req.body,
    userId: req.user.id,
    date: new Date()
  };
  appointments.push(appointment);
  res.status(201).json(appointment);
});

app.get('/api/appointments', authenticateToken, (req, res) => {
  const userAppointments = appointments.filter(a => a.userId === req.user.id);
  res.json(userAppointments);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});