const path = require('path');
let PrismaClient;

try {
  ({ PrismaClient } = require('./prisma-client'));
} catch (e) {
  try {
    ({ PrismaClient } = require('@prisma/client'));
  } catch (err2) {
    console.error('Failed to load PrismaClient:', err2);
  }
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
