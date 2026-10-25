const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalDepartments,
      activeProjectsCount,
      allProjects,
      pendingConflicts,
      upcomingDeadlinesCount,
      totalResources,
      pendingResourceRequests,
    ] = await Promise.all([
      prisma.department.count(),
      prisma.project.count({
        where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
      }),
      prisma.project.findMany({
        include: {
          owningDepartment: true,
          participatingDepts: { include: { department: true } },
          conflictsAsProjectA: { where: { status: { in: ['DETECTED', 'UNDER_REVIEW'] } } },
          conflictsAsProjectB: { where: { status: { in: ['DETECTED', 'UNDER_REVIEW'] } } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.projectConflict.findMany({
        where: { status: { in: ['DETECTED', 'UNDER_REVIEW'] } },
        include: {
          projectA: { include: { owningDepartment: true } },
          projectB: { include: { owningDepartment: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({
        where: {
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
          endDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.resource.count(),
      prisma.resourceRequest.count({
        where: { status: 'PENDING' },
      }),
    ]);

    // Count interdepartmental projects (projects with 1 or more participating departments)
    const interdepartmentalProjectsCount = allProjects.filter(
      p => p.participatingDepts && p.participatingDepts.length > 0
    ).length;

    // Status breakdown
    const statusCounts = {
      PROPOSED: 0,
      PLANNED: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
    };
    allProjects.forEach(p => {
      if (statusCounts[p.status] !== undefined) {
        statusCounts[p.status]++;
      }
    });

    // Priority breakdown
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    allProjects.forEach(p => {
      if (priorityCounts[p.priority] !== undefined) {
        priorityCounts[p.priority]++;
      }
    });

    // Projects requiring attention (have active unresolved conflicts or on-hold)
    const projectsRequiringAttention = allProjects
      .filter(p => (p.conflictsAsProjectA.length > 0 || p.conflictsAsProjectB.length > 0 || p.priority === 'CRITICAL'))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        code: p.code,
        department: p.owningDepartment.name,
        status: p.status,
        priority: p.priority,
        conflictsCount: p.conflictsAsProjectA.length + p.conflictsAsProjectB.length,
        location: p.locationName,
        endDate: p.endDate,
      }));

    // Recent projects
    const recentProjects = allProjects.slice(0, 6).map(p => ({
      id: p.id,
      title: p.title,
      code: p.code,
      department: p.owningDepartment.name,
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      location: p.locationName,
      startDate: p.startDate,
      endDate: p.endDate,
    }));

    // Upcoming milestones / deadlines
    const upcomingMilestones = allProjects
      .filter(p => new Date(p.endDate) >= now)
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        code: p.code,
        department: p.owningDepartment.name,
        targetDate: p.endDate,
        progress: p.progress,
        status: p.status,
      }));

    res.json({
      summary: {
        totalDepartments,
        totalProjects: allProjects.length,
        activeProjects: activeProjectsCount,
        interdepartmentalProjects: interdepartmentalProjectsCount,
        pendingConflicts: pendingConflicts.length,
        upcomingDeadlines: upcomingDeadlinesCount,
        totalResources,
        pendingResourceRequests,
      },
      statusDistribution: statusCounts,
      priorityDistribution: priorityCounts,
      recentProjects,
      projectsRequiringAttention,
      upcomingMilestones,
      pendingConflicts: pendingConflicts.slice(0, 5),
      datasetBadge: {
        isDemoDataset: true,
        label: 'Jaipur Smart Urban Corridor — Synthetic Demonstration Dataset',
        city: 'Jaipur, Rajasthan',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
});

module.exports = router;
