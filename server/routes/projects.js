const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');
const { evaluateProjectConflict } = require('../services/conflictDetector');

const router = express.Router();

/**
 * Helper to recalculate conflicts for a given project against all other projects
 */
async function syncProjectConflicts(project) {
  try {
    if (!project || project.latitude == null || project.longitude == null) {
      return;
    }

    const otherProjects = await prisma.project.findMany({
      where: {
        id: { not: project.id },
        status: { not: 'COMPLETED' },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        owningDepartment: true,
      },
    });

    const populatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: { owningDepartment: true },
    });

    for (const other of otherProjects) {
      const conflictData = evaluateProjectConflict(populatedProject, other);

      if (conflictData) {
        // Upsert conflict record
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
            // If already resolved, keep status unless dates shifted
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
      } else {
        // If conflict resolved due to moved coordinates or dates, remove unresolved conflict
        const [aId, bId] = populatedProject.id < other.id ? [populatedProject.id, other.id] : [other.id, populatedProject.id];
        await prisma.projectConflict.deleteMany({
          where: {
            projectAId: aId,
            projectBId: bId,
            status: 'DETECTED',
          },
        });
      }
    }
  } catch (err) {
    console.error('Error synchronizing project conflicts:', err);
  }
}

// GET /api/projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, owningDepartmentId, search } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (owningDepartmentId && owningDepartmentId !== 'ALL') {
      where.owningDepartmentId = owningDepartmentId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { locationName: { contains: search, mode: 'insensitive' } },
        { responsibleOfficer: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owningDepartment: true,
        participatingDepts: {
          include: { department: true },
        },
        conflictsAsProjectA: {
          where: { status: { in: ['DETECTED', 'UNDER_REVIEW'] } },
        },
        conflictsAsProjectB: {
          where: { status: { in: ['DETECTED', 'UNDER_REVIEW'] } },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    const formatted = projects.map(p => {
      const pendingConflictsCount = p.conflictsAsProjectA.length + p.conflictsAsProjectB.length;
      return {
        ...p,
        hasConflicts: pendingConflictsCount > 0,
        pendingConflictsCount,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owningDepartment: true,
        participatingDepts: {
          include: { department: true },
        },
        conflictsAsProjectA: {
          include: {
            projectB: {
              include: { owningDepartment: true },
            },
            resolvedBy: { select: { id: true, name: true, email: true } },
          },
        },
        conflictsAsProjectB: {
          include: {
            projectA: {
              include: { owningDepartment: true },
            },
            resolvedBy: { select: { id: true, name: true, email: true } },
          },
        },
        discussions: {
          include: {
            author: { select: { id: true, name: true, email: true } },
            department: true,
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Merge conflicts for easy rendering
    const allConflicts = [
      ...project.conflictsAsProjectA.map(c => ({
        id: c.id,
        otherProject: c.projectB,
        distanceMeters: c.distanceMeters,
        scheduleOverlapDays: c.scheduleOverlapDays,
        suggestedAction: c.suggestedAction,
        status: c.status,
        resolutionNote: c.resolutionNote,
        resolvedBy: c.resolvedBy,
        resolvedAt: c.resolvedAt,
        createdAt: c.createdAt,
      })),
      ...project.conflictsAsProjectB.map(c => ({
        id: c.id,
        otherProject: c.projectA,
        distanceMeters: c.distanceMeters,
        scheduleOverlapDays: c.scheduleOverlapDays,
        suggestedAction: c.suggestedAction,
        status: c.status,
        resolutionNote: c.resolutionNote,
        resolvedBy: c.resolvedBy,
        resolvedAt: c.resolvedAt,
        createdAt: c.createdAt,
      })),
    ];

    res.json({
      ...project,
      conflicts: allConflicts,
    });
  } catch (error) {
    console.error('Error fetching project detail:', error);
    res.status(500).json({ error: 'Failed to retrieve project details.' });
  }
});

// POST /api/projects
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      owningDepartmentId,
      locationName,
      latitude,
      longitude,
      startDate,
      endDate,
      responsibleOfficer,
      priority,
      status,
      budget,
      progress,
      participatingDepartmentIds,
    } = req.body;

    if (!title || !code || !owningDepartmentId || !locationName || !startDate || !endDate || !responsibleOfficer) {
      return res.status(400).json({
        error: 'Missing required fields: title, code, owningDepartmentId, locationName, startDate, endDate, responsibleOfficer are required.',
      });
    }

    const existingCode = await prisma.project.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
    if (existingCode) {
      return res.status(400).json({ error: 'Project code already exists.' });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        code: code.toUpperCase().trim(),
        description: description ? description.trim() : null,
        owningDepartmentId,
        locationName: locationName.trim(),
        latitude: latitude != null ? parseFloat(latitude) : null,
        longitude: longitude != null ? parseFloat(longitude) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        responsibleOfficer: responsibleOfficer.trim(),
        priority: priority || 'MEDIUM',
        status: status || 'PROPOSED',
        budget: budget != null ? parseFloat(budget) : null,
        progress: progress != null ? parseInt(progress, 10) : 0,
        participatingDepts: {
          create: (participatingDepartmentIds || []).map(deptId => ({
            departmentId: deptId,
            role: 'Coordinating Agency',
          })),
        },
      },
      include: {
        owningDepartment: true,
        participatingDepts: { include: { department: true } },
      },
    });

    // Run conflict detection asynchronously
    syncProjectConflicts(project);

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      code,
      description,
      owningDepartmentId,
      locationName,
      latitude,
      longitude,
      startDate,
      endDate,
      responsibleOfficer,
      priority,
      status,
      budget,
      progress,
      participatingDepartmentIds,
    } = req.body;

    // Check permissions: Admin or user of owning department
    if (req.user.role !== 'ADMIN') {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing || existing.owningDepartmentId !== req.user.departmentId) {
        return res.status(403).json({ error: 'Permission denied. Only Admins or the owning department may edit this project.' });
      }
    }

    // Update participants if array provided
    if (Array.isArray(participatingDepartmentIds)) {
      await prisma.projectDepartment.deleteMany({ where: { projectId: id } });
      if (participatingDepartmentIds.length > 0) {
        await prisma.projectDepartment.createMany({
          data: participatingDepartmentIds.map(deptId => ({
            projectId: id,
            departmentId: deptId,
            role: 'Coordinating Agency',
          })),
        });
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(code && { code: code.toUpperCase().trim() }),
        description: description !== undefined ? description : undefined,
        ...(owningDepartmentId && { owningDepartmentId }),
        ...(locationName && { locationName: locationName.trim() }),
        latitude: latitude != null ? parseFloat(latitude) : undefined,
        longitude: longitude != null ? parseFloat(longitude) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ...(responsibleOfficer && { responsibleOfficer: responsibleOfficer.trim() }),
        ...(priority && { priority }),
        ...(status && { status }),
        budget: budget != null ? parseFloat(budget) : undefined,
        progress: progress != null ? parseInt(progress, 10) : undefined,
      },
      include: {
        owningDepartment: true,
        participatingDepts: { include: { department: true } },
      },
    });

    // Re-check conflicts
    syncProjectConflicts(updated);

    res.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'ADMIN') {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing || existing.owningDepartmentId !== req.user.departmentId) {
        return res.status(403).json({ error: 'Permission denied. You can only delete your own department projects.' });
      }
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project successfully deleted.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
