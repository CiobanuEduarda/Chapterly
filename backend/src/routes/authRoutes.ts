import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name,
        role: 'USER' // Default role for new users
      }
    });
    res.status(201).json({ 
      message: 'User registered', 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(400).json({ error: 'Email already in use' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign(
    { 
      userId: user.id,
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '1d' }
  );
  
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    } 
  });
});

// Create admin user (protected route, should be used only in development)
router.post('/create-admin', async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name,
        role: 'ADMIN'
      }
    });
    res.status(201).json({ 
      message: 'Admin user created', 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(400).json({ error: 'Email already in use' });
  }
});

export default router; 