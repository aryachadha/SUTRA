const test = require('node:test');
const assert = require('node:assert');
const { app } = require('../server/app');

// Helper to simulate lightweight HTTP request directly against Express app
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const parsedUrl = new URL(path, `http://127.0.0.1:${port}`);

      const reqOptions = {
        hostname: '127.0.0.1',
        port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      };

      const req = http.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          server.close(() => {
            let parsed = null;
            try {
              parsed = JSON.parse(body);
            } catch (e) {
              parsed = body;
            }
            resolve({ status: res.statusCode, data: parsed });
          });
        });
      });

      req.on('error', (err) => {
        server.close(() => reject(err));
      });

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  });
}

test('SUTRA REST API Integration Tests', async (t) => {
  let authToken = null;

  await t.test('GET /api/health returns status ok', async () => {
    const res = await makeRequest('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
    assert.strictEqual(res.data.service, 'SUTRA Municipal Coordination API');
  });

  await t.test('POST /api/auth/login authenticates admin user', async () => {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@jaipur.sutra.gov.in',
        password: 'Admin@Sutra2026',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token, 'Token must be present in response');
    assert.strictEqual(res.data.user.role, 'ADMIN');
    authToken = res.data.token;
  });

  await t.test('GET /api/dashboard/stats returns municipal metrics', async () => {
    const res = await makeRequest('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.summary.totalDepartments >= 5);
    assert.ok(res.data.summary.totalProjects >= 5);
    assert.ok(res.data.datasetBadge.isDemoDataset === true);
  });

  await t.test('GET /api/departments returns registered agencies', async () => {
    const res = await makeRequest('/api/departments', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    const pwdDept = res.data.find((d) => d.code === 'PWD');
    assert.ok(pwdDept, 'PWD department should exist in Jaipur dataset');
  });

  await t.test('GET /api/projects lists projects with conflict indicators', async () => {
    const res = await makeRequest('/api/projects', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    const conflictingProj = res.data.find((p) => p.hasConflicts === true);
    assert.ok(conflictingProj, 'At least one project should have detected conflicts');
  });

  await t.test('GET /api/conflicts lists spatial and schedule conflicts', async () => {
    const res = await makeRequest('/api/conflicts', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length >= 1, 'Conflicts should be present');
    assert.ok(res.data[0].distanceMeters < 500);
    assert.ok(res.data[0].scheduleOverlapDays > 0);
  });

  await t.test('GET /api/resources lists inventory items', async () => {
    const res = await makeRequest('/api/resources', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length >= 5);
  });

  await t.test('GET /api/discussions lists forum threads', async () => {
    const res = await makeRequest('/api/discussions', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length >= 1);
  });
});
