import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { MockDataService } from '../services/mockDataService';
import { SmsService } from '../services/smsService';
import { APP_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { ReportFilters, UpdateReportStatusRequest } from '../types/reports';

const mockDataService = new MockDataService();
const smsService = new SmsService();

export class PoliceController {
  // Get police profile
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
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
    
    res.json({
      success: true,
      data: user
    });
  });
  
  // Update police profile
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { name, department } = req.body;
    
    const user = await prisma.user.update({
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
      dateFrom,
      dateTo,
      vehicleNumber,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filters: any = {};
    
    if (status) filters.status = status;
    if (city) filters.city = city;
    if (violationType) filters.violationType = violationType;
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
    
    // Transform reports to match expected response format
    const transformedReports = reports.map(report => ({
      id: report.id,
      violationType: report.violationType,
      severity: report.severity,
      description: report.description,
      timestamp: report.timestamp,
      latitude: report.latitude,
      longitude: report.longitude,
      address: report.addressEncrypted,
      city: report.city,
      vehicleNumber: report.vehicleNumberEncrypted,
      vehicleType: report.vehicleType,
      status: report.status,
      photoUrl: report.photoUrl,
      videoUrl: report.videoUrl,
      citizen: {
        id: report.citizen.id,
        name: report.citizen.name,
        phoneNumber: report.citizen.phoneNumberEncrypted,
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
      address: report.addressEncrypted,
      city: report.city,
      vehicleNumber: report.vehicleNumberEncrypted,
      vehicleType: report.vehicleType,
      status: report.status,
      photoUrl: report.photoUrl,
      videoUrl: report.videoUrl,
      citizen: {
        id: report.citizen.id,
        name: report.citizen.name,
        phoneNumber: report.citizen.phoneNumberEncrypted,
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
    const { status, reviewNotes, challanIssued, challanNumber }: UpdateReportStatusRequest = req.body;
    const reviewerId = req.user.id;
    
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
    if (status === 'APPROVED') {
      pointsAwarded = APP_CONSTANTS.POINTS_PER_APPROVED_REPORT;
      
      // Check if this is the first reporter
      const existingReports = await prisma.violationReport.findMany({
        where: {
          violationType: report.violationType,
          latitude: {
            gte: report.latitude - 0.001,
            lte: report.latitude + 0.001
          },
          longitude: {
            gte: report.longitude - 0.001,
            lte: report.longitude + 0.001
          },
          timestamp: {
            gte: new Date(report.timestamp.getTime() - 30 * 60 * 1000), // 30 minutes before
            lte: new Date(report.timestamp.getTime() + 30 * 60 * 1000)  // 30 minutes after
          },
          status: 'APPROVED'
        }
      });
      
      if (existingReports.length === 0) {
        pointsAwarded += APP_CONSTANTS.BONUS_POINTS_FIRST_REPORTER;
      }
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
        pointsAwarded
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
    
    // Update citizen stats if approved/rejected
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
        phoneNumber: updatedReport.citizen.phoneNumberEncrypted
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
      }, {} as Record<string, number>)
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
    const { dateFrom, dateTo } = req.query;
    
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
    
    // Get geographic stats
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
    
    // Get hotspots for each city
    const hotspots = await prisma.violationReport.groupBy({
      by: ['latitude', 'longitude', 'addressEncrypted', 'city'],
      where: whereClause,
      _count: { id: true }
    });
    
    const result = geographicStats.map(stat => {
      const cityHotspots = hotspots
        .filter(h => h.city === stat.city)
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 5) // Top 5 hotspots
        .map(hotspot => ({
          latitude: hotspot.latitude,
          longitude: hotspot.longitude,
          address: hotspot.addressEncrypted,
          violationCount: hotspot._count.id,
          violationTypes: [] // Would need additional query to get violation types for this location
        }));
      
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
        hotspots: cityHotspots
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
    const officers = await prisma.user.findMany({
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
}

