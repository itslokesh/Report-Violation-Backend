import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ERROR_MESSAGES } from '../utils/constants';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { convert: true, abortEarly: false });
    
    if (error) {
      console.log('Validation error details:', JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method,
        body: req.body,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }))
      }));
      
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message),
        fieldErrors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
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
      )).min(1),
      Joi.array().items(Joi.string().lowercase().valid(
        'wrong_side_driving',
        'no_parking_zone',
        'signal_jumping',
        'speed_violation',
        'helmet_seatbelt_violation',
        'mobile_phone_usage',
        'lane_cutting',
        'drunk_driving_suspected',
        'others'
      )).min(1).custom((value, helpers) => {
        return value.map((item: string) => item.toUpperCase());
      }),
      Joi.array().allow(null).items(Joi.string().valid(
        'WRONG_SIDE_DRIVING',
        'NO_PARKING_ZONE',
        'SIGNAL_JUMPING',
        'SPEED_VIOLATION',
        'HELMET_SEATBELT_VIOLATION',
        'MOBILE_PHONE_USAGE',
        'LANE_CUTTING',
        'DRUNK_DRIVING_SUSPECTED',
        'OTHERS'
      )).min(1).custom((value, helpers) => {
        if (value === null) return helpers.error('any.required');
        return value;
      })
    ).required().messages({
      'array.min': 'At least one violation type must be specified',
      'array.base': 'Violation types must be an array',
      'any.required': 'Violation types are required'
    }),
    severity: Joi.alternatives().try(
      Joi.string().valid('MINOR', 'MAJOR', 'CRITICAL'),
      Joi.string().uppercase().valid('MINOR', 'MAJOR', 'CRITICAL'),
      Joi.string().lowercase().valid('minor', 'major', 'critical').custom((value, helpers) => {
        return value.toUpperCase();
      }),
      Joi.string().allow(''),
      Joi.string().allow(null)
    ).optional().messages({
      'any.only': 'Severity must be one of: MINOR, MAJOR, CRITICAL'
    }),
    description: Joi.alternatives().try(
      Joi.string().max(500),
      Joi.string().trim().max(500),
      Joi.string().allow('').max(500),
      Joi.string().allow(null).max(500)
    ).optional().messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    timestamp: Joi.alternatives().try(
      Joi.date().iso(),
      Joi.string().isoDate(),
      Joi.date(),
      Joi.string().custom((value, helpers) => {
        // Try to parse various date formats
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return helpers.error('any.invalid');
        }
        return date;
      }),
      Joi.string().allow(null).custom((value, helpers) => {
        if (value === null) return helpers.error('any.required');
        // Try to parse various date formats
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return helpers.error('any.invalid');
        }
        return date;
      })
    ).required().messages({
      'any.required': 'Timestamp is required',
      'date.base': 'Timestamp must be a valid date',
      'string.isoDate': 'Timestamp must be in ISO format',
      'any.invalid': 'Timestamp must be a valid date string or ISO format'
    }),
    latitude: Joi.alternatives().try(
      Joi.number().min(-90).max(90),
      Joi.string().pattern(/^-?\d+(\.\d+)?$/).custom((value, helpers) => {
        const num = parseFloat(value);
        if (num < -90 || num > 90) {
          return helpers.error('any.invalid');
        }
        return num;
      }),
      Joi.string().allow(null).pattern(/^-?\d+(\.\d+)?$/).custom((value, helpers) => {
        if (value === null) return helpers.error('any.required');
        const num = parseFloat(value);
        if (num < -90 || num > 90) {
          return helpers.error('any.invalid');
        }
        return num;
      })
    ).required().messages({
      'any.invalid': 'Latitude must be between -90 and 90 degrees',
      'any.required': 'Latitude is required'
    }),
    longitude: Joi.alternatives().try(
      Joi.number().min(-180).max(180),
      Joi.string().pattern(/^-?\d+(\.\d+)?$/).custom((value, helpers) => {
        const num = parseFloat(value);
        if (num < -180 || num > 180) {
          return helpers.error('any.invalid');
        }
        return num;
      }),
      Joi.string().allow(null).pattern(/^-?\d+(\.\d+)?$/).custom((value, helpers) => {
        if (value === null) return helpers.error('any.required');
        const num = parseFloat(value);
        if (num < -180 || num > 180) {
          return helpers.error('any.invalid');
        }
        return num;
      })
    ).required().messages({
      'any.invalid': 'Longitude must be between -180 and 180 degrees',
      'any.required': 'Longitude is required'
    }),
    address: Joi.alternatives().try(
      Joi.string().min(5).max(200),
      Joi.string().trim().min(5).max(200),
      Joi.string().allow(null).min(5).max(200)
    ).required().messages({
      'string.min': 'Address must be at least 5 characters long',
      'string.max': 'Address cannot exceed 200 characters',
      'any.required': 'Address is required'
    }),
    pincode: Joi.alternatives().try(
      Joi.string().length(6),
      Joi.string().pattern(/^\d{6}$/),
      Joi.number().integer().min(100000).max(999999),
      Joi.string().allow(null).length(6),
      Joi.string().allow(null).pattern(/^\d{6}$/)
    ).required().messages({
      'string.length': 'Pincode must be exactly 6 characters',
      'string.pattern.base': 'Pincode must be exactly 6 digits',
      'number.min': 'Pincode must be at least 100000',
      'number.max': 'Pincode must be at most 999999',
      'any.required': 'Pincode is required'
    }),
    city: Joi.alternatives().try(
      Joi.string().min(2).max(50),
      Joi.string().trim().min(2).max(50),
      Joi.string().allow(null).min(2).max(50)
    ).required().messages({
      'string.min': 'City must be at least 2 characters long',
      'string.max': 'City cannot exceed 50 characters',
      'any.required': 'City is required'
    }),
    district: Joi.alternatives().try(
      Joi.string().min(2).max(50),
      Joi.string().trim().min(2).max(50),
      Joi.string().allow(null).min(2).max(50)
    ).required().messages({
      'string.min': 'District must be at least 2 characters long',
      'string.max': 'District cannot exceed 50 characters',
      'any.required': 'District is required'
    }),
    state: Joi.alternatives().try(
      Joi.string().min(2).max(50),
      Joi.string().trim().min(2).max(50),
      Joi.string().allow(null).min(2).max(50)
    ).required().messages({
      'string.min': 'State must be at least 2 characters long',
      'string.max': 'State cannot exceed 50 characters',
      'any.required': 'State is required'
    }),
    photoUrl: Joi.alternatives().try(
      Joi.string().uri(),
      Joi.string().allow(''),
      Joi.string().allow(null),
      Joi.string().pattern(/^https?:\/\/.+/)
    ).optional().messages({
      'string.uri': 'Photo URL must be a valid URI',
      'string.pattern.base': 'Photo URL must start with http:// or https://'
    }),
    videoUrl: Joi.alternatives().try(
      Joi.string().uri(),
      Joi.string().allow(''),
      Joi.string().allow(null),
      Joi.string().pattern(/^https?:\/\/.+/)
    ).optional().messages({
      'string.uri': 'Video URL must be a valid URI',
      'string.pattern.base': 'Video URL must start with http:// or https://'
    }),
    vehicleNumber: Joi.alternatives().try(
      Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/),
      Joi.string().allow(''),
      Joi.string().allow(null),
      Joi.string().pattern(/^[A-Z]{2}\s*[0-9]{2}\s*[A-Z]{2}\s*[0-9]{4}$/).custom((value, helpers) => {
        // Remove spaces and convert to standard format
        return value.replace(/\s/g, '');
      })
    ).optional().messages({
      'string.pattern.base': 'Vehicle number must be in format: XX00XX0000 (e.g., KA01AB1234)'
    }),
    vehicleType: Joi.alternatives().try(
      Joi.string().valid(
        'TWO_WHEELER',
        'FOUR_WHEELER',
        'COMMERCIAL_VEHICLE',
        'HEAVY_VEHICLE',
        'AUTO_RICKSHAW',
        'BUS',
        'TRUCK',
        'OTHERS'
      ),
      Joi.string().uppercase().valid(
        'TWO_WHEELER',
        'FOUR_WHEELER',
        'COMMERCIAL_VEHICLE',
        'HEAVY_VEHICLE',
        'AUTO_RICKSHAW',
        'BUS',
        'TRUCK',
        'OTHERS'
      ),
      Joi.string().lowercase().valid(
        'two_wheeler',
        'four_wheeler',
        'commercial_vehicle',
        'heavy_vehicle',
        'auto_rickshaw',
        'bus',
        'truck',
        'others'
      ).custom((value, helpers) => {
        return value.toUpperCase();
      }),
      Joi.string().allow(''),
      Joi.string().allow(null)
    ).optional().messages({
      'any.only': 'Vehicle type must be one of: TWO_WHEELER, FOUR_WHEELER, COMMERCIAL_VEHICLE, HEAVY_VEHICLE, AUTO_RICKSHAW, BUS, TRUCK, OTHERS'
    }),
    vehicleColor: Joi.alternatives().try(
      Joi.string().min(2).max(20),
      Joi.string().trim().min(2).max(20),
      Joi.string().allow('').min(2).max(20),
      Joi.string().allow(null).min(2).max(20)
    ).optional().messages({
      'string.min': 'Vehicle color must be at least 2 characters long',
      'string.max': 'Vehicle color cannot exceed 20 characters'
    }),
    isAnonymous: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '1', '0').custom((value, helpers) => {
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        return helpers.error('any.invalid');
      })
    ).default(false).messages({
      'boolean.base': 'isAnonymous must be a boolean value',
      'any.invalid': 'isAnonymous must be a valid boolean value'
    })
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

