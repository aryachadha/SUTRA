const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/discussions
// List discussions, optionally filtered by project
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, search } = req.query;

    const where = {};
    if (projectId && projectId !== 'ALL') {
      where.projectId = projectId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const discussions = await prisma.discussion.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, designation: true } },
        department: true,
        project: { select: { id: true, title: true, code: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, designation: true } },
            department: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ error: 'Failed to retrieve discussions.' });
  }
});

// GET /api/discussions/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, designation: true } },
        department: true,
        project: {
          include: {
            owningDepartment: true,
            participatingDepts: { include: { department: true } },
          },
        },
        replies: {
          include: {
            author: { select: { id: true, name: true, designation: true } },
            department: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found.' });
    }

    res.json(discussion);
  } catch (error) {
    console.error('Error fetching discussion details:', error);
    res.status(500).json({ error: 'Failed to retrieve discussion.' });
  }
});

// POST /api/discussions
// Create discussion
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, message, projectId, departmentId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    // Determine department
    let targetDeptId = departmentId || req.user.departmentId;
    if (!targetDeptId) {
      // Default to first department or project owning dept
      if (projectId) {
        const p = await prisma.project.findUnique({ where: { id: projectId } });
        if (p) targetDeptId = p.owningDepartmentId;
      }
      if (!targetDeptId) {
        const firstDept = await prisma.department.findFirst();
        targetDeptId = firstDept ? firstDept.id : null;
      }
    }

    if (!targetDeptId) {
      return res.status(400).json({ error: 'A valid department must be associated with the discussion.' });
    }

    const discussion = await prisma.discussion.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        projectId: projectId || null,
        departmentId: targetDeptId,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, name: true, designation: true } },
        department: true,
        project: { select: { id: true, title: true, code: true } },
      },
    });

    res.status(201).json(discussion);
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ error: 'Failed to create discussion thread.' });
  }
});

// POST /api/discussions/:id/replies
// Add reply to discussion
router.post('/:id/replies', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, departmentId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    let targetDeptId = departmentId || req.user.departmentId;
    if (!targetDeptId) {
      const firstDept = await prisma.department.findFirst();
      targetDeptId = firstDept ? firstDept.id : null;
    }

    if (!targetDeptId) {
      return res.status(400).json({ error: 'Department association required.' });
    }

    const reply = await prisma.discussionReply.create({
      data: {
        discussionId: id,
        message: message.trim(),
        departmentId: targetDeptId,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, name: true, designation: true } },
        department: true,
      },
    });

    // Touch parent discussion updatedAt timestamp
    await prisma.discussion.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error replying to discussion:', error);
    res.status(500).json({ error: 'Failed to post reply.' });
  }
});

module.exports = router;
