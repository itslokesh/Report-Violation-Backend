import Joi from 'joi';

export const createFeedbackSchema = Joi.object({
  feedbackType: Joi.string()
    .valid('APP_FEEDBACK', 'REPORT_FEEDBACK', 'SERVICE_FEEDBACK', 'FEATURE_REQUEST')
    .required()
    .messages({
      'any.only': 'Feedback type must be one of: APP_FEEDBACK, REPORT_FEEDBACK, SERVICE_FEEDBACK, FEATURE_REQUEST'
    }),
  
  category: Joi.string()
    .valid('UI_UX', 'BUG', 'PERFORMANCE', 'SUGGESTION', 'COMPLAINT', 'PRAISE')
    .required()
    .messages({
      'any.only': 'Category must be one of: UI_UX, BUG, PERFORMANCE, SUGGESTION, COMPLAINT, PRAISE'
    }),
  
  title: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5'
    }),
  
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    .required()
    .messages({
      'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL'
    }),
  
  isAnonymous: Joi.boolean()
    .default(false),
  
  contactEmail: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  contactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  reportId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Report ID must be a valid number'
    }),
  
  attachments: Joi.array()
    .items(Joi.string().uri())
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 attachments allowed'
    }),
  
  metadata: Joi.object()
    .optional()
});

export const updateFeedbackSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: PENDING, IN_REVIEW, RESOLVED, CLOSED'
    }),
  
  assignedTo: Joi.string()
    .optional(),
  
  resolutionNotes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Resolution notes cannot exceed 1000 characters'
    }),
  
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL'
    })
});

export const createFeedbackResponseSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Response message cannot be empty',
      'string.max': 'Response message cannot exceed 1000 characters'
    }),
  
  isInternal: Joi.boolean()
    .default(false)
});

export const feedbackFiltersSchema = Joi.object({
  feedbackType: Joi.string()
    .valid('APP_FEEDBACK', 'REPORT_FEEDBACK', 'SERVICE_FEEDBACK', 'FEATURE_REQUEST')
    .optional(),
  
  category: Joi.string()
    .valid('UI_UX', 'BUG', 'PERFORMANCE', 'SUGGESTION', 'COMPLAINT', 'PRAISE')
    .optional(),
  
  status: Joi.string()
    .valid('PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED')
    .optional(),
  
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    .optional(),
  
  assignedTo: Joi.string()
    .optional(),
  
  citizenId: Joi.string()
    .optional(),
  
  userId: Joi.string()
    .optional(),
  
  reportId: Joi.number()
    .integer()
    .positive()
    .optional(),
  
  dateFrom: Joi.date()
    .iso()
    .optional(),
  
  dateTo: Joi.date()
    .iso()
    .optional(),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'priority', 'status', 'rating')
    .default('createdAt'),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});
