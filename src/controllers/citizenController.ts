import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { DuplicateDetectionService } from '../services/duplicateDetection';
import { SmsService } from '../services/smsService';
import { APP_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { CreateReportRequest } from '../types/reports';

const duplicateDetectionService = new DuplicateDetectionService();
const smsService = new SmsService();

export class CitizenController {
  // Get citizen profile
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const citizenId = req.user.id;
    
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        phoneNumberEncrypted: true,
        name: true,
        emailEncrypted: true,
        isPhoneVerified: true,
        isIdentityVerified: true,
        totalPoints: true,
        pointsEarned: true,
        pointsRedeemed: true,
        reportsSubmitted: true,
        reportsApproved: true,
        accuracyRate: true,
        isAnonymousMode: true,
        notificationEnabled: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!citizen) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND
      });
    }
    
    res.json({
      success: true,
      data: citizen
    });
  });
  
  // Update citizen profile
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const citizenId = req.user.id;
    const { name, email, isAnonymousMode, notificationEnabled } = req.body;
    
    const citizen = await prisma.citizen.update({
      where: { id: citizenId },
      data: {
        name,
        emailEncrypted: email,
        emailHash: email,
        isAnonymousMode,
        notificationEnabled
      }
    });
    
    res.json({
      success: true,
      data: citizen,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED
    });
  });
  
  // Submit violation report
  submitReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const citizenId = req.user.id;
    const reportData: any = req.body;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'submit_report_request',
      citizenId,
      body: reportData
    }));
    
    // Check daily report limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayReports = await prisma.violationReport.count({
      where: {
        citizenId,
        createdAt: {
          gte: today
        }
      }
    });
    
    if (todayReports >= APP_CONSTANTS.MAX_REPORTS_PER_DAY) {
      return res.status(429).json({
        success: false,
        error: 'Daily report limit exceeded'
      });
    }
    
    // Process duplicate detection
    const processedReport = await duplicateDetectionService.processReport(reportData);
    
    // Create report
    // Support array-based violation types from client
    const allViolationTypes = reportData.violationTypes as string[];
    const mainViolationType = allViolationTypes[0];

    const report = await prisma.violationReport.create({
      data: {
        citizenId,
        reporterId: citizenId,
        reporterPhoneEncrypted: req.user.phoneNumberEncrypted,
        reporterPhoneHash: req.user.phoneNumberEncrypted,
        reporterCity: reportData.city,
        reporterPincode: reportData.pincode,
        violationType: mainViolationType,
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
        photoUrl: reportData.photoUrl,
        videoUrl: reportData.videoUrl,
        isDuplicate: processedReport.isDuplicate,
        duplicateGroupId: processedReport.duplicateGroupId,
        mediaMetadata: JSON.stringify({ violationTypes: allViolationTypes }),
        isAnonymous: req.user.isAnonymousMode || reportData.isAnonymous
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            phoneNumberEncrypted: true
          }
        }
      }
    });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'submit_report_success',
      citizenId,
      reportId: report.id
    }));
    
    // Update citizen stats
    await prisma.citizen.update({
      where: { id: citizenId },
      data: {
        reportsSubmitted: { increment: 1 }
      }
    });
    
    res.json({
      success: true,
      data: report,
      message: SUCCESS_MESSAGES.REPORT_SUBMITTED
    });
  });
  
  // Get citizen's reports
  getMyReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const citizenId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [reports, total] = await Promise.all([
      prisma.violationReport.findMany({
        where: { citizenId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              badgeNumber: true
            }
          }
        }
      }),
      prisma.violationReport.count({
        where: { citizenId }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  });
  
  // Get specific report
  getReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const citizenId = req.user.id;
    const { id } = req.params;
    
    const report = await prisma.violationReport.findFirst({
      where: {
        id: Number(id),
        citizenId
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            badgeNumber: true
          }
        }
      }
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  });
  
  // Get citizen rewards/points
  getRewards = asyncHandler(async (req: AuthRequest, res: Response) => {
    const citizenId = req.user.id;
    
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        totalPoints: true,
        pointsEarned: true,
        pointsRedeemed: true,
        reportsSubmitted: true,
        reportsApproved: true,
        accuracyRate: true
      }
    });
    
    if (!citizen) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND
      });
    }
    
    // Get recent approved reports for points history
    const recentReports = await prisma.violationReport.findMany({
      where: {
        citizenId,
        status: 'APPROVED',
        pointsAwarded: { gt: 0 }
      },
      select: {
        id: true,
        violationType: true,
        pointsAwarded: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    res.json({
      success: true,
      data: {
        ...citizen,
        recentReports
      }
    });
  });
  
  // Get duplicate group if report is duplicate
  getDuplicateGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { duplicateGroupId } = req.params;
    
    const reports = await duplicateDetectionService.getDuplicateGroup(duplicateGroupId);
    
    res.json({
      success: true,
      data: reports
    });
  });
}

