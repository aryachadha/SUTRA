const test = require('node:test');
const assert = require('node:assert');

function hasBookingConflict(existingBooking, requestedBooking) {
  const eStart = new Date(existingBooking.startDate).getTime();
  const eEnd = new Date(existingBooking.endDate).getTime();
  const rStart = new Date(requestedBooking.startDate).getTime();
  const rEnd = new Date(requestedBooking.endDate).getTime();

  return rStart <= eEnd && rEnd >= eStart;
}

test('Resource booking conflict validation', async (t) => {
  const activeBooking = {
    startDate: '2026-11-10',
    endDate: '2026-11-20',
  };

  await t.test('detects conflict when dates fully overlap', () => {
    const overlapping = { startDate: '2026-11-12', endDate: '2026-11-18' };
    assert.strictEqual(hasBookingConflict(activeBooking, overlapping), true);
  });

  await t.test('detects conflict when requested booking spans across active booking', () => {
    const spanning = { startDate: '2026-11-05', endDate: '2026-11-25' };
    assert.strictEqual(hasBookingConflict(activeBooking, spanning), true);
  });

  await t.test('allows booking before active reservation', () => {
    const before = { startDate: '2026-11-01', endDate: '2026-11-08' };
    assert.strictEqual(hasBookingConflict(activeBooking, before), false);
  });

  await t.test('allows booking after active reservation', () => {
    const after = { startDate: '2026-11-22', endDate: '2026-11-30' };
    assert.strictEqual(hasBookingConflict(activeBooking, after), false);
  });
});
