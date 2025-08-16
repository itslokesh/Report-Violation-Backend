type ViolationType = string;
type SeverityLevel = string;
type VehicleType = string;
type ReportStatus = string;

export interface CreateReportRequest {
  violationType: ViolationType;
  severity: SeverityLevel;
  description?: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  vehicleColor?: string;
  isAnonymous: boolean;
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
  reviewNotes?: string;
  challanIssued?: boolean;
  challanNumber?: string;
}

export interface ReportFilters {
  status?: ReportStatus;
  city?: string;
  violationType?: ViolationType;
  severity?: SeverityLevel;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface ReportResponse {
  id: number;
  violationType: ViolationType;
  severity: SeverityLevel;
  description?: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  district: string;
  state: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  vehicleColor?: string;
  photoUrl?: string;
  videoUrl?: string;
  status: ReportStatus;
  isDuplicate: boolean;
  confidenceScore?: number;
  reviewNotes?: string;
  challanIssued: boolean;
  challanNumber?: string;
  pointsAwarded: number;
  isFirstReporter: boolean;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  citizen: {
    id: string;
    name?: string;
    phoneNumber: string;
  };
  reviewer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
}

export interface PaginatedReportsResponse {
  reports: ReportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
