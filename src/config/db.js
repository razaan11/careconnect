// Prisma client singleton. Import this everywhere instead of
// instantiating `new PrismaClient()` in multiple places, which would
// exhaust the DB connection pool under load / hot-reload in dev.

const { PrismaClient } = require('@prisma/client');
require('./env');

const prisma = new PrismaClient();

module.exports = prisma;
