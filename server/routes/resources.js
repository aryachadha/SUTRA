const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/resources
// Browse resources with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, owningDepartmentId, status, search } = req.query;

    const where = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (owningDepartmentId && owningDepartmentId !== 'ALL') {
      where.owningDepartmentId = owningDepartmentId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        owningDepartment: true,
        requests: {
          where: { status: 'APPROVED' },
          select: { id: true, startDate: true, endDate: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to retrieve resources.' });
  }
});

// GET /api/resources/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        owningDepartment: true,
        requests: {
          include: {
            requestingDepartment: true,
            requestedBy: { select: { id: true, name: true, email: true, designation: true } },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource details:', error);
    res.status(500).json({ error: 'Failed to retrieve resource.' });
  }
});

// POST /api/resources
// Add resource (Admin or Department User for their own department)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, owningDepartmentId, location, quantity, status, description } = req.body;

    if (!name || !category || !owningDepartmentId || !location) {
      return res.status(400).json({
        error: 'Missing required fields: name, category, owningDepartmentId, and location are required.',
      });
    }

    // Permission check
    if (req.user.role !== 'ADMIN' && req.user.departmentId !== owningDepartmentId) {
      return res.status(403).json({ error: 'You can only add resources for your own department.' });
    }

    const resource = await prisma.resource.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        owningDepartmentId,
        location: location.trim(),
        quantity: quantity != null ? parseInt(quantity, 10) : 1,
        status: status || 'AVAILABLE',
        description: description ? description.trim() : null,
      },
      include: { owningDepartment: true },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource.' });
  }
});

// PUT /api/resources/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, owningDepartmentId, location, quantity, status, description } = req.body;

    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    if (req.user.role !== 'ADMIN' && req.user.departmentId !== existing.owningDepartmentId) {
      return res.status(403).json({ error: 'Permission denied to edit this resource.' });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category: category.trim() }),
        ...(owningDepartmentId && { owningDepartmentId }),
        ...(location && { location: location.trim() }),
        quantity: quantity != null ? parseInt(quantity, 10) : undefined,
        ...(status && { status }),
        description: description !== undefined ? description : undefined,
      },
      include: { owningDepartment: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource.' });
  }
});

// GET /api/resources/requests/all
// List all resource requests across the system
router.get('/requests/all', authenticateToken, async (req, res) => {
  try {
    const { status, resourceId } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (resourceId) {
      where.resourceId = resourceId;
    }

    const requests = await prisma.resourceRequest.findMany({
      where,
      include: {
        resource: { include: { owningDepartment: true } },
        requestingDepartment: true,
        requestedBy: { select: { id: true, name: true, email: true, designation: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching resource requests:', error);
    res.status(500).json({ error: 'Failed to list resource requests.' });
  }
});

// POST /api/resources/:id/request
// Request a resource for a specified date range
router.post('/:id/request', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, purpose, quantity, requestingDepartmentId } = req.body;

    if (!startDate || !endDate || !purpose) {
      return res.status(400).json({ error: 'Start date, end date, and purpose are required.' });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (sDate >= eDate) {
      return res.status(400).json({ error: 'End date must be after start date.' });
    }

    const targetDeptId = requestingDepartmentId || req.user.departmentId;
    if (!targetDeptId) {
      return res.status(400).json({ error: 'A requesting department must be specified.' });
    }

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const newRequest = await prisma.resourceRequest.create({
      data: {
        resourceId: id,
        requestingDepartmentId: targetDeptId,
        requestedById: req.user.id,
        startDate: sDate,
        endDate: eDate,
        purpose: purpose.trim(),
        quantity: quantity != null ? parseInt(quantity, 10) : 1,
        status: 'PENDING',
      },
      include: {
        resource: true,
        requestingDepartment: true,
        requestedBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error requesting resource:', error);
    res.status(500).json({ error: 'Failed to submit resource request.' });
  }
});

// PUT /api/resources/requests/:requestId/status
// Approve or Reject a resource request with transaction & conflict check
router.put('/requests/:requestId/status', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reviewNote } = req.body;

    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED, REJECTED, or CANCELLED.' });
    }

    // Execute with database transaction to prevent race conditions & double booking
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.resourceRequest.findUnique({
        where: { id: requestId },
        include: { resource: true },
      });

      if (!request) {
        throw new Error('NOT_FOUND: Request not found.');
      }

      // Check authorization: Admin or Owning Department user
      if (req.user.role !== 'ADMIN' && req.user.departmentId !== request.resource.owningDepartmentId) {
        throw new Error('FORBIDDEN: Only administrators or the owning department can approve or reject this request.');
      }

      if (status === 'APPROVED') {
        // Check for conflicting approved bookings
        const conflictingBooking = await tx.resourceRequest.findFirst({
          where: {
            id: { not: requestId },
            resourceId: request.resourceId,
            status: 'APPROVED',
            startDate: { lte: request.endDate },
            endDate: { gte: request.startDate },
          },
          include: { requestingDepartment: true },
        });

        if (conflictingBooking) {
          const err = new Error(
            `BOOKING_CONFLICT: Resource is already booked by ${conflictingBooking.requestingDepartment.name} from ${new Date(conflictingBooking.startDate).toLocaleDateString()} to ${new Date(conflictingBooking.endDate).toLocaleDateString()}.`
          );
          err.code = 'BOOKING_CONFLICT';
          throw err;
        }
      }

      const updatedRequest = await tx.resourceRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewNote: reviewNote ? reviewNote.trim() : null,
          reviewedAt: new Date(),
        },
        include: {
          resource: { include: { owningDepartment: true } },
          requestingDepartment: true,
          requestedBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updatedRequest;
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating request status:', error.message);
    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    }
    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({ error: error.message.replace('FORBIDDEN: ', '') });
    }
    if (error.code === 'BOOKING_CONFLICT' || error.message.startsWith('BOOKING_CONFLICT')) {
      return res.status(409).json({ error: error.message.replace('BOOKING_CONFLICT: ', '') });
    }
    res.status(500).json({ error: 'Failed to update request status.' });
  }
});

module.exports = router;
