import { prisma } from '../src/utils/database';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

// Global test teardown
afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

// Clean database between tests
beforeEach(async () => {
  // Clean all tables
  await prisma.violationReport.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.user.deleteMany();
});

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';
