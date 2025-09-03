export const APP_CONSTANTS = {
  OTP_EXPIRY_MINUTES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov'],
  MAX_REPORTS_PER_DAY: 50,
  POINTS_PER_APPROVED_REPORT: 100,
  DUPLICATE_DETECTION_RADIUS: 0.001, // ~100 meters
  DUPLICATE_DETECTION_TIME_WINDOW: 30, // minutes
  DUPLICATE_DETECTION_CONFIDENCE_THRESHOLD: 0.7,
  LOCAL_SERVER_URL: `http://localhost:${process.env.PORT || 3000}`,
} as const;

export const ERROR_MESSAGES = {
  INVALID_PHONE_NUMBER: 'Invalid phone number format. Use +91-XXXXXXXXXX',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_OTP: 'Invalid or expired OTP',
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  DUPLICATE_REPORT: 'Similar report already exists',
} as const;

export const SUCCESS_MESSAGES = {
  OTP_SENT: 'OTP sent successfully',
  LOGIN_SUCCESS: 'Login successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  REPORT_SUBMITTED: 'Report submitted successfully',
  REPORT_UPDATED: 'Report updated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  LOGOUT_SUCCESS: 'Logout successful',
} as const;

export const VIOLATION_FINES = {
  SPEED_VIOLATION: { MINOR: 1000, MAJOR: 1500, CRITICAL: 2000 },
  SIGNAL_JUMPING: { MINOR: 500, MAJOR: 750, CRITICAL: 1000 },
  WRONG_SIDE_DRIVING: { MINOR: 2000, MAJOR: 3000, CRITICAL: 5000 },
  NO_PARKING_ZONE: { MINOR: 300, MAJOR: 500, CRITICAL: 1000 },
  HELMET_SEATBELT_VIOLATION: { MINOR: 1000, MAJOR: 1500, CRITICAL: 2000 },
  MOBILE_PHONE_USAGE: { MINOR: 1000, MAJOR: 1500, CRITICAL: 2000 },
  LANE_CUTTING: { MINOR: 500, MAJOR: 750, CRITICAL: 1000 },
  DRUNK_DRIVING_SUSPECTED: { MINOR: 5000, MAJOR: 7500, CRITICAL: 10000 },
  OTHERS: { MINOR: 500, MAJOR: 750, CRITICAL: 1000 },
} as const;

/**
 * Converts a relative upload path to a full localhost URL
 * @param relativePath - The relative path (e.g., /uploads/violations/images/filename.jpg)
 * @returns Full localhost URL
 */
export const getLocalhostUrl = (relativePath: string): string => {
  if (!relativePath) return relativePath;
  
  // If it's already a full URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Ensure the path starts with /uploads
  const cleanPath = relativePath.startsWith('/uploads') ? relativePath : `/uploads/${relativePath}`;
  
  return `${APP_CONSTANTS.LOCAL_SERVER_URL}${cleanPath}`;
};

/**
 * Converts any existing IP-based media URLs to localhost URLs
 * This is useful for backward compatibility with existing data
 * @param url - The URL to convert
 * @returns Converted localhost URL
 */
export const convertToLocalhostUrl = (url: string): string => {
  if (!url) return url;
  
  // If it's already a localhost URL, return as is
  if (url.includes('localhost')) return url;
  
  // If it's a relative path, convert to localhost
  if (url.startsWith('/uploads')) {
    return getLocalhostUrl(url);
  }
  
  // If it's an IP-based URL, extract the path and convert to localhost
  if (url.includes('/uploads/')) {
    const pathMatch = url.match(/\/uploads\/.*/);
    if (pathMatch) {
      return getLocalhostUrl(pathMatch[0]);
    }
  }
  
  // If it's a Firebase URL, return as is
  if (url.includes('storage.googleapis.com')) {
    return url;
  }
  
  // Default case: return as is
  return url;
};

