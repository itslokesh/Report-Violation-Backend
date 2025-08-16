export interface CreateFeedbackRequest {
  feedbackType: 'APP_FEEDBACK' | 'REPORT_FEEDBACK' | 'SERVICE_FEEDBACK' | 'FEATURE_REQUEST';
  category: 'UI_UX' | 'BUG' | 'PERFORMANCE' | 'SUGGESTION' | 'COMPLAINT' | 'PRAISE';
  title: string;
  description: string;
  rating?: number; // 1-5
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isAnonymous?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  reportId?: number; // If feedback related to specific report
  attachments?: string[]; // File URLs
  metadata?: Record<string, any>;
}

export interface UpdateFeedbackRequest {
  status?: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  resolutionNotes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CreateFeedbackResponseRequest {
  message: string;
  isInternal?: boolean;
}

export interface FeedbackFilters {
  feedbackType?: string;
  category?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  citizenId?: string;
  userId?: string;
  reportId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FeedbackStats {
  totalFeedback: number;
  pendingFeedback: number;
  resolvedFeedback: number;
  averageRating: number;
  feedbackByType: Record<string, number>;
  feedbackByCategory: Record<string, number>;
  feedbackByPriority: Record<string, number>;
  recentFeedback: number; // Last 7 days
}

export interface FeedbackWithResponses {
  id: string;
  feedbackType: string;
  category: string;
  title: string;
  description: string;
  rating?: number;
  priority: string;
  status: string;
  isAnonymous: boolean;
  contactEmail?: string;
  contactPhone?: string;
  attachments?: string;
  metadata?: string;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relationships
  citizenId?: string;
  userId?: string;
  reportId?: number;
  
  // Related data
  citizen?: {
    id: string;
    name?: string;
    phoneNumberEncrypted: string;
  };
  user?: {
    id: string;
    name: string;
    emailEncrypted: string;
    role: string;
  };
  report?: {
    id: number;
    violationType: string;
    status: string;
    city: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    emailEncrypted: string;
    role: string;
  };
  
  // Responses
  responses: FeedbackResponse[];
}

export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  responderId: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
  
  responder: {
    id: string;
    name: string;
    emailEncrypted: string;
    role: string;
  };
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  satisfactionRate: number; // Percentage of 4-5 star ratings
  responseTime: number; // Average time to first response in hours
  resolutionTime: number; // Average time to resolution in hours
  feedbackTrend: {
    date: string;
    count: number;
    averageRating: number;
  }[];
  topCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  topIssues: {
    title: string;
    count: number;
    priority: string;
  }[];
}
