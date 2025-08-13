import { PrismaClient } from '@prisma/client';
import { Helpers } from '../src/utils/helpers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create police users
  const policeUsers = [
    {
      email: 'officer1@police.gov.in',
      password: 'password123',
      name: 'Officer John Smith',
      role: 'OFFICER',
      department: 'Traffic Police',
      city: 'Chennai',
      district: 'Chennai',
      badgeNumber: 'TN001'
    },
    {
      email: 'supervisor1@police.gov.in',
      password: 'password123',
      name: 'Supervisor Mary Johnson',
      role: 'SUPERVISOR',
      department: 'Traffic Police',
      city: 'Chennai',
      district: 'Chennai',
      badgeNumber: 'TN002'
    },
    {
      email: 'admin@police.gov.in',
      password: 'password123',
      name: 'Admin Officer',
      role: 'ADMIN',
      department: 'Traffic Police',
      city: 'Chennai',
      district: 'Chennai',
      badgeNumber: 'TN003'
    }
  ];

  for (const userData of policeUsers) {
    const passwordHash = await Helpers.hashPassword(userData.password);
    
    await prisma.user.upsert({
      where: { emailEncrypted: userData.email },
      update: {},
      create: {
        emailEncrypted: userData.email,
        emailHash: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        city: userData.city,
        district: userData.district,
        badgeNumber: userData.badgeNumber
      }
    });
  }

  // Create sample citizens
  const citizens = [
    {
      phoneNumber: '+91-9876543210',
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      registeredCity: 'Chennai',
      registeredPincode: '600001',
      registeredDistrict: 'Chennai',
      registeredState: 'Tamil Nadu',
      isPhoneVerified: true,
      totalPoints: 50,
      pointsEarned: 50,
      reportsSubmitted: 5,
      reportsApproved: 4,
      accuracyRate: 80.0
    },
    {
      phoneNumber: '+91-8765432109',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      registeredCity: 'Chennai',
      registeredPincode: '600002',
      registeredDistrict: 'Chennai',
      registeredState: 'Tamil Nadu',
      isPhoneVerified: true,
      totalPoints: 25,
      pointsEarned: 25,
      reportsSubmitted: 3,
      reportsApproved: 2,
      accuracyRate: 66.7
    },
    {
      phoneNumber: '+91-7654321098',
      name: 'Amit Patel',
      email: 'amit@example.com',
      registeredCity: 'Chennai',
      registeredPincode: '600003',
      registeredDistrict: 'Chennai',
      registeredState: 'Tamil Nadu',
      isPhoneVerified: true,
      totalPoints: 15,
      pointsEarned: 15,
      reportsSubmitted: 2,
      reportsApproved: 1,
      accuracyRate: 50.0
    }
  ];

  for (const citizenData of citizens) {
    await prisma.citizen.upsert({
      where: { phoneNumberEncrypted: citizenData.phoneNumber },
      update: {},
      create: {
        phoneNumberEncrypted: citizenData.phoneNumber,
        phoneNumberHash: citizenData.phoneNumber,
        emailEncrypted: citizenData.email,
        emailHash: citizenData.email,
        name: citizenData.name,
        registeredCity: citizenData.registeredCity,
        registeredPincode: citizenData.registeredPincode,
        registeredDistrict: citizenData.registeredDistrict,
        registeredState: citizenData.registeredState,
        isPhoneVerified: citizenData.isPhoneVerified,
        totalPoints: citizenData.totalPoints,
        pointsEarned: citizenData.pointsEarned,
        reportsSubmitted: citizenData.reportsSubmitted,
        reportsApproved: citizenData.reportsApproved,
        accuracyRate: citizenData.accuracyRate
      }
    });
  }

  // Create sample violation reports
  const reports = [
    {
      reporterId: 'citizen1',
      reporterPhone: '+91-9876543210',
      reporterCity: 'Chennai',
      reporterPincode: '600001',
      violationType: 'SPEED_VIOLATION',
      description: 'Vehicle was speeding in a school zone',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      latitude: 13.0827,
      longitude: 80.2707,
      address: 'Anna Nagar Main Road, Chennai',
      pincode: '600040',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      vehicleNumber: 'TN01AB1234',
      vehicleType: 'FOUR_WHEELER',
      vehicleColor: 'White',
      status: 'APPROVED',
      pointsAwarded: 10,
      isFirstReporter: true
    },
    {
      reporterId: 'citizen2',
      reporterPhone: '+91-8765432109',
      reporterCity: 'Chennai',
      reporterPincode: '600002',
      violationType: 'SIGNAL_JUMPING',
      description: 'Vehicle jumped red signal at T Nagar junction',
      timestamp: new Date('2024-01-16T14:15:00Z'),
      latitude: 13.0368,
      longitude: 80.2421,
      address: 'T Nagar Junction, Chennai',
      pincode: '600017',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      vehicleNumber: 'TN02CD5678',
      vehicleType: 'TWO_WHEELER',
      vehicleColor: 'Red',
      status: 'PENDING',
      pointsAwarded: 0
    },
    {
      reporterId: 'citizen3',
      reporterPhone: '+91-7654321098',
      reporterCity: 'Chennai',
      reporterPincode: '600003',
      violationType: 'WRONG_SIDE_DRIVING',
      description: 'Vehicle driving on wrong side of the road',
      timestamp: new Date('2024-01-17T09:45:00Z'),
      latitude: 13.0604,
      longitude: 80.2496,
      address: 'Adyar Bridge Road, Chennai',
      pincode: '600020',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      vehicleNumber: 'TN03EF9012',
      vehicleType: 'FOUR_WHEELER',
      vehicleColor: 'Blue',
      status: 'UNDER_REVIEW',
      pointsAwarded: 0
    }
  ];

  // Get citizen IDs for reports
  const citizen1 = await prisma.citizen.findUnique({ where: { phoneNumberEncrypted: '+91-9876543210' } });
  const citizen2 = await prisma.citizen.findUnique({ where: { phoneNumberEncrypted: '+91-8765432109' } });
  const citizen3 = await prisma.citizen.findUnique({ where: { phoneNumberEncrypted: '+91-7654321098' } });

  if (citizen1 && citizen2 && citizen3) {
    const reportsWithCitizenIds = [
      { ...reports[0], citizenId: citizen1.id },
      { ...reports[1], citizenId: citizen2.id },
      { ...reports[2], citizenId: citizen3.id }
    ];

    for (const reportData of reportsWithCitizenIds) {
      await prisma.violationReport.create({
        data: {
          reporterId: reportData.reporterId,
          reporterPhoneEncrypted: reportData.reporterPhone,
          reporterPhoneHash: reportData.reporterPhone,
          reporterCity: reportData.reporterCity,
          reporterPincode: reportData.reporterPincode,
          violationType: reportData.violationType,
          description: reportData.description,
          timestamp: reportData.timestamp,
          latitude: reportData.latitude,
          longitude: reportData.longitude,
          addressEncrypted: reportData.address,
          pincode: reportData.pincode,
          city: reportData.city,
          district: reportData.district,
          state: reportData.state,
          vehicleNumberEncrypted: reportData.vehicleNumber,
          vehicleType: reportData.vehicleType,
          vehicleColor: reportData.vehicleColor,
          status: reportData.status,
          pointsAwarded: reportData.pointsAwarded,
          isFirstReporter: reportData.isFirstReporter,
          citizenId: reportData.citizenId
        }
      });
    }
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('👮‍♂️ Created police users:');
  console.log('   - officer1@police.gov.in (password: password123)');
  console.log('   - supervisor1@police.gov.in (password: password123)');
  console.log('   - admin@police.gov.in (password: password123)');
  console.log('👥 Created sample citizens with phone numbers');
  console.log('📋 Created sample violation reports');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

