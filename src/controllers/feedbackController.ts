import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { CreateFeedbackRequest, UpdateFeedbackRequest, CreateFeedbackResponseRequest, FeedbackFilters, FeedbackStats, FeedbackWithResponses, FeedbackAnalytics } from '../types/feedback';

export class FeedbackController {
  // Submit feedback (for both citizens and police)
  static async submitFeedback(req: Request, res: Response) {
    try {
      const feedbackData: CreateFeedbackRequest = req.body;
      const user = (req as any).user as any;

      // Determine if feedback is from citizen or police user
      let citizenId: string | undefined;
      let userId: string | undefined;

      if (user && user.role) {
        // Police user (has role)
        userId = user.id;
      } else {
        // Citizen user (no role on model)
        citizenId = user.id;
      }

      // Create feedback
      const feedback = await prisma.feedback.create({
        data: {
          feedbackType: feedbackData.feedbackType,
          category: feedbackData.category,
          title: feedbackData.title,
          description: feedbackData.description,
          rating: feedbackData.rating,
          priority: feedbackData.priority,
          isAnonymous: feedbackData.isAnonymous || false,
          contactEmail: feedbackData.contactEmail,
          contactPhone: feedbackData.contactPhone,
          reportId: feedbackData.reportId,
          attachments: feedbackData.attachments ? JSON.stringify(feedbackData.attachments) : null,
          metadata: feedbackData.metadata ? JSON.stringify(feedbackData.metadata) : null,
          citizenId,
          userId
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              phoneNumberEncrypted: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              emailEncrypted: true,
              role: true
            }
          },
          report: {
            select: {
              id: true,
              violationType: true,
              status: true,
              city: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: {
          id: feedback.id,
          feedbackType: feedback.feedbackType,
          category: feedback.category,
          title: feedback.title,
          status: feedback.status,
          priority: feedback.priority,
          createdAt: feedback.createdAt
        },
        message: 'Feedback submitted successfully'
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback'
      });
    }
  }

  // Get feedback list (for police)
  static async getFeedbackList(req: Request, res: Response) {
    try {
      const filters: FeedbackFilters = req.query as any;
      const page = parseInt(filters.page as any) || 1;
      const limit = parseInt(filters.limit as any) || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filters.feedbackType) where.feedbackType = filters.feedbackType;
      if (filters.category) where.category = filters.category;
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.assignedTo) where.assignedTo = filters.assignedTo;
      if (filters.citizenId) where.citizenId = filters.citizenId;
      if (filters.userId) where.userId = filters.userId;
      if (filters.reportId) where.reportId = filters.reportId;

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      // Build order by
      const orderBy: any = {};
      orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';

      // Get feedback with pagination
      const [feedback, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            citizen: {
              select: {
                id: true,
                name: true,
                phoneNumberEncrypted: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                emailEncrypted: true,
                role: true
              }
            },
            report: {
              select: {
                id: true,
                violationType: true,
                status: true,
                city: true
              }
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                emailEncrypted: true,
                role: true
              }
            },
            responses: {
              include: {
                responder: {
                  select: {
                    id: true,
                    name: true,
                    emailEncrypted: true,
                    role: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        }),
        prisma.feedback.count({ where })
      ]);

      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            page,
            limit,
            total,
            pages
          }
        }
      });

    } catch (error) {
      console.error('Error getting feedback list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback list'
      });
    }
  }

  // Get feedback by ID
  static async getFeedbackById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const feedback = await prisma.feedback.findUnique({
        where: { id },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              phoneNumberEncrypted: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              emailEncrypted: true,
              role: true
            }
          },
          report: {
            select: {
              id: true,
              violationType: true,
              status: true,
              city: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              emailEncrypted: true,
              role: true
            }
          },
          responses: {
            include: {
              responder: {
                select: {
                  id: true,
                  name: true,
                  emailEncrypted: true,
                  role: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        data: feedback
      });

    } catch (error) {
      console.error('Error getting feedback by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback'
      });
    }
  }

  // Update feedback (for police)
  static async updateFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData: UpdateFeedbackRequest = req.body;

      const feedback = await prisma.feedback.findUnique({
        where: { id }
      });

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      // Update data
      const updatePayload: any = {};
      if (updateData.status) updatePayload.status = updateData.status;
      if (updateData.assignedTo) updatePayload.assignedTo = updateData.assignedTo;
      if (updateData.resolutionNotes) updatePayload.resolutionNotes = updateData.resolutionNotes;
      if (updateData.priority) updatePayload.priority = updateData.priority;

      // Set resolvedAt if status is RESOLVED
      if (updateData.status === 'RESOLVED' && feedback.status !== 'RESOLVED') {
        updatePayload.resolvedAt = new Date();
      }

      const updatedFeedback = await prisma.feedback.update({
        where: { id },
        data: updatePayload,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              phoneNumberEncrypted: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              emailEncrypted: true,
              role: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              emailEncrypted: true,
              role: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: updatedFeedback,
        message: 'Feedback updated successfully'
      });

    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback'
      });
    }
  }

  // Add response to feedback (for police)
  static async addFeedbackResponse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const responseData: CreateFeedbackResponseRequest = req.body;
      const user = (req as any).user as any;

      const feedback = await prisma.feedback.findUnique({
        where: { id }
      });

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      const response = await prisma.feedbackResponse.create({
        data: {
          feedbackId: id,
          responderId: user.id,
          message: responseData.message,
          isInternal: responseData.isInternal || false
        },
        include: {
          responder: {
            select: {
              id: true,
              name: true,
              emailEncrypted: true,
              role: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: response,
        message: 'Response added successfully'
      });

    } catch (error) {
      console.error('Error adding feedback response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add response'
      });
    }
  }

  // Get feedback statistics (for police dashboard)
  static async getFeedbackStats(req: Request, res: Response) {
    try {
      const [totalFeedback, pendingFeedback, resolvedFeedback, ratingStats] = await Promise.all([
        prisma.feedback.count(),
        prisma.feedback.count({ where: { status: 'PENDING' } }),
        prisma.feedback.count({ where: { status: 'RESOLVED' } }),
        prisma.feedback.aggregate({
          _avg: { rating: true },
          _count: { rating: true }
        })
      ]);

      // Get feedback by type
      const feedbackByType = await prisma.feedback.groupBy({
        by: ['feedbackType'],
        _count: { feedbackType: true }
      });

      // Get feedback by category
      const feedbackByCategory = await prisma.feedback.groupBy({
        by: ['category'],
        _count: { category: true }
      });

      // Get feedback by priority
      const feedbackByPriority = await prisma.feedback.groupBy({
        by: ['priority'],
        _count: { priority: true }
      });

      // Get recent feedback (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentFeedback = await prisma.feedback.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      });

      const stats: FeedbackStats = {
        totalFeedback,
        pendingFeedback,
        resolvedFeedback,
        averageRating: ratingStats._avg.rating || 0,
        feedbackByType: feedbackByType.reduce((acc, item) => {
          acc[item.feedbackType] = item._count.feedbackType;
          return acc;
        }, {} as Record<string, number>),
        feedbackByCategory: feedbackByCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {} as Record<string, number>),
        feedbackByPriority: feedbackByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.priority;
          return acc;
        }, {} as Record<string, number>),
        recentFeedback
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting feedback stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback statistics'
      });
    }
  }

  // Get feedback analytics (detailed analytics for police)
  static async getFeedbackAnalytics(req: Request, res: Response) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const where: any = {};
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
        if (dateTo) where.createdAt.lte = new Date(dateTo as string);
      }

      // Get basic stats
      const [totalFeedback, ratingStats] = await Promise.all([
        prisma.feedback.count({ where }),
        prisma.feedback.aggregate({
          where,
          _avg: { rating: true },
          _count: { rating: true }
        })
      ]);

      // Calculate satisfaction rate (4-5 star ratings)
      const highRatings = await prisma.feedback.count({
        where: {
          ...where,
          rating: { gte: 4 }
        }
      });

      const satisfactionRate = ratingStats._count.rating > 0 
        ? (highRatings / ratingStats._count.rating) * 100 
        : 0;

      // Calculate average response time (time to first response)
      const feedbackWithResponses = await prisma.feedback.findMany({
        where: {
          ...where,
          responses: { some: {} }
        },
        include: {
          responses: {
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      });

      let totalResponseTime = 0;
      let responseCount = 0;

      feedbackWithResponses.forEach(feedback => {
        if (feedback.responses.length > 0) {
          const responseTime = feedback.responses[0].createdAt.getTime() - feedback.createdAt.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      });

      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount / (1000 * 60 * 60) : 0; // in hours

      // Calculate average resolution time
      const resolvedFeedback = await prisma.feedback.findMany({
        where: {
          ...where,
          status: 'RESOLVED',
          resolvedAt: { not: null }
        }
      });

      let totalResolutionTime = 0;
      resolvedFeedback.forEach(feedback => {
        if (feedback.resolvedAt) {
          const resolutionTime = feedback.resolvedAt.getTime() - feedback.createdAt.getTime();
          totalResolutionTime += resolutionTime;
        }
      });

      const averageResolutionTime = resolvedFeedback.length > 0 
        ? totalResolutionTime / resolvedFeedback.length / (1000 * 60 * 60) 
        : 0; // in hours

      // Get feedback trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendData = await prisma.feedback.groupBy({
        by: ['createdAt'],
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { createdAt: true },
        _avg: { rating: true }
      });

      const feedbackTrend = trendData.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        count: item._count.createdAt,
        averageRating: item._avg.rating || 0
      }));

      // Get top categories
      const topCategories = await prisma.feedback.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5
      });

      // Get top issues (by title frequency)
      const topIssues = await prisma.feedback.groupBy({
        by: ['title', 'priority'],
        where,
        _count: { title: true },
        orderBy: { _count: { title: 'desc' } },
        take: 10
      });

      const analytics: FeedbackAnalytics = {
        totalFeedback,
        averageRating: ratingStats._avg.rating || 0,
        satisfactionRate,
        responseTime: averageResponseTime,
        resolutionTime: averageResolutionTime,
        feedbackTrend,
        topCategories: topCategories.map(item => ({
          category: item.category,
          count: item._count.category,
          percentage: (item._count.category / totalFeedback) * 100
        })),
        topIssues: topIssues.map(item => ({
          title: item.title,
          count: item._count.title,
          priority: item.priority
        }))
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error getting feedback analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback analytics'
      });
    }
  }

  // Get my feedback (for citizens)
  static async getMyFeedback(req: Request, res: Response) {
    try {
      const user = (req as any).user as any;
      const page = parseInt(req.query.page as any) || 1;
      const limit = parseInt(req.query.limit as any) || 20;
      const skip = (page - 1) * limit;

      // Citizen user has no role on the model; police users have role
      if (user && user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const citizenId: string = user.id;

      const [feedback, total] = await Promise.all([
        prisma.feedback.findMany({
          where: {
            OR: [
              { citizenId },
              // backward-compat: some earlier entries may have incorrectly stored citizen id in userId
              { userId: citizenId }
            ]
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            responses: {
              where: { isInternal: false }, // Only show public responses to citizens
              include: {
                responder: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        }),
        prisma.feedback.count({
          where: {
            OR: [
              { citizenId },
              { userId: citizenId }
            ]
          }
        })
      ]);

      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            page,
            limit,
            total,
            pages
          }
        }
      });

    } catch (error) {
      console.error('Error getting my feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback'
      });
    }
  }
}
