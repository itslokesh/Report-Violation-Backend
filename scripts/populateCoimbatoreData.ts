import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption service for sensitive data
class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = 'your-32-character-secret-key-here-123';
  private readonly iv = Buffer.from('1234567890123456', 'utf8');

  encrypt(text: string): string {
    const key = crypto.scryptSync(this.secretKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.algorithm, key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  hashForSearch(text: string): string {
    return crypto.createHash('sha256').update(text.toLowerCase()).digest('hex');
  }
}

const encryptionService = new EncryptionService();

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Coimbatore city coordinates and areas
const COIMBATORE_AREAS = [
  { name: 'RS Puram', lat: 11.0168, lng: 76.9558, pincode: '641002' },
  { name: 'Peelamedu', lat: 11.0183, lng: 76.9725, pincode: '641004' },
  { name: 'Saibaba Colony', lat: 11.0168, lng: 76.9558, pincode: '641011' },
  { name: 'Race Course', lat: 11.0168, lng: 76.9558, pincode: '641018' },
  { name: 'Gandhipuram', lat: 11.0168, lng: 76.9558, pincode: '641012' },
  { name: 'Singanallur', lat: 11.0168, lng: 76.9558, pincode: '641005' },
  { name: 'Kovaipudur', lat: 11.0168, lng: 76.9558, pincode: '641010' },
  { name: 'Vadavalli', lat: 11.0168, lng: 76.9558, pincode: '641041' },
  { name: 'Thudiyalur', lat: 11.0168, lng: 76.9558, pincode: '641034' },
  { name: 'Saravanampatti', lat: 11.0168, lng: 76.9558, pincode: '641035' }
];

// Violation types with their severity and fine ranges
const VIOLATION_TYPES = [
  { type: 'SPEED_VIOLATION', severity: 'MAJOR', fine: { min: 1000, max: 2000 }, points: 100 },
  { type: 'SIGNAL_JUMPING', severity: 'MINOR', fine: { min: 500, max: 1000 }, points: 50 },
  { type: 'WRONG_SIDE_DRIVING', severity: 'CRITICAL', fine: { min: 2000, max: 5000 }, points: 150 },
  { type: 'NO_PARKING_ZONE', severity: 'MINOR', fine: { min: 300, max: 500 }, points: 25 },
  { type: 'HELMET_SEATBELT_VIOLATION', severity: 'MAJOR', fine: { min: 1000, max: 1500 }, points: 75 },
  { type: 'MOBILE_PHONE_USAGE', severity: 'MAJOR', fine: { min: 1000, max: 2000 }, points: 100 },
  { type: 'LANE_CUTTING', severity: 'MINOR', fine: { min: 500, max: 750 }, points: 50 },
  { type: 'DRUNK_DRIVING_SUSPECTED', severity: 'CRITICAL', fine: { min: 5000, max: 10000 }, points: 200 },
  { type: 'OTHERS', severity: 'MINOR', fine: { min: 500, max: 750 }, points: 50 }
];

// Vehicle types and colors
const VEHICLE_TYPES = ['TWO_WHEELER', 'FOUR_WHEELER', 'THREE_WHEELER', 'HEAVY_VEHICLE'];
const VEHICLE_COLORS = ['White', 'Black', 'Red', 'Blue', 'Silver', 'Grey', 'Green', 'Yellow', 'Orange'];

// Generate random date within last 3 months
function getRandomDate(): Date {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Generate random coordinates within Coimbatore city bounds
function getRandomCoimbatoreCoordinates(): { lat: number, lng: number, area: any } {
  const area = COIMBATORE_AREAS[Math.floor(Math.random() * COIMBATORE_AREAS.length)];
  // Add some random variation within the area (±0.01 degrees ≈ ±1km)
  const lat = area.lat + (Math.random() - 0.5) * 0.02;
  const lng = area.lng + (Math.random() - 0.5) * 0.02;
  return { lat, lng, area };
}

// Generate random vehicle number
function generateVehicleNumber(): string {
  const states = ['TN', 'KL', 'KA', 'AP'];
  const state = states[Math.floor(Math.random() * states.length)];
  const district = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                 String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const numbers = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `${state}${district}${letters}${numbers}`;
}

// Generate random phone number
function generatePhoneNumber(): string {
  const prefixes = ['9876', '8765', '7654', '6543', '5432', '4321', '3210', '2109', '1098', '0987'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = String(Math.floor(Math.random() * 100000) + 10000);
  return `+91-${prefix}${suffix}`;
}

// Generate random name
function generateName(): string {
  const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Meera', 'Arjun', 'Kavya', 
                     'Suresh', 'Divya', 'Kumar', 'Pooja', 'Mohan', 'Riya', 'Ganesh', 'Anita', 'Siva', 'Lakshmi'];
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Gupta', 'Verma', 'Joshi', 'Malhotra', 'Chopra',
                    'Kapoor', 'Tiwari', 'Yadav', 'Mishra', 'Pandey', 'Chauhan', 'Rao', 'Nair', 'Menon', 'Iyer'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

// Generate random description based on violation type
function generateDescription(violationType: string, area: string): string {
  const descriptions = {
    'SPEED_VIOLATION': [
      `Vehicle was speeding at ${Math.floor(Math.random() * 40) + 60} km/h in a ${Math.floor(Math.random() * 20) + 30} km/h zone in ${area}`,
      `Excessive speed detected near ${area} junction`,
      `Vehicle overtaking at high speed in ${area} area`
    ],
    'SIGNAL_JUMPING': [
      `Vehicle jumped red signal at ${area} traffic junction`,
      `Ignored traffic signal at ${area} intersection`,
      `Proceeded through red light at ${area} crossing`
    ],
    'WRONG_SIDE_DRIVING': [
      `Vehicle driving on wrong side of the road in ${area}`,
      `Reckless driving on opposite lane near ${area}`,
      `Wrong direction driving in ${area} area`
    ],
    'NO_PARKING_ZONE': [
      `Vehicle parked in no-parking zone near ${area}`,
      `Illegal parking in restricted area of ${area}`,
      `Vehicle blocking traffic in ${area}`
    ],
    'HELMET_SEATBELT_VIOLATION': [
      `Motorcyclist riding without helmet in ${area}`,
      `Driver not wearing seatbelt in ${area}`,
      `Safety violation detected in ${area} area`
    ],
    'MOBILE_PHONE_USAGE': [
      `Driver using mobile phone while driving in ${area}`,
      `Distracted driving due to phone usage in ${area}`,
      `Mobile phone violation detected in ${area}`
    ],
    'LANE_CUTTING': [
      `Vehicle cutting lanes dangerously in ${area}`,
      `Improper lane changing in ${area} area`,
      `Lane discipline violation in ${area}`
    ],
    'DRUNK_DRIVING_SUSPECTED': [
      `Suspected drunk driving behavior in ${area}`,
      `Erratic driving pattern suggesting intoxication in ${area}`,
      `Possible DUI violation in ${area} area`
    ],
    'OTHERS': [
      `Traffic rule violation in ${area}`,
      `General traffic offense in ${area} area`,
      `Road safety violation in ${area}`
    ]
  };
  
  const typeDescriptions = descriptions[violationType as keyof typeof descriptions] || descriptions['OTHERS'];
  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
}

// Data cleanup function
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

// Main population function
async function populateCoimbatoreData() {
  console.log('🌱 Starting Coimbatore database population...');

  try {
    // Clean up existing data first
    await cleanupDatabase();

    // 1. Create Police Users for Coimbatore
    console.log('👮 Creating police users for Coimbatore...');
    const policeUsers = [
      {
        email: 'commissioner@coimbatore.gov.in',
        password: 'password123',
        name: 'Commissioner Suresh Kumar',
        role: 'COMMISSIONER',
        department: 'Traffic Police',
        city: 'Coimbatore',
        district: 'Coimbatore',
        badgeNumber: 'CB001'
      },
      {
        email: 'dsp.traffic@coimbatore.gov.in',
        password: 'password123',
        name: 'DSP Traffic Priya Devi',
        role: 'DSP',
        department: 'Traffic Police',
        city: 'Coimbatore',
        district: 'Coimbatore',
        badgeNumber: 'CB002'
      },
      {
        email: 'inspector.rs@coimbatore.gov.in',
        password: 'password123',
        name: 'Inspector Rajesh Iyer',
        role: 'INSPECTOR',
        department: 'Traffic Police',
        city: 'Coimbatore',
        district: 'RS Puram',
        badgeNumber: 'CB003'
      },
      {
        email: 'constable.peelamedu@coimbatore.gov.in',
        password: 'password123',
        name: 'Constable Meera Nair',
        role: 'CONSTABLE',
        department: 'Traffic Police',
        city: 'Coimbatore',
        district: 'Peelamedu',
        badgeNumber: 'CB004'
      },
      {
        email: 'admin@coimbatore.gov.in',
        password: 'admin123',
        name: 'System Administrator',
        role: 'ADMIN',
        department: 'IT Department',
        city: 'Coimbatore',
        district: 'Coimbatore',
        badgeNumber: 'CB005'
      }
    ];

    const createdPolice: any[] = [];
    for (const userData of policeUsers) {
      const passwordHash = await hashPassword(userData.password);
      const emailEncrypted = encryptionService.encrypt(userData.email);
      const emailHash = encryptionService.hashForSearch(userData.email);
      
      const police = await prisma.police.create({
        data: {
          emailEncrypted,
          emailHash,
          passwordHash,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          city: userData.city,
          district: userData.district,
          badgeNumber: userData.badgeNumber
        }
      });
      createdPolice.push(police);
    }

    // 2. Create Citizens
    console.log('👥 Creating citizens...');
    const citizens: any[] = [];
    for (let i = 0; i < 25; i++) {
      const phoneNumber = generatePhoneNumber();
      const name = generateName();
      const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
      const isPhoneVerified = Math.random() > 0.1; // 90% verified
      const isIdentityVerified = Math.random() > 0.2; // 80% verified
      const totalPoints = Math.floor(Math.random() * 1000) + 50;
      const pointsEarned = totalPoints + Math.floor(Math.random() * 200);
      const pointsRedeemed = pointsEarned - totalPoints;
      const reportsSubmitted = Math.floor(Math.random() * 20) + 1;
      const reportsApproved = Math.floor(reportsSubmitted * (0.6 + Math.random() * 0.3)); // 60-90% approval rate
      const accuracyRate = reportsSubmitted > 0 ? (reportsApproved / reportsSubmitted) * 100 : 0;

      const phoneEncrypted = encryptionService.encrypt(phoneNumber);
      const phoneHash = encryptionService.hashForSearch(phoneNumber);
      const emailEncrypted = encryptionService.encrypt(email);
      const emailHash = encryptionService.hashForSearch(email);
      
      const citizen = await prisma.citizen.create({
        data: {
          phoneNumberEncrypted: phoneEncrypted,
          phoneNumberHash: phoneHash,
          emailEncrypted,
          emailHash,
          name,
          isPhoneVerified,
          isIdentityVerified,
          totalPoints,
          pointsEarned,
          pointsRedeemed,
          reportsSubmitted,
          reportsApproved,
          accuracyRate
        }
      });
      citizens.push(citizen);
    }

    // 3. Create 100 Violation Reports
    console.log('🚨 Creating 100 violation reports across Coimbatore...');
    const createdReports: any[] = [];
    const reportEvents: any[] = [];
    const pointsTransactions: any[] = [];
    const notifications: any[] = [];

    for (let i = 0; i < 100; i++) {
      const citizen = citizens[Math.floor(Math.random() * citizens.length)];
      const violationType = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
      const coords = getRandomCoimbatoreCoordinates();
      const timestamp = getRandomDate();
      const status = Math.random() > 0.2 ? (Math.random() > 0.5 ? 'APPROVED' : 'REJECTED') : 'PENDING'; // 80% decided
      const isFirstReporter = Math.random() > 0.7; // 30% first reporters
      const pointsAwarded = status === 'APPROVED' ? violationType.points : 0;
      const challanIssued = status === 'APPROVED' && Math.random() > 0.3; // 70% of approved get challan
      const challanNumber = challanIssued ? `CH${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}` : null;
      const reviewer = status !== 'PENDING' ? createdPolice[Math.floor(Math.random() * createdPolice.length)] : null;
      
      // Calculate review timestamp to maintain chronological order
      // Review should happen between 1-14 days after report submission
      // But ensure it doesn't go beyond the current date
      const now = new Date();
      const maxReviewTime = Math.min(14 * 24 * 60 * 60 * 1000, now.getTime() - timestamp.getTime()); // 14 days or until now
      const minReviewTime = 1 * 24 * 60 * 60 * 1000; // 1 day minimum
      const reviewDelay = status !== 'PENDING' ? 
        Math.random() * (maxReviewTime - minReviewTime) + minReviewTime : 0;
      const reviewTimestamp = status !== 'PENDING' ? new Date(timestamp.getTime() + reviewDelay) : null;
      
      const phoneEncrypted = encryptionService.encrypt(citizen.phoneNumberEncrypted);
      const phoneHash = encryptionService.hashForSearch(citizen.phoneNumberEncrypted);
      const addressEncrypted = encryptionService.encrypt(`${coords.area.name}, Coimbatore`);
      const vehicleNumberEncrypted = Math.random() > 0.1 ? encryptionService.encrypt(generateVehicleNumber()) : null;
      
      const report = await prisma.violationReport.create({
        data: {
          reporterId: citizen.id,
          reporterPhoneEncrypted: phoneEncrypted,
          reporterPhoneHash: phoneHash,
          reporterCity: 'Coimbatore',
          reporterPincode: coords.area.pincode,
          violationType: violationType.type,
          severity: violationType.severity,
          description: generateDescription(violationType.type, coords.area.name),
          timestamp,
          latitude: coords.lat,
          longitude: coords.lng,
          addressEncrypted,
          pincode: coords.area.pincode,
          city: 'Coimbatore',
          district: 'Coimbatore',
          state: 'Tamil Nadu',
          vehicleNumberEncrypted,
          vehicleType: VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)],
          vehicleColor: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
          status,
          pointsAwarded,
          isFirstReporter,
          challanIssued,
          challanNumber,
          citizenId: citizen.id,
          reviewerId: reviewer?.id,
          reviewTimestamp,
          reviewNotes: status === 'REJECTED' ? 'Insufficient evidence or unclear violation' : null,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      });
      createdReports.push(report);

      // Create report events with proper chronological order
      const events: any[] = [
        {
          reportId: report.id,
          citizenId: citizen.id,
          type: 'REPORT_SUBMITTED',
          title: 'Report Submitted',
          description: 'Violation report submitted successfully',
          createdAt: timestamp
        }
      ];

      if (status !== 'PENDING') {
        // Add status update event
        events.push({
          reportId: report.id,
          userId: reviewer?.id || null,
          type: 'STATUS_UPDATED',
          title: `Report ${status}`,
          description: `Report reviewed and ${status.toLowerCase()}`,
          createdAt: reviewTimestamp!
        });

        if (status === 'APPROVED') {
          // Add points awarded event (same time as review for simplicity)
          events.push({
            reportId: report.id,
            userId: reviewer?.id || null,
            type: 'POINTS_AWARDED',
            title: 'Points Awarded',
            description: `${pointsAwarded} points awarded for approved report`,
            createdAt: reviewTimestamp!
          });

          if (challanIssued) {
            // Add challan issued event (same time as review for simplicity)
            events.push({
              reportId: report.id,
              userId: reviewer?.id || null,
              type: 'CHALLAN_ISSUED',
              title: 'Challan Issued',
              description: `Challan number ${challanNumber} issued`,
              createdAt: reviewTimestamp!
            });
          }
        }
      }

      reportEvents.push(...events);

      // Create points transactions for approved reports
      if (status === 'APPROVED' && pointsAwarded > 0) {
        pointsTransactions.push({
          citizenId: citizen.id,
          type: 'EARN',
          reportId: report.id,
          points: pointsAwarded,
          description: `Points earned for approved ${violationType.type.toLowerCase()} report`,
          balanceAfter: citizen.totalPoints + pointsAwarded,
          createdAt: reviewTimestamp! // Use review timestamp for chronological order
        });
      }

      // Create notifications
      if (status !== 'PENDING') {
        notifications.push({
          citizenId: citizen.id,
          reportId: report.id,
          type: 'REPORT_STATUS',
          title: `Report ${status}`,
          message: status === 'APPROVED' 
            ? `Your violation report has been approved. ${pointsAwarded} points have been awarded.`
            : 'Your violation report has been rejected due to insufficient evidence.',
          readAt: null,
          expiresAt: new Date(reviewTimestamp!.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from review
          createdAt: reviewTimestamp! // Use review timestamp for chronological order
        });
      }
    }

    // 4. Create Report Events
    console.log('📋 Creating report events...');
    for (const event of reportEvents) {
      await prisma.reportEvent.create({
        data: event
      });
    }

    // 5. Create Points Transactions
    console.log('💰 Creating points transactions...');
    for (const transaction of pointsTransactions) {
      await prisma.pointsTransaction.create({
        data: transaction
      });
    }

    // 6. Create Notifications
    console.log('🔔 Creating notifications...');
    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification
      });
    }

    // 7. Create some sample feedback
    console.log('💬 Creating sample feedback...');
    const feedbackData = [
      {
        feedbackType: 'APP_FEEDBACK',
        category: 'UI_UX',
        title: 'Great app for reporting violations',
        description: 'The app is very user-friendly and makes it easy to report traffic violations in Coimbatore.',
        rating: 5,
        priority: 'LOW',
        status: 'RESOLVED',
        isAnonymous: false,
        citizenId: citizens[0].id
      },
      {
        feedbackType: 'SERVICE_FEEDBACK',
        category: 'PRAISE',
        title: 'Quick response from Coimbatore traffic police',
        description: 'Submitted a report and received a response within 24 hours. Very efficient service.',
        rating: 5,
        priority: 'LOW',
        status: 'RESOLVED',
        isAnonymous: false,
        citizenId: citizens[1].id
      },
      {
        feedbackType: 'FEATURE_REQUEST',
        category: 'SUGGESTION',
        title: 'Add more areas in Coimbatore',
        description: 'Please add more areas and landmarks in Coimbatore for better location accuracy.',
        rating: 4,
        priority: 'MEDIUM',
        status: 'IN_REVIEW',
        isAnonymous: true
      }
    ];

    const createdFeedback: any[] = [];
    for (const feedback of feedbackData) {
      const feedbackRecord = await prisma.feedback.create({
        data: feedback
      });
      createdFeedback.push(feedbackRecord);
    }

    // 8. Create feedback responses
    console.log('💬 Creating feedback responses...');
    const responseData = [
      {
        feedbackId: createdFeedback[0].id,
        responderId: createdPolice[4].id,
        message: 'Thank you for your positive feedback! We\'re glad you find the app useful.',
        isInternal: false
      },
      {
        feedbackId: createdFeedback[2].id,
        responderId: createdPolice[4].id,
        message: 'We\'re working on expanding the coverage areas in Coimbatore. This will be available in the next update.',
        isInternal: false
      }
    ];

    for (const response of responseData) {
      await prisma.feedbackResponse.create({
        data: response
      });
    }

    // 9. Create some report comments
    console.log('💬 Creating report comments...');
    const commentData = [
      {
        reportId: createdReports[0].id,
        authorId: createdPolice[0].id,
        authorName: 'Commissioner Suresh Kumar',
        message: 'Clear evidence provided. Violation confirmed.',
        isInternal: false
      },
      {
        reportId: createdReports[1].id,
        authorId: createdPolice[2].id,
        authorName: 'Inspector Rajesh Iyer',
        message: 'Need additional evidence to proceed with this case.',
        isInternal: false
      }
    ];

    for (const comment of commentData) {
      await prisma.reportComment.create({
        data: comment
      });
    }

    console.log('✅ Coimbatore database population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👮 Police Users: ${createdPolice.length}`);
    console.log(`👥 Citizens: ${citizens.length}`);
    console.log(`🚨 Violation Reports: ${createdReports.length}`);
    console.log(`📋 Report Events: ${reportEvents.length}`);
    console.log(`💰 Points Transactions: ${pointsTransactions.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    console.log(`💬 Feedback: ${createdFeedback.length}`);
    
    // Calculate statistics
    const approvedReports = createdReports.filter(r => r.status === 'APPROVED').length;
    const rejectedReports = createdReports.filter(r => r.status === 'REJECTED').length;
    const pendingReports = createdReports.filter(r => r.status === 'PENDING').length;
    
    console.log('\n📈 Report Statistics:');
    console.log(`✅ Approved: ${approvedReports} (${(approvedReports/100*100).toFixed(1)}%)`);
    console.log(`❌ Rejected: ${rejectedReports} (${(rejectedReports/100*100).toFixed(1)}%)`);
    console.log(`⏳ Pending: ${pendingReports} (${(pendingReports/100*100).toFixed(1)}%)`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Police Users:');
    policeUsers.forEach((police, index) => {
      console.log(`  ${index + 1}. ${police.email} (password: ${police.password})`);
    });

  } catch (error) {
    console.error('❌ Error during database population:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for external use
export { populateCoimbatoreData, cleanupDatabase };

// Run if this file is executed directly
if (require.main === module) {
  populateCoimbatoreData()
    .catch((error) => {
      console.error('❌ Failed to populate database:', error);
      process.exit(1);
    });
}
