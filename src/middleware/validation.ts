import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ERROR_MESSAGES } from '../utils/constants';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { convert: true, abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message)
      });
    }
    
    // apply coerced values (e.g., Date objects)
    (req as any).body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, { convert: true, abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message)
      });
    }
    
    (req as any).query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, { convert: true, abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message)
      });
    }
    
    (req as any).params = value;
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
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    registeredCity: Joi.string().min(2).max(50).optional(),
    registeredPincode: Joi.string().length(6).optional(),
    registeredDistrict: Joi.string().min(2).max(50).optional(),
    registeredState: Joi.string().min(2).max(50).optional()
  }),

  policeAuth: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  createReport: Joi.object({
    violationTypes: Joi.array().items(Joi.string().valid(
      'WRONG_SIDE_DRIVING',
      'NO_PARKING_ZONE',
      'SIGNAL_JUMPING',
      'SPEED_VIOLATION',
      'HELMET_SEATBELT_VIOLATION',
      'MOBILE_PHONE_USAGE',
      'LANE_CUTTING',
      'DRUNK_DRIVING_SUSPECTED',
      'OTHERS'
    )).min(1).required(),
    severity: Joi.string().valid('MINOR', 'MAJOR', 'CRITICAL').optional(),
    description: Joi.string().max(500).optional(),
    timestamp: Joi.date().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().min(5).max(200).required(),
    pincode: Joi.string().length(6).required(),
    city: Joi.string().min(2).max(50).required(),
    district: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    photoUrl: Joi.string().uri().optional(),
    videoUrl: Joi.string().uri().optional(),
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
    status: Joi.string().uppercase().valid(
      'PENDING',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'DUPLICATE'
    ).required(),
    reviewNotes: Joi.string().max(500).optional(),
    challanIssued: Joi.boolean().optional(),
    challanNumber: Joi.string().optional(),
    approvedViolationTypes: Joi.alternatives().try(
      Joi.array().items(Joi.string().uppercase().valid(
        'WRONG_SIDE_DRIVING',
        'NO_PARKING_ZONE',
        'SIGNAL_JUMPING',
        'SPEED_VIOLATION',
        'HELMET_SEATBELT_VIOLATION',
        'MOBILE_PHONE_USAGE',
        'LANE_CUTTING',
        'DRUNK_DRIVING_SUSPECTED',
        'OTHERS'
      )),
      Joi.string()
    ).optional()
  }),

  reportFilters: Joi.object({
    status: Joi.string().valid(
      'PENDING',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'DUPLICATE'
    ).optional(),
    statuses: Joi.alternatives().try(
      Joi.array().items(Joi.string().valid(
        'PENDING',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'DUPLICATE'
      )).min(1),
      Joi.string()
    ).optional(),
    statusMode: Joi.string().valid('any', 'all').default('any'),
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
    violationTypes: Joi.alternatives().try(
      Joi.array().items(Joi.string().valid(
        'WRONG_SIDE_DRIVING',
        'NO_PARKING_ZONE',
        'SIGNAL_JUMPING',
        'SPEED_VIOLATION',
        'HELMET_SEATBELT_VIOLATION',
        'MOBILE_PHONE_USAGE',
        'LANE_CUTTING',
        'DRUNK_DRIVING_SUSPECTED',
        'OTHERS'
      )).min(1),
      Joi.string()
    ).optional(),
    violationTypeMode: Joi.string().valid('any', 'all').default('any'),
    severity: Joi.string().valid('MINOR', 'MAJOR', 'CRITICAL').optional(),
    // Support both dateFrom/dateTo (used by police dashboards) and startDate/endDate (legacy)
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    vehicleNumber: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'timestamp', 'status').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }),

  reportId: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  })
};

