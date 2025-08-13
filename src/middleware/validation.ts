import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ERROR_MESSAGES } from '../utils/constants';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

// Validation schemas
export const schemas = {
  citizenAuth: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+91-\d{10}$/).required(),
    otp: Joi.string().length(6).required()
  }),

  citizenOTP: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+91-\d{10}$/).required()
  }),

  citizenRegistration: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+91-\d{10}$/).required(),
    name: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    registeredCity: Joi.string().min(2).max(50).required(),
    registeredPincode: Joi.string().length(6).required(),
    registeredDistrict: Joi.string().min(2).max(50).required(),
    registeredState: Joi.string().min(2).max(50).required()
  }),

  policeAuth: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  createReport: Joi.object({
    violationType: Joi.string().valid(
      'WRONG_SIDE_DRIVING',
      'NO_PARKING_ZONE',
      'SIGNAL_JUMPING',
      'SPEED_VIOLATION',
      'HELMET_SEATBELT_VIOLATION',
      'MOBILE_PHONE_USAGE',
      'LANE_CUTTING',
      'DRUNK_DRIVING_SUSPECTED',
      'OTHERS'
    ).required(),
    severity: Joi.string().valid('MINOR', 'MAJOR', 'CRITICAL').required(),
    description: Joi.string().max(500).optional(),
    timestamp: Joi.date().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().min(5).max(200).required(),
    pincode: Joi.string().length(6).required(),
    city: Joi.string().min(2).max(50).required(),
    district: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    vehicleNumber: Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/).optional(),
    vehicleType: Joi.string().valid(
      'TWO_WHEELER',
      'FOUR_WHEELER',
      'COMMERCIAL_VEHICLE',
      'HEAVY_VEHICLE',
      'AUTO_RICKSHAW',
      'BUS',
      'TRUCK',
      'OTHERS'
    ).optional(),
    vehicleColor: Joi.string().min(2).max(20).optional(),
    isAnonymous: Joi.boolean().required()
  }),

  updateReportStatus: Joi.object({
    status: Joi.string().valid(
      'PENDING',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'DUPLICATE'
    ).required(),
    reviewNotes: Joi.string().max(500).optional(),
    challanIssued: Joi.boolean().optional(),
    challanNumber: Joi.string().optional()
  }),

  reportFilters: Joi.object({
    status: Joi.string().valid(
      'PENDING',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'DUPLICATE'
    ).optional(),
    city: Joi.string().optional(),
    violationType: Joi.string().valid(
      'WRONG_SIDE_DRIVING',
      'NO_PARKING_ZONE',
      'SIGNAL_JUMPING',
      'SPEED_VIOLATION',
      'HELMET_SEATBELT_VIOLATION',
      'MOBILE_PHONE_USAGE',
      'LANE_CUTTING',
      'DRUNK_DRIVING_SUSPECTED',
      'OTHERS'
    ).optional(),
    severity: Joi.string().valid('MINOR', 'MAJOR', 'CRITICAL').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  }),

  reportId: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  })
};

