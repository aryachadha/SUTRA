const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../server/middleware/auth');

test('Authentication and Security primitives', async (t) => {
  await t.test('hashes passwords and validates correctly', async () => {
    const raw = 'Admin@Sutra2026';
    const hash = await bcrypt.hash(raw, 10);
    assert.notStrictEqual(raw, hash);

    const isMatch = await bcrypt.compare(raw, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrong, false);
  });

  await t.test('signs and verifies JWT tokens with proper claims', () => {
    const payload = {
      id: 'test-admin-id',
      email: 'admin@jaipur.sutra.gov.in',
      role: 'ADMIN',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.role, 'ADMIN');
  });
});
