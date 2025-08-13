import { Router } from 'express';
import { CitizenController } from '../controllers/citizenController';
import { citizenAuthMiddleware } from '../middleware/auth';
import { validateRequest, validateQuery, validateParams, schemas } from '../middleware/validation';

const router = Router();
const citizenController = new CitizenController();

// Apply authentication middleware to all routes
router.use(citizenAuthMiddleware);

// Profile routes
router.get('/profile', citizenController.getProfile);
router.put('/profile', citizenController.updateProfile);

// Report routes
router.post('/reports', 
  validateRequest(schemas.createReport), 
  citizenController.submitReport
);

router.get('/reports', 
  validateQuery(schemas.pagination), 
  citizenController.getMyReports
);

router.get('/reports/:id', 
  validateParams(schemas.reportId), 
  citizenController.getReport
);

// Rewards routes
router.get('/rewards', citizenController.getRewards);

// Duplicate group routes
router.get('/duplicates/:duplicateGroupId', citizenController.getDuplicateGroup);

export default router;

