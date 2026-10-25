const test = require('node:test');
const assert = require('node:assert');
const {
  calculateDistanceMeters,
  calculateScheduleOverlap,
  evaluateProjectConflict,
  generateSuggestedAction,
} = require('../server/services/conflictDetector');

test('Haversine distance calculation', async (t) => {
  await t.test('calculates correct distance between nearby Jaipur locations (~130m)', () => {
    // MI Road PWD coords (26.9174, 75.8080) and PHED coords (26.9180, 75.8092)
    const dist = calculateDistanceMeters(26.9174, 75.8080, 26.9180, 75.8092);
    assert.ok(dist >= 100 && dist <= 180, `Expected distance ~130m, got ${dist}`);
  });

  await t.test('calculates larger distance between Mansarovar and Old City (~9km)', () => {
    const dist = calculateDistanceMeters(26.8525, 75.7682, 26.9205, 75.8272);
    assert.ok(dist >= 9000 && dist <= 11000, `Expected distance ~9.5km, got ${dist}`);
  });

  await t.test('returns Infinity for missing coordinates', () => {
    assert.strictEqual(calculateDistanceMeters(null, 75.8, 26.9, 75.8), Infinity);
    assert.strictEqual(calculateDistanceMeters(26.9, null, 26.9, 75.8), Infinity);
  });
});

test('Schedule overlap calculation', async (t) => {
  await t.test('calculates overlapping days correctly', () => {
    const startA = new Date('2026-11-01');
    const endA = new Date('2027-02-28');
    const startB = new Date('2026-11-15');
    const endB = new Date('2027-01-30');

    const overlap = calculateScheduleOverlap(startA, endA, startB, endB);
    assert.ok(overlap >= 75 && overlap <= 80, `Expected ~76 days overlap, got ${overlap}`);
  });

  await t.test('returns 0 for disjoint non-overlapping dates', () => {
    const startA = new Date('2026-01-01');
    const endA = new Date('2026-03-31');
    const startB = new Date('2026-06-01');
    const endB = new Date('2026-08-31');

    const overlap = calculateScheduleOverlap(startA, endA, startB, endB);
    assert.strictEqual(overlap, 0);
  });
});

test('Project conflict evaluation', async (t) => {
  const p1 = {
    id: 'proj-1',
    title: 'MI Road Resurfacing',
    latitude: 26.9174,
    longitude: 75.8080,
    startDate: new Date('2026-11-01'),
    endDate: new Date('2027-02-28'),
    status: 'PLANNED',
    owningDepartment: { name: 'Public Works Department', category: 'Roads & Bridges' },
  };

  const p2 = {
    id: 'proj-2',
    title: 'Water Pipe Replacement',
    latitude: 26.9180,
    longitude: 75.8092,
    startDate: new Date('2026-11-15'),
    endDate: new Date('2027-01-30'),
    status: 'PLANNED',
    owningDepartment: { name: 'Public Health Engineering Dept', category: 'Water Supply' },
  };

  const pFar = {
    id: 'proj-3',
    title: 'Mansarovar Park',
    latitude: 26.8525,
    longitude: 75.7682,
    startDate: new Date('2026-11-15'),
    endDate: new Date('2027-01-30'),
    status: 'PLANNED',
    owningDepartment: { name: 'JMC', category: 'Parks' },
  };

  await t.test('detects conflict for proximate projects with overlapping schedules', () => {
    const result = evaluateProjectConflict(p1, p2, 500, 14);
    assert.ok(result !== null);
    assert.ok(result.distanceMeters < 500);
    assert.ok(result.scheduleOverlapDays > 0);
    assert.ok(result.suggestedAction.toLowerCase().includes('water'));
  });

  await t.test('does not detect conflict for distant projects (>500m)', () => {
    const result = evaluateProjectConflict(p1, pFar, 500, 14);
    assert.strictEqual(result, null);
  });
});
