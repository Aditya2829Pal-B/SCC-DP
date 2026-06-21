# 🚀 SCC&DP Backend — Production-Grade API Server

## Overview

Smart City Complaint & Disaster Prediction Platform - A production-ready Express.js backend with MongoDB, JWT authentication, and ML microservices integration.

## Features

✅ **Production-Grade Architecture**
- Modular, scalable design with controllers, services, and middleware separation
- Comprehensive error handling with custom error classes
- Structured logging system (dev & production modes)
- Environment configuration management
- Graceful shutdown handling

✅ **Security**
- JWT token authentication with refresh tokens
- Bcrypt password hashing
- Helmet security headers
- CORS protection
- Input validation and sanitization
- Rate limiting support

✅ **Database**
- MongoDB with Mongoose ODM
- GeoJSON support for location queries
- Automatic retry connection logic
- Connection pooling

✅ **API Features**
- RESTful endpoints with proper HTTP status codes
- Pagination support
- Geospatial queries (nearby complaints)
- Admin role-based access control
- Request/response logging

✅ **ML Integration**
- NLP service for complaint classification
- LSTM service for disaster prediction
- Risk engine integration
- Error handling with fallbacks

## Architecture

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── controllers/     # Business logic
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # External service clients
│   ├── utils/           # Utilities (logger, errors, validation)
│   └── server.js        # App entry point
├── .env                 # Environment variables (dev)
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md            # This file
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 4.4
- Redis (optional, for caching)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:5000`

## Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development          # development | production | test
PORT=5000
LOG_LEVEL=debug              # error | warn | info | debug | trace

# Database
MONGO_URI=mongodb://localhost:27017/scc_dp
MONGO_POOL_SIZE=10
MONGO_TIMEOUT=5000

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=refresh_secret
REFRESH_TOKEN_EXPIRE=30d

# Frontend
FRONTEND_URL=http://localhost:3000

# ML Services
NLP_SERVICE_URL=http://localhost:8001
LSTM_SERVICE_URL=http://localhost:8002
RISK_ENGINE_URL=http://localhost:8003

# Security
BCRYPT_ROUNDS=10
MAX_REQUEST_SIZE=10mb
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=1000
```

## API Endpoints

### Authentication

```bash
# Sign up
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "city": "New Delhi"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

# Get profile
GET /api/auth/profile
Authorization: Bearer <token>

# Refresh token
POST /api/auth/refresh-token
{
  "refreshToken": "<refresh_token>"
}
```

### Complaints

```bash
# List complaints
GET /api/complaints?page=1&limit=50&status=Submitted
Authorization: Bearer <token>

# Create complaint
POST /api/complaints
Authorization: Bearer <token>
{
  "title": "Pothole on Main Street",
  "description": "Large pothole near the intersection",
  "category": "Road Damage",
  "location": {
    "coordinates": [77.2090, 28.6139],
    "address": "Main Street, New Delhi"
  }
}

# Get complaint
GET /api/complaints/:id
Authorization: Bearer <token>

# Update complaint (admin)
PUT /api/complaints/:id
Authorization: Bearer <admin_token>
{
  "status": "In Progress",
  "priority": "high",
  "adminNotes": "Repair team assigned"
}

# Nearby complaints
GET /api/complaints/geo/nearby?lng=77.2090&lat=28.6139&maxDistance=5000
Authorization: Bearer <token>

# By category
GET /api/complaints/category/Road%20Damage?page=1&limit=50
Authorization: Bearer <token>
```

### Alerts

```bash
# Get alerts
GET /api/alerts?severity=high
Authorization: Bearer <token>

# Get risk profile
GET /api/alerts/risk/:userId
Authorization: Bearer <token>
```

### Analytics

```bash
# Dashboard overview (admin)
GET /api/analytics/overview
Authorization: Bearer <admin_token>

# Trends (admin)
GET /api/analytics/trends?month=6
Authorization: Bearer <admin_token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "statusCode": 400
}
```

### Error Codes

- `VALIDATION_ERROR` - 400: Input validation failed
- `AUTHENTICATION_ERROR` - 401: Authentication required or invalid
- `AUTHORIZATION_ERROR` - 403: Access denied
- `NOT_FOUND` - 404: Resource not found
- `CONFLICT` - 409: Resource already exists
- `RATE_LIMIT_EXCEEDED` - 429: Too many requests
- `DATABASE_ERROR` - 500: Database error
- `INTERNAL_SERVER_ERROR` - 500: Unexpected error

## Development

### Scripts

```bash
# Development with watch mode
npm run dev

# Production
npm run start

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Seed database
npm run seed
```

### Code Structure

**Controllers** - Handle business logic
```javascript
export const complaintController = {
  async createComplaint(req, res, next) {
    // Business logic here
  },
};
```

**Services** - External service clients
```javascript
export const mlService = {
  async classify(text) {
    // ML service integration
  },
};
```

**Middleware** - Request processing
```javascript
export function authenticate(req, res, next) {
  // Auth logic
}
```

**Models** - Database schemas
```javascript
const complaintSchema = new mongoose.Schema({ /* ... */ });
```

## Database Schema

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user | admin),
  location: {
    type: Point,
    coordinates: [lng, lat],
    city: String
  },
  sensitivity: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Complaint
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  userName: String,
  title: String,
  description: String,
  category: String,
  status: String (Submitted|Under Review|In Progress|Resolved|Rejected),
  priority: String (low|medium|high|critical),
  location: {
    type: Point,
    coordinates: [lng, lat],
    address: String
  },
  nlpCategory: String,
  nlpConfidence: Number,
  adminNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Alert
```javascript
{
  _id: ObjectId,
  title: String,
  message: String,
  severity: String (low|medium|high|critical),
  type: String,
  location: String,
  targetUsers: [ObjectId],
  read: Boolean,
  riskScore: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Monitoring & Logging

### Log Levels

- **ERROR** - Critical failures
- **WARN** - Warnings and issues
- **INFO** - Important events
- **DEBUG** - Detailed debugging
- **TRACE** - Very detailed tracing

### Log Format (Production)

```json
{
  "timestamp": "2026-05-11T12:00:00Z",
  "level": "INFO",
  "context": "AUTH",
  "message": "User logged in",
  "userId": "507f1f77bcf86cd799439011"
}
```

### Health Checks

```bash
# Server health
GET http://localhost:5000/health

# ML services health
GET http://localhost:5000/api/ml/health
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment (Production)

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/scc_dp
JWT_SECRET=<strong-random-key>
# ... other production settings
```

### Process Manager

Use PM2 or similar:

```bash
pm2 start src/server.js --name "scc-dp-api" --env production
pm2 save
```

## Performance

- Connection pooling: 10-20 connections
- Request timeout: 10 seconds
- Pagination limit: 50 per page
- GeoJSON index for location queries
- Request logging in development mode only

## Security Checklist

- ✅ HTTPS in production
- ✅ Strong JWT secret (>32 chars)
- ✅ Password hashing (bcrypt with 10+ rounds)
- ✅ CORS configured for frontend domain
- ✅ Helmet security headers
- ✅ Input validation and sanitization
- ✅ Rate limiting enabled
- ✅ Environment variables for secrets
- ✅ Database authentication enabled
- ✅ Graceful error handling (no stack traces in production)

## Contributing

1. Clone the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/name`
5. Submit pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please create an issue on GitHub.

---

**Made with ❤️ for Smart Cities**
