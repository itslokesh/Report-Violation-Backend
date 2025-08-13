export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface VehicleInfo {
  owner: {
    name: string;
    address: string;
    phone: string;
    licenseNumber: string;
  };
  vehicle: {
    type: string;
    model: string;
    color: string;
    registrationDate: string;
  };
  previousViolations: Array<{
    date: string;
    violationType: string;
    fineAmount: number;
    status: string;
  }>;
}

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  duplicateReports: number;
  totalCitizens: number;
  totalPoints: number;
  reportsByViolationType: Record<string, number>;
  reportsByCity: Record<string, number>;
  reportsByStatus: Record<string, number>;
  recentReports: any[];
}
