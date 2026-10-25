require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const projectRoutes = require('./routes/projects');
const conflictRoutes = require('./routes/conflicts');
const resourceRoutes = require('./routes/resources');
const discussionRoutes = require('./routes/discussions');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SUTRA Municipal Coordination API',
    city: process.env.DEFAULT_CITY || 'Jaipur',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular REST routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Requested API endpoint does not exist.' });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('[SUTRA Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
  });
});

function startServer(port = 3001) {
  const actualPort = process.env.PORT || port;
  const server = app.listen(actualPort, '127.0.0.1', () => {
    console.log(`\n======================================================`);
    console.log(` SUTRA Municipal Infrastructure Coordination Server`);
    console.log(` Running on: http://127.0.0.1:${actualPort}`);
    console.log(` City Focus: ${process.env.DEFAULT_CITY || 'Jaipur'}, Rajasthan`);
    console.log(`======================================================\n`);
  });
  return server;
}

module.exports = { app, startServer };
