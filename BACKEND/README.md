# ResQRoute Backend - Smart Emergency Response Platform

Complete backend implementation for the Smart Emergency Response Platform handling both Medical (Ambulance) and Fire emergencies.

## 🚀 Quick Start

### Prerequisites
- Node.js v16 or higher
- MongoDB v4.4 or higher
- Redis v6 or higher

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start the server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js                 # Entry point
│   ├── app.js                    # Express app configuration
│   ├── config/                   # Configuration files
│   ├── models/                   # Mongoose models
│   ├── api/                      # API layer
│   │   ├── controllers/          # Request handlers
│   │   ├── routes/               # Route definitions
│   │   └── middlewares/          # Custom middlewares
│   ├── services/                 # Business logic
│   ├── socket/                   # WebSocket handlers
│   └── utils/                    # Utility functions
└── package.json
```

## 🔑 Key Features Implemented

✅ **Medical Emergency System**
- Ambulance booking and matching
- Government/Private hospital selection
- Real-time tracking
- Patient triage

✅ **Fire Emergency System**
- Fire incident reporting
- Fire truck dispatch
- Multi-truck coordination
- Resource allocation

✅ **Unified Features**
- Real-time WebSocket communication
- Redis caching
- Firebase push notifications
- JWT authentication
- Geo-spatial queries

## 📡 API Endpoints

### Authentication
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- GET `/api/v1/auth/me`

### Medical
- POST `/api/v1/medical/booking`
- GET `/api/v1/medical/booking/:id`
- GET `/api/v1/medical/hospitals`
- GET `/api/v1/medical/ambulances`

### Fire
- POST `/api/v1/fire/incident`
- GET `/api/v1/fire/incident/:id`
- GET `/api/v1/fire/stations`
- GET `/api/v1/fire/trucks`

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

## 📝 License

MIT