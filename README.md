# 🚔 Traffic Police Backend API

A comprehensive Node.js backend service for traffic violation reporting and management system. This service provides APIs for citizens to report traffic violations and for police officers to review, manage, and analyze violation reports.

## 🚀 Features

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (Citizen, Officer, Supervisor, Admin)
- **OTP-based authentication** for citizens via Twilio SMS
- **Secure password hashing** and token management

### Citizen Features
- **Violation reporting** with photo/video uploads
- **Real-time location tracking** and address validation
- **Points and rewards system** for accurate reports
- **Report status tracking** with SMS notifications
- **Profile management** and statistics

### Police Features
- **Comprehensive dashboard** with analytics and insights
- **Report review and management** with status updates
- **Vehicle information lookup** and fine calculation
- **Geographic statistics** and hotspot identification
- **Officer performance tracking**

### Technical Features
- **TypeScript** for type safety and better development experience
- **Prisma ORM** for database management and migrations
- **SQLite** database for development (easily switchable to PostgreSQL)
- **File upload** support via Firebase Storage
- **SMS notifications** via Twilio
- **Input validation** with Joi schemas
- **Error handling** and logging
- **Rate limiting** and security middleware

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: Firebase Storage
- **SMS**: Twilio
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI (planned)

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Report-Violation-Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your variables:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Twilio Configuration (Optional - will mock if not provided)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# Firebase Configuration (Optional - will mock if not provided)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-bucket-name

# Encryption (for production)
ENCRYPTION_KEY=your-32-character-encryption-key
ENCRYPTION_IV=your-16-character-iv
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npx prisma db seed
```

### 5. Start the Server
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Police Login
```http
POST /api/auth/police/login
Content-Type: application/json

{
  "email": "officer1@police.gov.in",
  "password": "password123"
}
```

#### Citizen OTP Send
```http
POST /api/auth/citizen/send-otp
Content-Type: application/json

{
  "phoneNumber": "+91-9876543210"
}
```

#### Citizen OTP Verify
```http
POST /api/auth/citizen/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+91-9876543210",
  "otp": "123456"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

### Police Dashboard APIs

#### Dashboard Overview
```http
GET /api/police/dashboard?dateFrom=2024-01-01&dateTo=2024-01-31&city=Chennai
Authorization: Bearer <access-token>
```

#### Violation Type Statistics
```http
GET /api/police/dashboard/violation-types?dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer <access-token>
```

#### Geographic Statistics
```http
GET /api/police/dashboard/geographic?dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer <access-token>
```

#### Officer Performance
```http
GET /api/police/dashboard/officer-performance?dateFrom=2024-01-01&dateTo=2024-01-31&limit=10
Authorization: Bearer <access-token>
```

### Reports Management APIs

#### Get All Reports
```http
GET /api/police/reports?status=PENDING&city=Chennai&page=1&limit=20&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <access-token>
```

#### Get Report by ID
```http
GET /api/police/reports/1
Authorization: Bearer <access-token>
```

#### Update Report Status
```http
PUT /api/police/reports/1/status
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "APPROVED",
  "reviewNotes": "Clear evidence of violation",
  "challanIssued": true,
  "challanNumber": "CH2024001"
}
```

### Citizen APIs

#### Submit Violation Report
```http
POST /api/citizen/reports
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

{
  "violationType": "SPEED_VIOLATION",
  "description": "Vehicle was speeding in school zone",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "address": "Anna Nagar Main Road, Chennai",
  "city": "Chennai",
  "vehicleNumber": "TN01AB1234",
  "vehicleType": "FOUR_WHEELER",
  "photo": <file>,
  "video": <file>
}
```

#### Get My Reports
```http
GET /api/citizen/reports?page=1&limit=10
Authorization: Bearer <access-token>
```

#### Get Profile
```http
GET /api/citizen/profile
Authorization: Bearer <access-token>
```

### Vehicle Information API

#### Get Vehicle Details
```http
GET /api/police/vehicles/TN01AB1234
Authorization: Bearer <access-token>
```

## 🗄 Database Schema

### Core Tables

#### Users
- Police officers, supervisors, and administrators
- Role-based access control
- Department and badge information

#### Citizens
- Citizen profiles with phone numbers and email
- Points and statistics tracking
- Report submission history

#### ViolationReports
- Complete violation report data
- Location, vehicle, and violation details
- Status tracking and review information
- Points awarded and challan details

#### OTP
- Temporary OTP storage for citizen authentication
- Automatic cleanup of expired OTPs

### Key Features
- **Encrypted sensitive data** (phone numbers, emails, addresses)
- **Geographic indexing** for location-based queries
- **Status tracking** for report lifecycle management
- **Audit trails** with timestamps and reviewer information

## 🔧 Development

### Project Structure
```
src/
├── controllers/          # API route handlers
│   ├── authController.ts
│   ├── citizenController.ts
│   └── policeController.ts
├── middleware/           # Express middleware
│   ├── auth.ts          # JWT authentication
│   ├── validation.ts    # Input validation
│   ├── errorHandler.ts  # Error handling
│   └── upload.ts        # File upload handling
├── services/            # Business logic services
│   ├── smsService.ts    # Twilio SMS service
│   ├── fileUpload.ts    # Firebase storage service
│   ├── mockDataService.ts # Mock data for development
│   └── duplicateDetection.ts # Duplicate report detection
├── utils/               # Utility functions
│   ├── database.ts      # Prisma client
│   ├── jwt.ts          # JWT utilities
│   ├── constants.ts    # Application constants
│   └── encryption.ts   # Data encryption utilities
├── types/              # TypeScript type definitions
├── routes/             # API route definitions
└── app.ts              # Express application setup
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build TypeScript to JavaScript
npm start               # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with initial data
npm run db:reset        # Reset database and run migrations

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment | No | development |
| `DATABASE_URL` | Database connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Yes | - |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | No | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | No | - |
| `FIREBASE_PROJECT_ID` | Firebase project ID | No | - |
| `ENCRYPTION_KEY` | 32-character encryption key | No | - |

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Role-based access control** for different user types
- **Input validation** using Joi schemas
- **Rate limiting** to prevent abuse
- **CORS configuration** for cross-origin requests
- **Helmet.js** for security headers
- **Data encryption** for sensitive information
- **SQL injection prevention** via Prisma ORM

## 📊 Business Logic

### Points System
- **Base points** for each approved report
- **Bonus points** for first reporters of violations
- **Accuracy tracking** based on approval rate
- **Points redemption** system (planned)

### Duplicate Detection
- **Location-based** duplicate detection
- **Time-based** filtering (30-minute windows)
- **Vehicle number** matching
- **Automatic status updates** for duplicates

### Fine Calculation
- **Violation type-based** fine amounts
- **Severity level** considerations
- **Vehicle type** adjustments
- **Previous violations** history

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="auth"
```

## 📈 Monitoring & Logging

- **Structured logging** for all API requests
- **Error tracking** with detailed stack traces
- **Performance monitoring** for database queries
- **Health check endpoint** at `/health`

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Considerations
- Use **PostgreSQL** for production database
- Configure **Redis** for session storage (optional)
- Set up **proper SSL certificates**
- Configure **reverse proxy** (nginx)
- Set up **monitoring and alerting**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the troubleshooting guide

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Authentication system
  - Report management
  - Dashboard analytics
  - Citizen reporting
  - Police review system

---

**Built with ❤️ for better traffic management**

