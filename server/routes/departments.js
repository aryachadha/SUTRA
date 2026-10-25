const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/departments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category } = req.query;

    const where = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: {
          select: {
            ownedProjects: true,
            resources: true,
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to retrieve departments.' });
  }
});

// GET /api/departments/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        ownedProjects: {
          orderBy: { startDate: 'asc' },
        },
        participations: {
          include: {
            project: true,
          },
        },
        resources: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            role: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    res.json(department);
  } catch (error) {
    console.error('Error fetching department details:', error);
    res.status(500).json({ error: 'Failed to retrieve department details.' });
  }
});

// POST /api/departments (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, category, city, contactPerson, email, phone, description } = req.body;

    if (!name || !code || !category || !contactPerson || !email) {
      return res.status(400).json({
        error: 'Missing required fields: name, code, category, contactPerson, email are required.',
      });
    }

    const existingCode = await prisma.department.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
    if (existingCode) {
      return res.status(400).json({ error: 'Department code already registered.' });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        category: category.trim(),
        city: city || 'Jaipur',
        contactPerson: contactPerson.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        description: description ? description.trim() : null,
      },
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department.' });
  }
});

// PUT /api/departments/:id (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, city, contactPerson, email, phone, description } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.toUpperCase().trim() }),
        ...(category && { category: category.trim() }),
        ...(city && { city: city.trim() }),
        ...(contactPerson && { contactPerson: contactPerson.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        phone: phone !== undefined ? phone : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department.' });
  }
});

// DELETE /api/departments/:id (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department successfully deleted.' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department. Verify relations first.' });
  }
});

module.exports = router;
