import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { MockDataService } from '../services/mockDataService';
import { SmsService } from '../services/smsService';
import { APP_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VIOLATION_FINES, convertToLocalhostUrl } from '../utils/constants';
import { ReportEventService } from '../services/reportEventService';
import { encryptionService } from '../utils/encryption';

// Helper to safely parse JSON string metadata
const parseMedia = (metadata: string | null): any => {
  if (!metadata) return null;
  try { return JSON.parse(metadata); } catch { return metadata; }
};
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { ReportFilters, UpdateReportStatusRequest } from '../types/reports';

const mockDataService = new MockDataService();
const smsService = new SmsService();

export class PoliceController {
  // Get police profile
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    
    const user = await prisma.police.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailEncrypted: true,
        name: true,
        role: true,
        department: true,
        city: true,
        district: true,
        badgeNumber: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND
      });
    }
    
    // Decrypt email before sending to frontend
    const decryptedUser = {
      ...user,
              email: user.emailEncrypted || 'Unknown'
    };
    
    res.json({
      success: true,
      data: decryptedUser
    });
  });
  
  // Update police profile
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { name, department } = req.body;
    
    const user = await prisma.police.update({
      where: { id: userId },
      data: {
        name,
        department
      }
    });
    
    res.json({
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED
    });
  });
  
  // Get all reports with filters
  getReports = asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      city,
      violationType,
      violationTypes,
      violationTypeMode = 'any',
      dateFrom,
      dateTo,
      vehicleNumber,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as any;
    
    const filters: any = {};
    
    if (status) filters.status = status;
    if (city) filters.city = city;
    if (violationType) filters.violationType = violationType;
    const typesArray = Array.isArray(violationTypes)
      ? violationTypes
      : (typeof violationTypes === 'string' && violationTypes.length > 0
        ? violationTypes.split(',')
        : undefined);
    if (typesArray && typesArray.length > 0) {
      if (violationTypeMode === 'all') {
        // All-of set: emulate by AND-ing ORs via string contains in mediaMetadata if needed
        // For now, treat as ANY since schema stores single violationType; extend if multi-type stored
        filters.violationType = { in: typesArray } as any;
      } else {
        // ANY-of set
        filters.violationType = { in: typesArray } as any;
      }
    }
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) filters.createdAt.lte = new Date(dateTo as string);
    }
    if (vehicleNumber) {
      filters.vehicleNumberEncrypted = {
        contains: vehicleNumber as string
      };
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'timestamp') {
      orderBy.timestamp = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }
    
    const [reports, total] = await Promise.all([
      prisma.violationReport.findMany({
        where: filters,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              phoneNumberEncrypted: true,
              totalPoints: true,
              reportsSubmitted: true,
              reportsApproved: true,
              accuracyRate: true
            }
          }
        }
      }),
      prisma.violationReport.count({ where: filters })
    ]);
    
    const parseMedia = (metadata: string | null) => {
      if (!metadata) return null;
      try { return JSON.parse(metadata); } catch { return metadata; }
    };

    // Transform reports to match expected response format (include mediaMetadata)
    const transformedReports = reports.map(report => ({
      id: report.id,
      violationType: report.violationType,
      severity: report.severity,
      description: report.description,
      timestamp: report.timestamp,
      latitude: report.latitude,
      longitude: report.longitude,
      address: report.addressEncrypted || 'Unknown Address',
      city: report.city,
      vehicleNumber: report.vehicleNumberEncrypted,
      vehicleType: report.vehicleType,
      status: report.status,
      photoUrl: convertToLocalhostUrl(report.photoUrl),
      videoUrl: convertToLocalhostUrl(report.videoUrl),
      mediaMetadata: parseMedia(report.mediaMetadata as any),
      citizen: {
        id: report.citizen.id,
        name: report.citizen.name,
        phoneNumber: report.citizen.phoneNumberEncrypted || 'Unknown',
        totalPoints: report.citizen.totalPoints,
        reportsSubmitted: report.citizen.reportsSubmitted,
        reportsApproved: report.citizen.reportsApproved,
        accuracyRate: report.citizen.accuracyRate
      },
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }));
    
    res.json({
      success: true,
      data: {
        reports: transformedReports,
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
  getReport = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const report = await prisma.violationReport.findUnique({
      where: { id: Number(id) },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            phoneNumberEncrypted: true,
            totalPoints: true,
            reportsSubmitted: true,
            reportsApproved: true,
            accuracyRate: true
          }
        },
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
    
    // Get vehicle information if available
    let vehicleInfo = null;
    if (report.vehicleNumberEncrypted) {
      vehicleInfo = await mockDataService.getVehicleInfo(report.vehicleNumberEncrypted);
    }
    
    // Calculate suggested fine
    let suggestedFine = 0;
    if (vehicleInfo) {
      suggestedFine = mockDataService.calculateFine(report.violationType as any, report.severity as any);
    }
    
    // Transform report to match expected response format
    const transformedReport = {
      id: report.id,
      violationType: report.violationType,
      severity: report.severity,
      description: report.description,
      timestamp: report.timestamp,
      latitude: report.latitude,
      longitude: report.longitude,
      address: report.addressEncrypted || 'Unknown Address',
      city: report.city,
      vehicleNumber: report.vehicleNumberEncrypted,
      vehicleType: report.vehicleType,
      status: report.status,
      photoUrl: convertToLocalhostUrl(report.photoUrl),
      videoUrl: convertToLocalhostUrl(report.videoUrl),
      mediaMetadata: parseMedia(report.mediaMetadata as any),
      citizen: {
        id: report.citizen.id,
        name: report.citizen.name,
        phoneNumber: report.citizen.phoneNumberEncrypted || 'Unknown',
        totalPoints: report.citizen.totalPoints,
        reportsSubmitted: report.citizen.reportsSubmitted,
        reportsApproved: report.citizen.reportsApproved,
        accuracyRate: report.citizen.accuracyRate
      }
    };
    
    res.json({
      success: true,
      data: {
        report: transformedReport,
        vehicleInfo,
        suggestedFine
      }
    });
  });
  
  // Update report status
  updateReportStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, reviewNotes, challanIssued, challanNumber, approvedViolationTypes }: any = req.body;
    const reviewerId = (req as any).user?.id || null;
    
    const report = await prisma.violationReport.findUnique({
      where: { id: Number(id) },
      include: { citizen: true }
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND
      });
    }
    
    // Calculate points to award if approved
    let pointsAwarded = 0;
    let approvedCount = 0;
    let mediaMetadataUpdate: string | undefined;
    if (status === 'APPROVED') {
      const parsedTypesRaw = Array.isArray(approvedViolationTypes)
        ? approvedViolationTypes
        : (typeof approvedViolationTypes === 'string' && approvedViolationTypes.length > 0
          ? approvedViolationTypes.split(',').map((s: string) => s.trim()).filter(Boolean)
          : []);
      const parsedTypes = parsedTypesRaw.map((t: string) => t.toUpperCase());
      approvedCount = parsedTypes.length > 0 ? parsedTypes.length : 1;
      pointsAwarded = APP_CONSTANTS.POINTS_PER_APPROVED_REPORT * approvedCount;

      // Merge approved violations into mediaMetadata for audit/UX
      let existingMeta: any = {};
      try { existingMeta = report.mediaMetadata ? JSON.parse(report.mediaMetadata) : {}; } catch { existingMeta = {}; }
      existingMeta.approvedViolationTypes = parsedTypes.length > 0 ? parsedTypes : [report.violationType].filter(Boolean);
      existingMeta.approvedAt = new Date().toISOString();
      if (reviewerId) existingMeta.approvedBy = reviewerId;
      mediaMetadataUpdate = JSON.stringify(existingMeta);
    }
    
    // Update report
    const updatedReport = await prisma.violationReport.update({
      where: { id: Number(id) },
      data: {
        status,
        reviewNotes,
        challanIssued,
        challanNumber,
        reviewerId,
        reviewTimestamp: new Date(),
        pointsAwarded,
        ...(mediaMetadataUpdate ? { mediaMetadata: mediaMetadataUpdate } : {})
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            phoneNumberEncrypted: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            badgeNumber: true
          }
        }
      }
    });

    // Log event: status updated
    await ReportEventService.log({
      reportId: Number(id),
      type: 'STATUS_UPDATED',
      title: `Status changed to ${status}`,
      description: reviewNotes || undefined,
      metadata: { status, challanIssued, challanNumber },
      userId: reviewerId || undefined
    });
    
    // Update citizen stats and create points transaction if approved/rejected
    if (status === 'APPROVED' || status === 'REJECTED') {
      const citizen = await prisma.citizen.findUnique({
        where: { id: report.citizenId }
      });
      
      if (citizen) {
        const newApprovedCount = status === 'APPROVED' ? citizen.reportsApproved + 1 : citizen.reportsApproved;
        const newPointsEarned = status === 'APPROVED' ? citizen.pointsEarned + pointsAwarded : citizen.pointsEarned;
        const newTotalPoints = status === 'APPROVED' ? citizen.totalPoints + pointsAwarded : citizen.totalPoints;
        const accuracyRate = citizen.reportsSubmitted > 0 ? (newApprovedCount / citizen.reportsSubmitted) * 100 : 0;
        
        await prisma.citizen.update({
          where: { id: report.citizenId },
          data: {
            reportsApproved: newApprovedCount,
            pointsEarned: newPointsEarned,
            totalPoints: newTotalPoints,
            accuracyRate
          }
        });

        // Create points transaction when approved
        if (status === 'APPROVED' && pointsAwarded > 0) {
          await prisma.pointsTransaction.create({
            data: {
              citizenId: report.citizenId,
              type: 'EARN',
              reportId: Number(id),
              points: pointsAwarded,
              description: `Points awarded for approved report #${id} (${approvedCount} violation(s))`,
              balanceAfter: newTotalPoints
            }
          });

          // Log event: points awarded
          await ReportEventService.log({
            reportId: Number(id),
            type: 'POINTS_AWARDED',
            title: 'Points awarded',
            description: `${pointsAwarded} points awarded to citizen`,
            metadata: { pointsAwarded },
            citizenId: report.citizenId,
            userId: reviewerId
          });
        }
        
        // Send SMS notification if approved
        if (status === 'APPROVED' && citizen.notificationEnabled) {
          await smsService.sendReportStatusUpdate(citizen.phoneNumberEncrypted, Number(id), status);
          await smsService.sendPointsUpdate(citizen.phoneNumberEncrypted, pointsAwarded, newTotalPoints);
        }
      }
    }
    
    // Transform response to match expected format
    const responseData = {
      id: updatedReport.id,
      status: updatedReport.status,
      reviewNotes: updatedReport.reviewNotes,
      challanIssued: updatedReport.challanIssued,
      challanNumber: updatedReport.challanNumber,
      reviewerId: updatedReport.reviewerId,
      reviewTimestamp: updatedReport.reviewTimestamp,
      pointsAwarded: updatedReport.pointsAwarded,
      citizen: {
        id: updatedReport.citizen.id,
        name: updatedReport.citizen.name,
        phoneNumber: updatedReport.citizen.phoneNumberEncrypted || 'Unknown'
      }
    };
    
    res.json({
      success: true,
      data: responseData,
      message: "Report updated successfully"
    });
  });
  
  // Get dashboard overview
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo, city } = req.query;
    
    // Build date filters
    const dateFilters: any = {};
    if (dateFrom) {
      dateFilters.gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      dateFilters.lte = new Date(dateTo as string);
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    if (city) {
      whereClause.city = city;
    }
    
    // Get today's date for today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayWhereClause = {
      ...whereClause,
      createdAt: {
        ...whereClause.createdAt,
        gte: today,
        lt: tomorrow
      }
    };
    
    const [
      totalReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      duplicateReports,
      processedToday,
      approvedToday,
      rejectedToday,
      reportsByViolationType,
      reportsByCity,
      reportsByStatus
    ] = await Promise.all([
      prisma.violationReport.count({ where: whereClause }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'PENDING' } }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'APPROVED' } }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'REJECTED' } }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'DUPLICATE' } }),
      prisma.violationReport.count({ where: todayWhereClause }),
      prisma.violationReport.count({ where: { ...todayWhereClause, status: 'APPROVED' } }),
      prisma.violationReport.count({ where: { ...todayWhereClause, status: 'REJECTED' } }),
      prisma.violationReport.groupBy({
        by: ['violationType'],
        where: whereClause,
        _count: { violationType: true }
      }),
      prisma.violationReport.groupBy({
        by: ['city'],
        where: whereClause,
        _count: { city: true }
      }),
      prisma.violationReport.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      })
    ]);
    
    // Calculate average processing time (in seconds)
    const processedReports = await prisma.violationReport.findMany({
      where: {
        ...whereClause,
        reviewTimestamp: { not: null }
      },
      select: {
        createdAt: true,
        reviewTimestamp: true
      }
    });
    
    let averageProcessingTime = 0;
    if (processedReports.length > 0) {
      const totalTime = processedReports.reduce((sum, report) => {
        const processingTime = report.reviewTimestamp!.getTime() - report.createdAt.getTime();
        return sum + processingTime;
      }, 0);
      averageProcessingTime = Math.round(totalTime / processedReports.length / 1000); // Convert to seconds
    }
    
    // Weekly trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyReports = await prisma.violationReport.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: sevenDaysAgo, lt: new Date() }
      },
      select: {
        createdAt: true,
        status: true,
        violationType: true,
        severity: true
      }
    });

    const weeklyTrend = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(sevenDaysAgo);
      day.setDate(sevenDaysAgo.getDate() + idx);
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);

      const items = weeklyReports.filter(r => r.createdAt >= dayStart && r.createdAt <= dayEnd);
      const reports = items.length;
      const approved = items.filter(r => r.status === 'APPROVED').length;
      const rejected = items.filter(r => r.status === 'REJECTED').length;
      const pending = items.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;
      const revenue = items
        .filter(r => r.status === 'APPROVED' && r.violationType && r.severity && (VIOLATION_FINES as any)[r.violationType] && (VIOLATION_FINES as any)[r.violationType][r.severity])
        .reduce((sum, r: any) => sum + (VIOLATION_FINES as any)[r.violationType][r.severity], 0);
      return {
        date: dayStart.toISOString().split('T')[0],
        reports,
        approved,
        rejected,
        pending,
        revenue
      };
    });

    // Monthly trend (last 12 months)
    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);
    const twelveMonthsAgo = new Date(startOfThisMonth);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const monthlyReports = await prisma.violationReport.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: twelveMonthsAgo, lt: new Date() }
      },
      select: {
        createdAt: true,
        status: true,
        violationType: true,
        severity: true
      }
    });

    const monthlyTrendMap = new Map<string, { reports: number; approved: number; rejected: number; pending: number; revenue: number }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo);
      d.setMonth(twelveMonthsAgo.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrendMap.set(key, { reports: 0, approved: 0, rejected: 0, pending: 0, revenue: 0 });
    }

    monthlyReports.forEach((r: any) => {
      const d = r.createdAt as Date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyTrendMap.get(key)!;
      entry.reports += 1;
      if (r.status === 'APPROVED') entry.approved += 1;
      else if (r.status === 'REJECTED') entry.rejected += 1;
      else if (r.status === 'PENDING' || r.status === 'UNDER_REVIEW') entry.pending += 1;
      if (r.status === 'APPROVED' && r.violationType && r.severity && (VIOLATION_FINES as any)[r.violationType] && (VIOLATION_FINES as any)[r.violationType][r.severity]) {
        entry.revenue += (VIOLATION_FINES as any)[r.violationType][r.severity];
      }
    });

    const monthlyTrend = Array.from(monthlyTrendMap.entries()).map(([month, v]) => ({ month, ...v }));

    const dashboard = {
      totalReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      duplicateReports,
      processedToday,
      approvedToday,
      rejectedToday,
      averageProcessingTime,
      reportsByViolationType: reportsByViolationType.reduce((acc, item) => {
        acc[item.violationType] = item._count.violationType;
        return acc;
      }, {} as Record<string, number>),
      reportsByCity: reportsByCity.reduce((acc, item) => {
        acc[item.city] = item._count.city;
        return acc;
      }, {} as Record<string, number>),
      reportsByStatus: reportsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      weeklyTrend,
      monthlyTrend
    };
    
    res.json({
      success: true,
      data: dashboard
    });
  });
  
  // Get violation type statistics
  getViolationTypeStats = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo, city } = req.query;
    
    // Build date filters
    const dateFilters: any = {};
    if (dateFrom) {
      dateFilters.gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      dateFilters.lte = new Date(dateTo as string);
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    if (city) {
      whereClause.city = city;
    }
    
    // Get current period stats
    const currentPeriodStats = await prisma.violationReport.groupBy({
      by: ['violationType'],
      where: whereClause,
      _count: { violationType: true }
    });
    
    // Get total count for percentage calculation
    const totalCount = await prisma.violationReport.count({ where: whereClause });
    
    // Calculate previous period for trend analysis
    const previousPeriodStats = await prisma.violationReport.groupBy({
      by: ['violationType'],
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date((dateFrom ? new Date(dateFrom as string) : new Date()).getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before
          lt: dateFrom ? new Date(dateFrom as string) : new Date()
        }
      },
      _count: { violationType: true }
    });
    
    const violationTypeStats = currentPeriodStats.map(current => {
      const previous = previousPeriodStats.find(p => p.violationType === current.violationType);
      const previousCount = previous ? previous._count.violationType : 0;
      const trend = current._count.violationType > previousCount ? 'up' : 
                   current._count.violationType < previousCount ? 'down' : 'stable';
      
      return {
        violationType: current.violationType,
        count: current._count.violationType,
        percentage: totalCount > 0 ? Math.round((current._count.violationType / totalCount) * 100 * 100) / 100 : 0,
        trend,
        previousPeriod: previousCount
      };
    });
    
    res.json({
      success: true,
      data: violationTypeStats
    });
  });
  
  // Get geographic statistics
  getGeographicStats = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo, includeAllHotspots, days } = req.query as any;
    
    // Build date filters
    let dateFilters: any = {};
    if (dateFrom && dateTo) {
      dateFilters = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string)
      };
    } else if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(days));
      dateFilters = { gte: daysAgo };
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    
    // Get geographic stats by city/district
    const geographicStats = await prisma.violationReport.groupBy({
      by: ['city', 'district'],
      where: whereClause,
      _count: { id: true }
    });
    
    // Get status counts for each city/district
    const statusStats = await prisma.violationReport.groupBy({
      by: ['city', 'district', 'status'],
      where: whereClause,
      _count: { id: true }
    });

    // Get all reports for hotspot clustering and individual violations
    const allReports = await prisma.violationReport.findMany({
      where: whereClause,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        addressEncrypted: true,
        city: true,
        district: true,
        violationType: true,
        status: true,
        severity: true,
        timestamp: true
      }
    });

    // Function to cluster nearby coordinates (within ~500m radius)
    const clusterCoordinates = (reports: any[], radius = 0.005) => {
      const clusters: any[] = [];
      
      reports.forEach(report => {
        let addedToCluster = false;
        
        for (const cluster of clusters) {
          const distance = Math.sqrt(
            Math.pow(report.latitude - cluster.centerLat, 2) + 
            Math.pow(report.longitude - cluster.centerLng, 2)
          );
          
          if (distance <= radius) {
            cluster.reports.push(report);
            cluster.centerLat = (cluster.centerLat * cluster.reports.length + report.latitude) / (cluster.reports.length + 1);
            cluster.centerLng = (cluster.centerLng * cluster.reports.length + report.longitude) / (cluster.reports.length + 1);
            addedToCluster = true;
            break;
          }
        }
        
        if (!addedToCluster) {
          clusters.push({
            centerLat: report.latitude,
            centerLng: report.longitude,
            reports: [report],
            city: report.city,
            district: report.district
          });
        }
      });
      
      return clusters;
    };

    const result = geographicStats.map(stat => {
      const isAll = String(includeAllHotspots).toLowerCase() === 'true';
      
      // Get reports for this city
      const cityReports = allReports.filter(r => r.city === stat.city);
      
      // Cluster reports into hotspots
      const cityClusters = clusterCoordinates(cityReports);
      
      // Convert clusters to hotspots
      const cityHotspots = cityClusters
        .map(cluster => {
          const violationTypes = [...new Set(cluster.reports.map((r: any) => r.violationType))];
          const statusCounts = cluster.reports.reduce((acc: any, r: any) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
          }, {});
          
          return {
            latitude: cluster.centerLat,
            longitude: cluster.centerLng,
                              address: cluster.reports[0]?.addressEncrypted || 'Unknown Location',
            violationCount: cluster.reports.length,
            violationTypes: violationTypes,
            statusCounts: statusCounts,
            district: cluster.district
          };
        })
        .sort((a, b) => b.violationCount - a.violationCount);
      
      // Generate individual violations for this city
      const individualViolations = cityReports.map(report => ({
        latitude: report.latitude,
        longitude: report.longitude,
                      address: report.addressEncrypted || 'Unknown Location',
        violationType: report.violationType,
        status: report.status,
        severity: report.severity,
        timestamp: report.timestamp,
        district: report.district,
        isIndividual: true
      }));
      
      // Always return all hotspots to ensure sum equals total violations
      const limitedHotspots = cityHotspots;
      
      // Calculate status counts for this city/district
      const cityStatusStats = statusStats.filter(s => s.city === stat.city && s.district === stat.district);
      const approved = cityStatusStats.find(s => s.status === 'APPROVED')?._count.id || 0;
      const rejected = cityStatusStats.find(s => s.status === 'REJECTED')?._count.id || 0;
      const pending = cityStatusStats.find(s => s.status === 'PENDING')?._count.id || 0;
      
      return {
        city: stat.city,
        district: stat.district,
        reports: stat._count.id,
        approved,
        rejected,
        pending,
        hotspots: limitedHotspots,
        individualViolations: individualViolations,
        totalHotspots: cityHotspots.length,
        totalIndividualViolations: individualViolations.length
      };
    });
    
    res.json({
      success: true,
      data: result
    });
  });
  
  // Get officer performance
  getOfficerPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo, limit = 15 } = req.query;
    
    // Build date filters
    const dateFilters: any = {};
    if (dateFrom) {
      dateFilters.gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      dateFilters.lte = new Date(dateTo as string);
    }
    
    // Build where clause for reports
    const reportWhereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      reportWhereClause.createdAt = dateFilters;
    }
    
    // Get officer performance data
    const officers = await prisma.police.findMany({
      where: {
        role: { in: ['OFFICER', 'SUPERVISOR'] }
      },
      select: {
        id: true,
        name: true,
        badgeNumber: true,
        department: true,
        city: true
      }
    });
    
    const performanceData = await Promise.all(
      officers.map(async (officer) => {
        const reports = await prisma.violationReport.findMany({
          where: {
            ...reportWhereClause,
            reviewerId: officer.id
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            reviewTimestamp: true,
            challanIssued: true
          }
        });
        
        const reportsProcessed = reports.length;
        const approvedReports = reports.filter(r => r.status === 'APPROVED').length;
        const rejectedReports = reports.filter(r => r.status === 'REJECTED').length;
        const challansIssued = reports.filter(r => r.challanIssued).length;
        
        // Calculate average processing time
        const processedReports = reports.filter(r => r.reviewTimestamp);
        let averageProcessingTime = 0;
        if (processedReports.length > 0) {
          const totalTime = processedReports.reduce((sum, report) => {
            const processingTime = report.reviewTimestamp!.getTime() - report.createdAt.getTime();
            return sum + processingTime;
          }, 0);
          averageProcessingTime = Math.round(totalTime / processedReports.length / 1000); // Convert to seconds
        }
        
        const approvalRate = reportsProcessed > 0 ? approvedReports / reportsProcessed : 0;
        const accuracyRate = 0.92; // Mock accuracy rate - would need actual calculation based on appeals/reversals
        
        return {
          officerId: officer.id,
          officerName: officer.name,
          badgeNumber: officer.badgeNumber,
          reportsProcessed,
          processed: reportsProcessed,
          approved: approvedReports,
          rejected: rejectedReports,
          averageProcessingTime,
          approvalRate: Math.round(approvalRate * 100) / 100,
          accuracyRate,
          challansIssued,
          department: officer.department,
          city: officer.city
        };
      })
    );
    
    // Sort by reports processed and limit results
    const sortedPerformance = performanceData
      .sort((a, b) => b.reportsProcessed - a.reportsProcessed)
      .slice(0, Number(limit));
    
    res.json({
      success: true,
      data: sortedPerformance
    });
  });
  
  // Get vehicle information
  getVehicleInfo = asyncHandler(async (req: Request, res: Response) => {
    const { number } = req.params;
    
    const vehicleInfo = await mockDataService.getVehicleInfo(number);
    
    if (!vehicleInfo) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle information not found'
      });
    }
    
    res.json({
      success: true,
      data: vehicleInfo
    });
  });

  // ===== ENHANCED DASHBOARD ENDPOINTS WITH FLEXIBLE TIME RANGES =====

  // Get dashboard overview with flexible time range
  getDashboardOverview = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo, city, days = 30 } = req.query;
    
    // Build date filters
    let dateFilters: any = {};
    if (dateFrom && dateTo) {
      dateFilters = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string)
      };
    } else if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(days));
      dateFilters = { gte: daysAgo };
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    if (city) {
      whereClause.city = city;
    }
    
    // Get today's date for today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayWhereClause = {
      ...whereClause,
      createdAt: {
        ...whereClause.createdAt,
        gte: today,
        lt: tomorrow
      }
    };
    
    const [
      totalReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      duplicateReports,
      processedToday,
      approvedToday,
      rejectedToday,
      reportsByViolationType,
      reportsByCity,
      reportsByStatus
    ] = await Promise.all([
      prisma.violationReport.count({ where: whereClause }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'PENDING' } }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'APPROVED' } }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'REJECTED' } }),
      prisma.violationReport.count({ where: { ...whereClause, status: 'DUPLICATE' } }),
      prisma.violationReport.count({ where: todayWhereClause }),
      prisma.violationReport.count({ where: { ...todayWhereClause, status: 'APPROVED' } }),
      prisma.violationReport.count({ where: { ...todayWhereClause, status: 'REJECTED' } }),
      prisma.violationReport.groupBy({
        by: ['violationType'],
        where: whereClause,
        _count: { violationType: true }
      }),
      prisma.violationReport.groupBy({
        by: ['city'],
        where: whereClause,
        _count: { city: true }
      }),
      prisma.violationReport.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      })
    ]);
    
    // Calculate average processing time
    const processedReports = await prisma.violationReport.findMany({
      where: {
        ...whereClause,
        reviewTimestamp: { not: null }
      },
      select: {
        createdAt: true,
        reviewTimestamp: true
      }
    });
    
    let averageProcessingTime = 0;
    if (processedReports.length > 0) {
      const totalTime = processedReports.reduce((sum, report) => {
        const processingTime = report.reviewTimestamp!.getTime() - report.createdAt.getTime();
        return sum + processingTime;
      }, 0);
      averageProcessingTime = Math.round(totalTime / processedReports.length / 1000);
    }

    const overview = {
      totalReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      duplicateReports,
      processedToday,
      approvedToday,
      rejectedToday,
      averageProcessingTime,
      reportsByViolationType: reportsByViolationType.reduce((acc: any, item) => {
        acc[item.violationType] = item._count.violationType;
        return acc;
      }, {}),
      reportsByCity: reportsByCity.reduce((acc: any, item) => {
        acc[item.city] = item._count.city;
        return acc;
      }, {}),
      reportsByStatus: reportsByStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: overview,
      meta: {
        timeRange: {
          dateFrom: dateFilters.gte,
          dateTo: dateFilters.lte,
          days: days
        }
      }
    });
  });

  // Get weekly trend with flexible days
  getWeeklyTrend = asyncHandler(async (req: Request, res: Response) => {
    const { days = 7, city, dateFrom, dateTo } = req.query;
    
    // Build date filters
    let dateFilters: any = {};
    if (dateFrom && dateTo) {
      dateFilters = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string)
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setHours(0, 0, 0, 0);
      daysAgo.setDate(daysAgo.getDate() - Number(days) + 1);
      dateFilters = { gte: daysAgo };
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    if (city) {
      whereClause.city = city;
    }

    const reports = await prisma.violationReport.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        status: true,
        violationType: true,
        severity: true
      }
    });

    // Calculate start date for trend
    const startDate = dateFilters.gte || new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const trend = Array.from({ length: Number(days) }).map((_, idx) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + idx);
      const dayStart = new Date(day); 
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); 
      dayEnd.setHours(23, 59, 59, 999);

      const items = reports.filter(r => r.createdAt >= dayStart && r.createdAt <= dayEnd);
      const reportsCount = items.length;
      const approved = items.filter(r => r.status === 'APPROVED').length;
      const rejected = items.filter(r => r.status === 'REJECTED').length;
      const pending = items.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;
      const revenue = items
        .filter(r => r.status === 'APPROVED' && r.violationType && r.severity && (VIOLATION_FINES as any)[r.violationType] && (VIOLATION_FINES as any)[r.violationType][r.severity])
        .reduce((sum, r: any) => sum + (VIOLATION_FINES as any)[r.violationType][r.severity], 0);
      
      return {
        date: dayStart.toISOString().split('T')[0],
        reports: reportsCount,
        approved,
        rejected,
        pending,
        revenue
      };
    });

    res.json({
      success: true,
      data: trend,
      meta: {
        timeRange: {
          days: Number(days),
          dateFrom: dateFilters.gte,
          dateTo: dateFilters.lte
        }
      }
    });
  });

  // Get monthly trend with flexible months
  getMonthlyTrend = asyncHandler(async (req: Request, res: Response) => {
    const { months = 12, city, dateFrom, dateTo } = req.query;
    
    // Build date filters
    let dateFilters: any = {};
    if (dateFrom && dateTo) {
      dateFilters = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string)
      };
    } else {
      const startOfThisMonth = new Date();
      startOfThisMonth.setDate(1);
      startOfThisMonth.setHours(0, 0, 0, 0);
      const monthsAgo = new Date(startOfThisMonth);
      monthsAgo.setMonth(monthsAgo.getMonth() - Number(months) + 1);
      dateFilters = { gte: monthsAgo };
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    if (city) {
      whereClause.city = city;
    }

    const reports = await prisma.violationReport.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        status: true,
        violationType: true,
        severity: true
      }
    });

    // Calculate start date for trend
    const startDate = dateFilters.gte || new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    const trendMap = new Map<string, { reports: number; approved: number; rejected: number; pending: number; revenue: number }>();
    
    for (let i = 0; i < Number(months); i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendMap.set(key, { reports: 0, approved: 0, rejected: 0, pending: 0, revenue: 0 });
    }

    reports.forEach((r: any) => {
      const d = r.createdAt as Date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = trendMap.get(key);
      if (entry) {
        entry.reports += 1;
        if (r.status === 'APPROVED') entry.approved += 1;
        else if (r.status === 'REJECTED') entry.rejected += 1;
        else if (r.status === 'PENDING' || r.status === 'UNDER_REVIEW') entry.pending += 1;
        if (r.status === 'APPROVED' && r.violationType && r.severity && (VIOLATION_FINES as any)[r.violationType] && (VIOLATION_FINES as any)[r.violationType][r.severity]) {
          entry.revenue += (VIOLATION_FINES as any)[r.violationType][r.severity];
        }
      }
    });

    const trend = Array.from(trendMap.entries()).map(([month, v]) => ({ month, ...v }));

    res.json({
      success: true,
      data: trend,
      meta: {
        timeRange: {
          months: Number(months),
          dateFrom: dateFilters.gte,
          dateTo: dateFilters.lte
        }
      }
    });
  });

  // Get recent activity with flexible time range
  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const { days = 7, city, limit = 20 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));
    
    const whereClause: any = {
      createdAt: { gte: daysAgo }
    };
    if (city) {
      whereClause.city = city;
    }

    const recentReports = await prisma.violationReport.findMany({
      where: whereClause,
      select: {
        id: true,
        violationType: true,
        status: true,
        createdAt: true,
        city: true,
        district: true,
        severity: true,
        citizenId: true,
        reviewerId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit)
    });

    // Get citizen and police names separately
    const citizenIds = [...new Set(recentReports.map(r => r.citizenId).filter(Boolean))];
    const reviewerIds = [...new Set(recentReports.map(r => r.reviewerId).filter(Boolean))];

    const [citizens, police] = await Promise.all([
      prisma.citizen.findMany({
        where: { id: { in: citizenIds } },
        select: { id: true, name: true }
      }),
      prisma.police.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, name: true }
      })
    ]);

    const citizenMap = new Map(citizens.map(c => [c.id, c.name]));
    const policeMap = new Map(police.map(p => [p.id, p.name]));

    const activity = recentReports.map(report => ({
      id: report.id,
      type: 'VIOLATION_REPORT',
      title: `${report.violationType} violation reported`,
      description: `${report.violationType} violation in ${report.city}, ${report.district}`,
      status: report.status,
      severity: report.severity,
      reporter: citizenMap.get(report.citizenId) || 'Anonymous',
      reviewer: report.reviewerId ? policeMap.get(report.reviewerId) || null : null,
      timestamp: report.createdAt,
      location: {
        city: report.city,
        district: report.district
      }
    }));

    res.json({
      success: true,
      data: activity,
      meta: {
        timeRange: {
          days: Number(days)
        },
        total: activity.length
      }
    });
  });

  // Get violation types trend with flexible time range
  getViolationTypesTrend = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo, city, days = 30 } = req.query;
    
    // Build date filters
    let dateFilters: any = {};
    if (dateFrom && dateTo) {
      dateFilters = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string)
      };
    } else if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(days));
      dateFilters = { gte: daysAgo };
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    if (city) {
      whereClause.city = city;
    }

    const violationTypesData = await prisma.violationReport.groupBy({
      by: ['violationType', 'status'],
      where: whereClause,
      _count: { violationType: true }
    });

    // Group by violation type
    const trend = violationTypesData.reduce((acc: any, item) => {
      if (!acc[item.violationType]) {
        acc[item.violationType] = {
          violationType: item.violationType,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        };
      }
      
      acc[item.violationType].total += item._count.violationType;
      if (item.status === 'APPROVED') {
        acc[item.violationType].approved += item._count.violationType;
      } else if (item.status === 'REJECTED') {
        acc[item.violationType].rejected += item._count.violationType;
      } else if (item.status === 'PENDING' || item.status === 'UNDER_REVIEW') {
        acc[item.violationType].pending += item._count.violationType;
      }
      
      return acc;
    }, {});

    const result = Object.values(trend);

    res.json({
      success: true,
      data: result,
      meta: {
        timeRange: {
          dateFrom: dateFilters.gte,
          dateTo: dateFilters.lte,
          days: days
        }
      }
    });
  });

  // Get status distribution with flexible time range
  getStatusDistribution = asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo, city, days = 30 } = req.query;
    
    // Build date filters
    let dateFilters: any = {};
    if (dateFrom && dateTo) {
      dateFilters = {
        gte: new Date(dateFrom as string),
        lte: new Date(dateTo as string)
      };
    } else if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(days));
      dateFilters = { gte: daysAgo };
    }
    
    // Build where clause
    const whereClause: any = {};
    if (Object.keys(dateFilters).length > 0) {
      whereClause.createdAt = dateFilters;
    }
    if (city) {
      whereClause.city = city;
    }

    // Get status distribution
    const statusDistribution = await prisma.violationReport.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    });

    // Get total count for percentage calculation
    const totalReports = await prisma.violationReport.count({
      where: whereClause
    });

    // Format the response
    const distribution = statusDistribution.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: totalReports > 0 ? Math.round((item._count.status / totalReports) * 100) : 0
    }));

    // Add any missing statuses with 0 count
    const allStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    const existingStatuses = distribution.map(d => d.status);
    
    allStatuses.forEach(status => {
      if (!existingStatuses.includes(status)) {
        distribution.push({
          status,
          count: 0,
          percentage: 0
        });
      }
    });

    // Sort by count descending
    distribution.sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: distribution,
      meta: {
        total: totalReports,
        timeRange: {
          dateFrom: dateFilters.gte,
          dateTo: dateFilters.lte,
          days: days
        }
      }
    });
  });
}

