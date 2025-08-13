import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest, schemas } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

// Citizen authentication routes
router.post('/citizen/send-otp', 
  validateRequest(schemas.citizenOTP), 
  authController.sendOTP
);

router.post('/citizen/verify-otp', 
  validateRequest(schemas.citizenAuth), 
  authController.verifyOTP
);

router.post('/citizen/register', 
  validateRequest(schemas.citizenRegistration), 
  authController.registerCitizen
);

// Police authentication routes
router.post('/police/login', 
  validateRequest(schemas.policeAuth), 
  authController.policeLogin
);

// Token management routes
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;

