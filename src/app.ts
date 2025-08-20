import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { requestLogger } from './middleware/requestLogger';

// Import routes
import authRoutes from './routes/auth';
import citizenRoutes from './routes/citizen';
import policeRoutes from './routes/police';
import uploadRoutes from './routes/upload';
import feedbackRoutes from './routes/feedback';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';


const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration (strict allowed origins)
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser/health checks
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

// Preflight
app.options('*', cors());

// Compression middleware
app.use(compression());

// Rate limiting (apply to API routes only, not static assets like /uploads)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
// Apply limiter only to API paths to avoid throttling video/static requests
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (after parsers so body is available)
app.use(requestLogger);

// Static serving for local uploads with video range/CORS support
app.use(
  '/uploads',
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Range', 'Content-Type'],
    credentials: false
  }),
  express.static(path.join(process.cwd(), 'uploads'), {
    etag: false,
    lastModified: false,
    setHeaders(res) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      // Prevent caching that can lead to 304 on range requests
      res.setHeader('Cache-Control', 'no-cache');
    }
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Traffic Police Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feedback', feedbackRoutes);

// Shared vehicle info endpoint (no auth required)
app.get('/api/vehicles/:number', async (req, res) => {
  try {
    const { MockDataService } = await import('./services/mockDataService');
    const mockDataService = new MockDataService();
    const vehicleInfo = await mockDataService.getVehicleInfo(req.params.number);
    
    if (!vehicleInfo) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle information not found'
      });
    }
    
    return res.json({
      success: true,
      data: vehicleInfo
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle information'
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚔 Traffic Police Backend API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Prototype no-auth for police/upload: ${process.env.PROTOTYPE_NO_AUTH === 'true' ? 'ENABLED' : 'disabled'}`);
});

export default app;

