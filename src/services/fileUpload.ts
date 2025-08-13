import * as admin from 'firebase-admin';
import { UploadResponse } from '../types/api';
import { APP_CONSTANTS } from '../utils/constants';

export class FileUploadService {
  private bucket: any;

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail || 
        projectId === 'your-project-id' || 
        privateKey === 'your-private-key' || 
        clientEmail === 'your-client-email') {
      console.warn('Firebase credentials not configured. File upload service will be mocked.');
      this.bucket = null;
      return;
    }

    try {
      if (!admin.apps.length) {
        const serviceAccount = {
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          storageBucket: `${projectId}.appspot.com`
        });
      }

      this.bucket = admin.storage().bucket();
    } catch (error) {
      console.warn('Firebase initialization failed. File upload service will be mocked.');
      this.bucket = null;
    }
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'violations'): Promise<UploadResponse> {
    try {
      if (!APP_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
        throw new Error('Invalid image type');
      }

      if (file.size > APP_CONSTANTS.MAX_FILE_SIZE) {
        throw new Error('File too large');
      }

      if (!this.bucket) {
        // Mock upload for development
        const filename = `${folder}/images/${Date.now()}_${file.originalname}`;
        console.log(`[MOCK UPLOAD] Image: ${filename}, Size: ${file.size} bytes`);
        
        return {
          url: `https://mock-storage.com/${filename}`,
          filename: filename,
          size: file.size,
          mimeType: file.mimetype,
        };
      }

      const filename = `${folder}/images/${Date.now()}_${file.originalname}`;
      const fileBuffer = file.buffer;

      const fileUpload = this.bucket.file(filename);
      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype,
        },
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filename}`;

      return {
        url: publicUrl,
        filename: filename,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image');
    }
  }

  async uploadVideo(file: Express.Multer.File, folder: string = 'violations'): Promise<UploadResponse> {
    try {
      if (!APP_CONSTANTS.ALLOWED_VIDEO_TYPES.includes(file.mimetype as any)) {
        throw new Error('Invalid video type');
      }

      if (file.size > APP_CONSTANTS.MAX_FILE_SIZE) {
        throw new Error('File too large');
      }

      if (!this.bucket) {
        // Mock upload for development
        const filename = `${folder}/videos/${Date.now()}_${file.originalname}`;
        console.log(`[MOCK UPLOAD] Video: ${filename}, Size: ${file.size} bytes`);
        
        return {
          url: `https://mock-storage.com/${filename}`,
          filename: filename,
          size: file.size,
          mimeType: file.mimetype,
        };
      }

      const filename = `${folder}/videos/${Date.now()}_${file.originalname}`;
      const fileBuffer = file.buffer;

      const fileUpload = this.bucket.file(filename);
      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype,
        },
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filename}`;

      return {
        url: publicUrl,
        filename: filename,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('Video upload failed:', error);
      throw new Error('Failed to upload video');
    }
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      await this.bucket.file(filename).delete();
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  async getFileMetadata(filename: string): Promise<any> {
    try {
      const [metadata] = await this.bucket.file(filename).getMetadata();
      return metadata;
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

