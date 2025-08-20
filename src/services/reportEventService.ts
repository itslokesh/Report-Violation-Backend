import { prisma } from '../utils/database';
import { SmsService } from './smsService';

export type ReportEventType =
  | 'REPORT_SUBMITTED'
  | 'STATUS_UPDATED'
  | 'POINTS_AWARDED'
  | 'FEEDBACK_ADDED'
  | 'MEDIA_UPLOADED';

export class ReportEventService {
  private static sms = new SmsService();
  static async log(params: {
    reportId: number;
    type: ReportEventType;
    title?: string;
    description?: string;
    metadata?: any;
    citizenId?: string;
    userId?: string;
  }) {
    const { reportId, type, title, description, metadata, citizenId, userId } = params;
    // Note: requires `npx prisma generate` after schema change; using any-cast to avoid TS break until generated
    const event = await (prisma as any).reportEvent.create({
      data: {
        reportId,
        type,
        title,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        citizenId,
        userId
      }
    });
    // Fire-and-forget notification for status updates
    if (type === 'STATUS_UPDATED' && citizenId) {
      try {
        const citizen = await prisma.citizen.findUnique({ where: { id: citizenId } });
        if (citizen) {
          // Create in-app notification record
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await (prisma as any).notification.create({
            data: {
              citizenId,
              reportId,
              type: 'REPORT_STATUS',
              title: title || 'Report status updated',
              message: description || 'Your report status has changed.',
              expiresAt
            }
          });
          // Send SMS if enabled
          if (citizen.notificationEnabled && citizen.phoneNumberEncrypted) {
            await ReportEventService.sms.sendReportStatusUpdate(citizen.phoneNumberEncrypted, reportId, (metadata?.status || '').toString());
          }
        }
      } catch {}
    }
    return event;
  }
}


