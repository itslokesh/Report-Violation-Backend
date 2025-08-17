import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../utils/jwt';
import { prisma } from '../utils/database';
import { ERROR_MESSAGES } from '../utils/constants';

export interface AuthRequest extends Request {
  user?: any;
}

const jwtService = new JwtService();

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED 
      });
    }
    
    const decoded = jwtService.verifyToken(token);
    
    if (decoded.type === 'citizen') {
      const citizen = await prisma.citizen.findUnique({
        where: { id: decoded.userId }
      });
      
      if (!citizen || !citizen.isActive) {
        return res.status(401).json({ 
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED 
        });
      }
      
      req.user = citizen;
    } else if (decoded.type === 'police') {
      const user = await prisma.police.findUnique({
        where: { id: decoded.userId }
      });
      
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED 
        });
      }
      
      req.user = user;
    } else {
      return res.status(401).json({ 
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED 
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED 
    });
  }
};

export const policeAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authMiddleware(req, res, () => {});
    
    if (req.user && req.user.role) {
      // This is a police user
      next();
    } else {
      return res.status(403).json({ 
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN 
      });
    }
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED 
    });
  }
};

export const citizenAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authMiddleware(req, res, () => {});
    
    if (req.user && !req.user.role) {
      // This is a citizen user
      next();
    } else {
      return res.status(403).json({ 
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN 
      });
    }
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED 
    });
  }
};

export const adminAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await policeAuthMiddleware(req, res, () => {});
    
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ 
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN 
      });
    }
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED 
    });
  }
};

