const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');
const { evaluateProjectConflict } = require('../services/conflictDetector');

const router = express.Router();

// GET /api/conflicts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const conflicts = await prisma.projectConflict.findMany({
      where,
      include: {
        projectA: {
          include: { owningDepartment: true },
        },
        projectB: {
          include: { owningDepartment: true },
        },
        resolvedBy: {
          select: { id: true, name: true, designation: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(conflicts);
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    res.status(500).json({ error: 'Failed to retrieve detected conflicts.' });
  }
});

// POST /api/conflicts/scan
// Triggers an exhaustive scan of all active projects
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const distanceThreshold = req.body.distanceThreshold || 500;
    const windowDays = req.body.windowDays || 14;

    const projects = await prisma.project.findMany({
      where: {
        status: { not: 'COMPLETED' },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: { owningDepartment: true },
    });

    let detectedCount = 0;

    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const p1 = projects[i];
        const p2 = projects[j];

        const conflictData = evaluateProjectConflict(p1, p2, distanceThreshold, windowDays);

        if (conflictData) {
          await prisma.projectConflict.upsert({
            where: {
              projectAId_projectBId: {
                projectAId: conflictData.projectAId,
                projectBId: conflictData.projectBId,
              },
            },
            update: {
              distanceMeters: conflictData.distanceMeters,
              scheduleOverlapDays: conflictData.scheduleOverlapDays,
              suggestedAction: conflictData.suggestedAction,
            },
            create: {
              projectAId: conflictData.projectAId,
              projectBId: conflictData.projectBId,
              distanceMeters: conflictData.distanceMeters,
              scheduleOverlapDays: conflictData.scheduleOverlapDays,
              suggestedAction: conflictData.suggestedAction,
              status: 'DETECTED',
            },
          });
          detectedCount++;
        }
      }
    }

    res.json({
      message: 'Conflict detection scan completed successfully.',
      scannedProjectsCount: projects.length,
      conflictsIdentified: detectedCount,
    });
  } catch (error) {
    console.error('Error running conflict scan:', error);
    res.status(500).json({ error: 'Failed to execute conflict detection scan.' });
  }
});

// PUT /api/conflicts/:id/resolve
router.put('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    if (!['UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Status must be UNDER_REVIEW, RESOLVED, or DISMISSED.',
      });
    }

    const conflict = await prisma.projectConflict.update({
      where: { id },
      data: {
        status,
        resolutionNote: resolutionNote ? resolutionNote.trim() : null,
        resolvedById: req.user.id,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null,
      },
      include: {
        projectA: { include: { owningDepartment: true } },
        projectB: { include: { owningDepartment: true } },
        resolvedBy: { select: { id: true, name: true, designation: true } },
      },
    });

    res.json(conflict);
  } catch (error) {
    console.error('Error updating conflict resolution:', error);
    res.status(500).json({ error: 'Failed to update conflict resolution.' });
  }
});

// POST /api/conflicts/:id/coordination
// Opens a dedicated coordination discussion for the conflicting projects
router.post('/:id/coordination', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const conflict = await prisma.projectConflict.findUnique({
      where: { id },
      include: {
        projectA: { include: { owningDepartment: true } },
        projectB: { include: { owningDepartment: true } },
      },
    });

    if (!conflict) {
      return res.status(404).json({ error: 'Conflict record not found.' });
    }

    const title = `Coordination Notice: ${conflict.projectA.title} & ${conflict.projectB.title}`;
    const message = `Automated coordination thread initiated between ${conflict.projectA.owningDepartment.name} and ${conflict.projectB.owningDepartment.name}.\n\n` +
      `Location: Proximity within ${conflict.distanceMeters}m.\n` +
      `Schedule Overlap: ~${conflict.scheduleOverlapDays} days.\n` +
      `Recommended Action: ${conflict.suggestedAction}\n\n` +
      `Please review timelines, underground ducting, and joint work shifts here.`;

    const discussion = await prisma.discussion.create({
      data: {
        title,
        message,
        projectId: conflict.projectAId,
        departmentId: req.user.departmentId || conflict.projectA.owningDepartmentId,
        authorId: req.user.id,
      },
      include: {
        project: true,
        department: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    // Also update conflict status to UNDER_REVIEW
    await prisma.projectConflict.update({
      where: { id },
      data: {
        status: 'UNDER_REVIEW',
        resolutionNote: `Coordination discussion created by ${req.user.name}.`,
      },
    });

    res.status(201).json({
      message: 'Coordination discussion initiated.',
      discussion,
    });
  } catch (error) {
    console.error('Error initiating coordination workflow:', error);
    res.status(500).json({ error: 'Failed to initiate coordination workflow.' });
  }
});

module.exports = router;
