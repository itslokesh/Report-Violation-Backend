import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { APP_CONSTANTS, ERROR_MESSAGES } from '../utils/constants';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file size
  if (file.size && file.size > APP_CONSTANTS.MAX_FILE_SIZE) {
    return cb(new Error(ERROR_MESSAGES.FILE_TOO_LARGE));
  }

  // Check file type for images
  if (file.fieldname === 'photo') {
    if (!APP_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
      return cb(new Error(ERROR_MESSAGES.INVALID_FILE_TYPE));
    }
  }

  // Check file type for videos
  if (file.fieldname === 'video') {
    if (!APP_CONSTANTS.ALLOWED_VIDEO_TYPES.includes(file.mimetype as any)) {
      return cb(new Error(ERROR_MESSAGES.INVALID_FILE_TYPE));
    }
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: APP_CONSTANTS.MAX_FILE_SIZE,
    files: 1 // Only allow 1 file at a time
  }
});

// Middleware for single image upload
export const uploadImage = upload.single('photo');

// Middleware for single video upload
export const uploadVideo = upload.single('video');

// Middleware for multiple files (photos and videos)
export const uploadMedia = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: APP_CONSTANTS.MAX_FILE_SIZE,
    files: 5 // Allow up to 5 files
  }
}).fields([
  { name: 'photos', maxCount: 3 },
  { name: 'videos', maxCount: 2 }
]);

// Error handling middleware for multer
export const handleUploadError = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: ERROR_MESSAGES.FILE_TOO_LARGE
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files uploaded'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
    }
  }

  if (error.message.includes('File too large') || error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
};

// Validation middleware for file uploads
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  next();
};

