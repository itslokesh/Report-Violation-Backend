import { prisma } from '../src/utils/database';

async function listTables() {
  try {
    console.log('🔍 Listing all tables in the database...\n');

    // Get table counts
    const userCount = await prisma.user.count();
    const citizenCount = await prisma.citizen.count();
    const violationReportCount = await prisma.violationReport.count();
    const otpCount = await prisma.oTP.count();
    const feedbackCount = await prisma.feedback.count();
    const feedbackResponseCount = await prisma.feedbackResponse.count();

    console.log('📊 Table Statistics:');
    console.log('===================');
    console.log(`👮 Users: ${userCount} records`);
    console.log(`👥 Citizens: ${citizenCount} records`);
    console.log(`🚨 Violation Reports: ${violationReportCount} records`);
    console.log(`📱 OTP Records: ${otpCount} records`);
    console.log(`💬 Feedback: ${feedbackCount} records`);
    console.log(`💬 Feedback Responses: ${feedbackResponseCount} records`);
    console.log('');

    // Get sample data from each table
    console.log('📋 Sample Data:');
    console.log('===============');

    // Sample Users
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        emailEncrypted: true,
        role: true,
        department: true,
        city: true,
      },
    });
    console.log('\n👮 Users (first 3):');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.emailEncrypted}) - ${user.role} in ${user.department}, ${user.city}`);
    });

    // Sample Citizens
    const citizens = await prisma.citizen.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        phoneNumberEncrypted: true,
        emailEncrypted: true,
        totalPoints: true,
        reportsSubmitted: true,
        accuracyRate: true,
      },
    });
    console.log('\n👥 Citizens (first 3):');
    citizens.forEach((citizen, index) => {
      console.log(`  ${index + 1}. ${citizen.name} - Points: ${citizen.totalPoints}, Reports: ${citizen.reportsSubmitted}, Accuracy: ${citizen.accuracyRate}%`);
    });

    // Sample Violation Reports
    const reports = await prisma.violationReport.findMany({
      take: 3,
      select: {
        id: true,
        violationType: true,
        status: true,
        city: true,
        vehicleNumberEncrypted: true,
        createdAt: true,
      },
    });
    console.log('\n🚨 Violation Reports (first 3):');
    reports.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.violationType} - ${report.status} in ${report.city} (${report.createdAt.toLocaleDateString()})`);
    });

    // Sample Feedback
    const feedback = await prisma.feedback.findMany({
      take: 3,
      select: {
        id: true,
        feedbackType: true,
        category: true,
        title: true,
        status: true,
        priority: true,
        rating: true,
        createdAt: true,
      },
    });
    console.log('\n💬 Feedback (first 3):');
    feedback.forEach((item, index) => {
      const ratingText = item.rating ? ` (${item.rating}/5)` : '';
      console.log(`  ${index + 1}. ${item.feedbackType} - ${item.category} - ${item.title}${ratingText} - ${item.status} (${item.createdAt.toLocaleDateString()})`);
    });

  } catch (error) {
    console.error('❌ Error listing tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTables();
