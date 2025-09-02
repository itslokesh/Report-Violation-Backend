import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Cleaning up database...');
  
  // Delete in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.pointsTransaction.deleteMany();
  await prisma.reportComment.deleteMany();
  await prisma.reportEvent.deleteMany();
  await prisma.feedbackResponse.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.violationReport.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.police.deleteMany();
  
  console.log('✅ Database cleanup completed');
}

// Run if this file is executed directly
if (require.main === module) {
  cleanupDatabase()
    .catch((error) => {
      console.error('❌ Failed to cleanup database:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
