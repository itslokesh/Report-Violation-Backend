import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController';
import { authMiddleware as authenticateToken, citizenAuthMiddleware } from '../middleware/auth';
import { validateRequest, validateQuery } from '../middleware/validation';
import { 
  createFeedbackSchema, 
  updateFeedbackSchema, 
  createFeedbackResponseSchema, 
  feedbackFiltersSchema 
} from '../validation/feedbackSchemas';

const router = Router();

// Citizen routes
router.post('/submit', 
  authenticateToken, 
  validateRequest(createFeedbackSchema), 
  FeedbackController.submitFeedback
);

router.get('/my-feedback', 
  citizenAuthMiddleware, 
  FeedbackController.getMyFeedback
);

// Police routes (require police authentication)
router.get('/', 
  authenticateToken, 
  validateQuery(feedbackFiltersSchema), 
  FeedbackController.getFeedbackList
);

router.get('/stats', 
  authenticateToken, 
  FeedbackController.getFeedbackStats
);

router.get('/analytics', 
  authenticateToken, 
  FeedbackController.getFeedbackAnalytics
);

router.get('/:id', 
  authenticateToken, 
  FeedbackController.getFeedbackById
);

router.put('/:id', 
  authenticateToken, 
  validateRequest(updateFeedbackSchema), 
  FeedbackController.updateFeedback
);

router.post('/:id/responses', 
  authenticateToken, 
  validateRequest(createFeedbackResponseSchema), 
  FeedbackController.addFeedbackResponse
);

export default router;
