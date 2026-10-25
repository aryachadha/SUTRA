/**
 * SUTRA — Project Conflict Detection Service
 * Evaluates spatial proximity using the Haversine formula and temporal schedule overlap.
 */

// Earth radius in meters
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates great-circle distance between two geographic coordinates in meters.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in meters
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return Infinity;
  }

  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calculates schedule overlap between two date ranges in days.
 * Returns 0 if no overlap exists.
 */
function calculateScheduleOverlap(startA, endA, startB, endB, bufferDays = 0) {
  const sA = new Date(startA).getTime() - bufferDays * 86400000;
  const eA = new Date(endA).getTime() + bufferDays * 86400000;
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  if (sA > eB || eA < sB) {
    return 0; // No overlap
  }

  const overlapStart = Math.max(new Date(startA).getTime(), sB);
  const overlapEnd = Math.min(new Date(endA).getTime(), eB);
  const overlapMs = Math.max(0, overlapEnd - overlapStart);

  return Math.max(1, Math.ceil(overlapMs / (1000 * 60 * 60 * 24)));
}

/**
 * Generates context-aware suggested coordination action based on department categories and project titles.
 */
function generateSuggestedAction(deptA, deptB, distanceMeters, overlapDays) {
  const cats = [deptA?.category || '', deptB?.category || ''].map(c => c.toLowerCase());
  const names = [deptA?.name || '', deptB?.name || ''].map(n => n.toLowerCase());

  const hasRoad = cats.some(c => c.includes('road') || c.includes('transport') || c.includes('pwd')) ||
                  names.some(n => n.includes('pwd') || n.includes('road'));
  const hasWater = cats.some(c => c.includes('water') || c.includes('phed') || c.includes('sanitation')) ||
                   names.some(n => n.includes('phed') || n.includes('water'));
  const hasPower = cats.some(c => c.includes('power') || c.includes('electric') || c.includes('energy')) ||
                   names.some(n => n.includes('jvvnl') || n.includes('power'));
  const hasGas = cats.some(c => c.includes('gas') || c.includes('fuel')) ||
                 names.some(n => n.includes('gas') || n.includes('rsgl'));

  if (hasRoad && hasWater) {
    return `Sequence deep trench water pipeline installation prior to sub-base and bitumen road resurfacing. Coordinate joint trenching to avoid cutting newly laid pavement (${distanceMeters}m proximity, ${overlapDays} days schedule overlap).`;
  }
  if (hasRoad && hasPower) {
    return `Establish common underground utility ducting for HT/LT power cables before road subgrade compaction. Align work shifts to prevent traffic congestion.`;
  }
  if (hasRoad && hasGas) {
    return `Verify minimum safety depth (1.2m) for MDPE gas piping before road milling/compaction works. Conduct joint site marking before heavy machinery deployment.`;
  }
  if (hasWater && hasGas) {
    return `Maintain minimum 300mm vertical and 500mm horizontal separation between gas distribution and water supply pipelines as per safety codes.`;
  }
  if (hasWater && hasPower) {
    return `Coordinate trench separation between water mains and underground electrical conduits to prevent water-ingress electrical hazards.`;
  }

  return `Conduct joint pre-construction coordination meeting between ${deptA?.name || 'Department A'} and ${deptB?.name || 'Department B'}. Synchronize site access schedules and align corridor usage within ${distanceMeters}m buffer.`;
}

/**
 * Checks if two projects meet conflict criteria.
 * @param {Object} p1 Project 1
 * @param {Object} p2 Project 2
 * @param {number} maxDistanceMeters (default 500m)
 * @param {number} bufferDays (default 14 days)
 */
function evaluateProjectConflict(p1, p2, maxDistanceMeters = 500, bufferDays = 14) {
  if (p1.id === p2.id) return null;
  // Completed or On Hold projects don't actively collide in execution
  if (p1.status === 'COMPLETED' || p2.status === 'COMPLETED') return null;

  if (p1.latitude == null || p1.longitude == null || p2.latitude == null || p2.longitude == null) {
    return null;
  }

  const distanceMeters = calculateDistanceMeters(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  if (distanceMeters > maxDistanceMeters) {
    return null;
  }

  const overlapDays = calculateScheduleOverlap(p1.startDate, p1.endDate, p2.startDate, p2.endDate, bufferDays);
  if (overlapDays <= 0) {
    return null;
  }

  // Canonical ordering so (A, B) is consistently stored
  const [first, second] = p1.id < p2.id ? [p1, p2] : [p2, p1];

  const suggestedAction = generateSuggestedAction(first.owningDepartment, second.owningDepartment, distanceMeters, overlapDays);

  return {
    projectAId: first.id,
    projectBId: second.id,
    distanceMeters,
    scheduleOverlapDays: overlapDays,
    suggestedAction,
  };
}

module.exports = {
  EARTH_RADIUS_METERS,
  calculateDistanceMeters,
  calculateScheduleOverlap,
  generateSuggestedAction,
  evaluateProjectConflict,
};
