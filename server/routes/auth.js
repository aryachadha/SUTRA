const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET, authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { department: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials. Password mismatch.' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      designation: user.designation,
      departmentId: user.departmentId,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        designation: user.designation,
        departmentId: user.departmentId,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal authentication server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile no longer exists.' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        designation: user.designation,
        departmentId: user.departmentId,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// POST /api/auth/bootstrap-admin
// Safely creates initial administrator if no admin exists yet
router.post('/bootstrap-admin', async (req, res) => {
  try {
    const existingAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (existingAdminCount > 0) {
      return res.status(400).json({
        error: 'Administrator account already established. Please log in with existing credentials.',
      });
    }

    const { email, password, name, designation } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        designation: designation || 'Chief Municipal Coordinator',
        role: 'ADMIN',
      },
    });

    res.status(201).json({
      message: 'Initial administrator account created successfully.',
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Bootstrap admin error:', error);
    res.status(500).json({ error: 'Failed to create initial administrator account.' });
  }
});

// GET /api/auth/users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      designation: u.designation,
      department: u.department,
      createdAt: u.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to list users.' });
  }
});

module.exports = router;
