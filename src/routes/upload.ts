import { Router, Request, Response } from 'express';
import { FileUploadService } from '../services/fileUpload';
import { uploadImage, uploadVideo, handleUploadError, validateFileUpload } from '../middleware/upload';
import { authMiddleware } from '../middleware/auth';
import { SUCCESS_MESSAGES } from '../utils/constants';

const router = Router();
const fileUploadService = new FileUploadService();

// Apply auth dynamically per request so env flag takes effect reliably
router.use((req, res, next) => {
	if (process.env.PROTOTYPE_NO_AUTH === 'true') {
		return next();
	}
	return authMiddleware(req as any, res as any, next as any);
});

// Upload photo
router.post('/photo', 
  uploadImage, 
  handleUploadError,
  validateFileUpload,
  async (req, res) => {
    try {
      const result = await fileUploadService.uploadImage(req.file!);
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'upload_photo',
        userId: (req as any).user?.id,
        filename: result.filename,
        size: result.size
      }));
      
      res.json({
        success: true,
        data: result,
        message: SUCCESS_MESSAGES.FILE_UPLOADED
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to upload photo'
      });
    }
  }
);

// Upload video
router.post('/video', 
  uploadVideo, 
  handleUploadError,
  validateFileUpload,
  async (req, res) => {
    try {
      const result = await fileUploadService.uploadVideo(req.file!);
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'upload_video',
        userId: (req as any).user?.id,
        filename: result.filename,
        size: result.size
      }));
      
      res.json({
        success: true,
        data: result,
        message: SUCCESS_MESSAGES.FILE_UPLOADED
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to upload video'
      });
    }
  }
);

export default router;

