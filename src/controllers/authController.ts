import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { JwtService } from '../utils/jwt';
import { SmsService } from '../services/smsService';
import { Helpers } from '../utils/helpers';
import { APP_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

const jwtService = new JwtService();
const smsService = new SmsService();

export class AuthController {
  // Send OTP to citizen phone number
  sendOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber } = req.body;
    
    // Validate phone number
    if (!Helpers.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_PHONE_NUMBER
      });
    }
    
    // Generate OTP
    const otp = Helpers.generateOTP();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'send_otp',
      phoneNumber,
      otp
    }));
    const expiresAt = new Date(Date.now() + APP_CONSTANTS.OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Delete any existing OTP for this phone number
    await prisma.oTP.deleteMany({
      where: { phoneNumberEncrypted: phoneNumber }
    });
    
    // Save OTP to database
    await prisma.oTP.create({
      data: {
        phoneNumberEncrypted: phoneNumber,
        phoneNumberHash: phoneNumber,
        otp,
        expiresAt
      }
    });
    
    // Send OTP via SMS
    await smsService.sendOTP(phoneNumber, otp);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.OTP_SENT
    });
  });
  
  // Verify OTP and authenticate citizen
  verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, otp } = req.body;
    const devBypassCode = process.env.OTP_DEV_CODE;
    const isDevBypass = devBypassCode && otp === devBypassCode;
    
    // Find valid OTP (skip when dev bypass code matches)
    const otpRecord = isDevBypass ? null : await prisma.oTP.findFirst({
      where: {
        phoneNumberEncrypted: phoneNumber,
        otp,
        expiresAt: { gt: new Date() },
        isUsed: false
      }
    });
    
    if (!otpRecord && !isDevBypass) {
      console.warn(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'verify_otp_failed',
        phoneNumber,
        otp
      }));
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_OTP
      });
    }
    
    // Mark OTP as used (only when not dev bypass)
    if (otpRecord) {
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });
    }
    
    // Find or create citizen
    let citizen = await prisma.citizen.findUnique({
      where: { phoneNumberEncrypted: phoneNumber }
    });
    
    if (!citizen) {
      citizen = await prisma.citizen.create({
        data: {
          phoneNumberEncrypted: phoneNumber,
          phoneNumberHash: phoneNumber,
          isPhoneVerified: true
        }
      });
    } else {
      citizen = await prisma.citizen.update({
        where: { id: citizen.id },
        data: { 
          isPhoneVerified: true,
          lastLoginAt: new Date()
        }
      });
    }
    
    // Generate JWT tokens
    const token = jwtService.generateToken({
      userId: citizen.id,
      type: 'citizen'
    });
    
    const refreshToken = jwtService.generateRefreshToken({
      userId: citizen.id,
      type: 'citizen'
    });
    
    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: citizen
      },
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS
    });
  });
  
  // Register citizen with complete profile
  registerCitizen = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, name, email, registeredCity, registeredPincode, registeredDistrict, registeredState } = req.body as any;
    
    // Check if citizen already exists
    const existingCitizen = await prisma.citizen.findUnique({
      where: { phoneNumberEncrypted: phoneNumber }
    });
    
    if (!existingCitizen) {
      return res.status(400).json({
        success: false,
        error: 'Citizen not found. Please verify OTP first.'
      });
    }
    
    // Update citizen profile
    const citizen = await prisma.citizen.update({
      where: { id: existingCitizen.id },
      data: {
        name,
        emailEncrypted: email,
        emailHash: email,
        isPhoneVerified: true,
        ...(registeredCity ? { } : {}),
        ...(registeredPincode ? { } : {}),
        ...(registeredDistrict ? { } : {}),
        ...(registeredState ? { } : {})
      }
    });
    
    // Generate new tokens
    const token = jwtService.generateToken({
      userId: citizen.id,
      type: 'citizen'
    });
    
    const refreshToken = jwtService.generateRefreshToken({
      userId: citizen.id,
      type: 'citizen'
    });
    
    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: citizen
      },
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS
    });
  });
  
  // Police login
  policeLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // Find police user
    const user = await prisma.police.findUnique({
      where: { emailEncrypted: email }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }
    
    // Verify password
    const isPasswordValid = await Helpers.comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }
    
    // Update last login
    await prisma.police.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Generate tokens
    const accessToken = jwtService.generateToken({
      userId: user.id,
      type: 'police',
      role: user.role
    });
    
    const refreshToken = jwtService.generateRefreshToken({
      userId: user.id,
      type: 'police',
      role: user.role
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.emailEncrypted,
          name: user.name,
          role: user.role,
          department: user.department,
          city: user.city,
          district: user.district,
          badgeNumber: user.badgeNumber
        },
        accessToken,
        refreshToken
      }
    });
  });
  
  // Refresh token
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }
    
    try {
      const decoded = jwtService.verifyRefreshToken(refreshToken);
      
      // Generate new tokens
      const newAccessToken = jwtService.generateToken({
        userId: decoded.userId,
        type: decoded.type,
        role: decoded.role
      });
      
      const newRefreshToken = jwtService.generateRefreshToken({
        userId: decoded.userId,
        type: decoded.type,
        role: decoded.role
      });
      
      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  });
  
  // Logout
  logout = asyncHandler(async (req: Request, res: Response) => {
    // In a real implementation, you might want to blacklist the refresh token
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });
}

