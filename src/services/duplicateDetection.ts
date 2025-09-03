import { prisma } from '../utils/database';
import { Helpers } from '../utils/helpers';
import { APP_CONSTANTS } from '../utils/constants';
import { CreateReportRequest } from '../types/reports';

export class DuplicateDetectionService {
  async processReport(reportData: CreateReportRequest) {
    // Find potential duplicates
    const duplicates = await this.findPotentialDuplicates(reportData);
    
    if (duplicates.length > 0) {
      const confidenceScore = this.calculateConfidenceScore(reportData, duplicates[0]);
      
      if (confidenceScore > APP_CONSTANTS.DUPLICATE_DETECTION_CONFIDENCE_THRESHOLD) {
        return {
          ...reportData,
          isDuplicate: true,
          duplicateGroupId: duplicates[0].duplicateGroupId || duplicates[0].id.toString(),
          confidenceScore
        };
      }
    }
    
    return {
      ...reportData,
      isDuplicate: false,
      duplicateGroupId: null,
      confidenceScore: null
    };
  }
  
  private async findPotentialDuplicates(reportData: CreateReportRequest) {
    const timeWindow = APP_CONSTANTS.DUPLICATE_DETECTION_TIME_WINDOW; // minutes
    const locationRadius = APP_CONSTANTS.DUPLICATE_DETECTION_RADIUS; // ~100 meters
    const ts = (reportData as any).timestamp instanceof Date
      ? (reportData as any).timestamp as Date
      : new Date((reportData as any).timestamp);
    const violation = (reportData as any).violationType || 'OTHERS';
    
    return await prisma.violationReport.findMany({
      where: {
        violationType: violation,
        timestamp: {
          gte: new Date(ts.getTime() - timeWindow * 60 * 1000),
          lte: new Date(ts.getTime() + timeWindow * 60 * 1000)
        },
        latitude: {
          gte: reportData.latitude - locationRadius,
          lte: reportData.latitude + locationRadius
        },
        longitude: {
          gte: reportData.longitude - locationRadius,
          lte: reportData.longitude + locationRadius
        },
        status: {
          not: 'REJECTED'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
  }
  
  private calculateConfidenceScore(newReport: CreateReportRequest, existingReport: any): number {
    let score = 0;
    
    // Location similarity (50% weight)
    const locationDistance = Helpers.calculateDistance(
      newReport.latitude, newReport.longitude,
      existingReport.latitude, existingReport.longitude
    );
    if (locationDistance < 50) score += 50;
    else if (locationDistance < 100) score += 25;
    
    // Time similarity (30% weight)
    const newTs = (newReport as any).timestamp instanceof Date ? (newReport as any).timestamp : new Date((newReport as any).timestamp);
    const timeDiff = Math.abs(newTs.getTime() - existingReport.timestamp.getTime());
    if (timeDiff < 5 * 60 * 1000) score += 30; // 5 minutes
    else if (timeDiff < 15 * 60 * 1000) score += 15; // 15 minutes
    
    // Vehicle similarity (20% weight)
    const newVeh = (newReport as any).vehicleNumber;
    if (newVeh && existingReport.vehicleNumber) {
      if (newVeh.toUpperCase() === existingReport.vehicleNumber.toUpperCase()) {
        score += 20;
      }
    }
    
    return score / 100; // Normalize to 0-1
  }

  async markAsDuplicate(reportId: number, duplicateGroupId: string) {
    return await prisma.violationReport.update({
      where: { id: reportId },
      data: {
        status: 'DUPLICATE',
        isDuplicate: true,
        duplicateGroupId
      }
    });
  }

  async getDuplicateGroup(duplicateGroupId: string) {
    return await prisma.violationReport.findMany({
      where: {
        duplicateGroupId,
        status: {
          not: 'REJECTED'
        }
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            phoneNumberEncrypted: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
}

