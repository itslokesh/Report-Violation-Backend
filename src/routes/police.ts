import { Router } from 'express';
import { PoliceController } from '../controllers/policeController';
import { policeAuthMiddleware } from '../middleware/auth';
import { validateRequest, validateQuery, validateParams, schemas } from '../middleware/validation';

const router = Router();
const policeController = new PoliceController();

// Apply authentication middleware to all routes
router.use(policeAuthMiddleware);

// Profile routes
router.get('/profile', policeController.getProfile);
router.put('/profile', policeController.updateProfile);

// Report routes
router.get('/reports', 
  validateQuery(schemas.reportFilters), 
  policeController.getReports
);

router.get('/reports/:id', 
  validateParams(schemas.reportId), 
  policeController.getReport
);

router.put('/reports/:id/status', 
  validateParams(schemas.reportId),
  validateRequest(schemas.updateReportStatus), 
  policeController.updateReportStatus
);

// Dashboard routes
router.get('/dashboard', policeController.getDashboard);
router.get('/dashboard/violation-types', policeController.getViolationTypeStats);
router.get('/dashboard/geographic', policeController.getGeographicStats);
router.get('/dashboard/officer-performance', policeController.getOfficerPerformance);

// Vehicle information routes
router.get('/vehicles/:number', policeController.getVehicleInfo);

export default router;

