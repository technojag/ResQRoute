# ResQRoute Backend - Setup & Troubleshooting Guide

## 🚨 FIXING YOUR CURRENT ERROR

### Error: 'nodemon' is not recognized

**QUICK FIX (Choose ONE):**

#### Option 1: Install Dependencies First (RECOMMENDED)
```bash
cd BACKEND
npm install
```
This will install nodemon automatically from package.json.

#### Option 2: Install nodemon globally
```bash
npm install -g nodemon
```

#### Option 3: Use npx (No installation needed)
```bash
npm run dev:npx
```

#### Option 4: Run without nodemon
```bash
npm start
# or directly
node src/server.js
```

---

## 📋 COMPLETE SETUP STEPS

### Step 1: Navigate to Backend Directory
```bash
cd C:\Users\anand\Desktop\ResQRoute\BACKEND
```

### Step 2: Install ALL Dependencies
```bash
npm install
```

This will install:
- express
- mongoose
- redis
- socket.io
- jsonwebtoken
- bcryptjs
- nodemon (dev dependency)
- And 20+ other packages

**Wait for installation to complete!**

### Step 3: Create Environment File
```bash
copy .env.example .env
```

Edit `.env` file with your settings:
```env
NODE_ENV=development
PORT=5000

# MongoDB (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/resqroute

# JWT (REQUIRED)
JWT_SECRET=your_super_secret_key_change_this_in_production_12345

# Redis (Optional for now)
REDIS_HOST=localhost
REDIS_PORT=6379

# Others can be added later
```

### Step 4: Make Sure MongoDB is Running
```bash
# Check if MongoDB is running
mongod --version

# If not installed, download from:
# https://www.mongodb.com/try/download/community

# Start MongoDB (if installed)
mongod
```

### Step 5: Start the Server
```bash
# With auto-restart
npm run dev

# OR without auto-restart
npm start

# OR directly
node src/server.js
```

---

## 🔧 TROUBLESHOOTING COMMON ISSUES

### Issue 1: "Cannot find module"
**Solution:**
```bash
npm install
```

### Issue 2: "MongoDB connection error"
**Solution:**
```bash
# Option A: Install MongoDB locally
# Download from https://www.mongodb.com/try/download/community

# Option B: Use MongoDB Atlas (Cloud - Free)
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free account
# 3. Create cluster
# 4. Get connection string
# 5. Update MONGODB_URI in .env
```

### Issue 3: "Redis connection error"
**Solution:**
Redis is optional. The app will work without it.

To use Redis:
```bash
# Download Redis for Windows
# https://github.com/microsoftarchive/redis/releases

# Or comment out Redis code for now
```

### Issue 4: "Port 5000 already in use"
**Solution:**
```bash
# Change port in .env file
PORT=5001

# Or kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### Issue 5: "Firebase error"
**Solution:**
Firebase is optional for basic testing. Comment out or add dummy values:
```env
FIREBASE_PROJECT_ID=dummy
FIREBASE_PRIVATE_KEY=dummy
FIREBASE_CLIENT_EMAIL=dummy@dummy.com
```

---

## ✅ VERIFY INSTALLATION

### Test 1: Check Health Endpoint
```bash
# Start server first, then in another terminal:
curl http://localhost:5000/health

# Expected response:
# {"status":"OK","timestamp":"...","uptime":...}
```

### Test 2: Test Registration
```bash
curl -X POST http://localhost:5000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@test.com\",\"phone\":\"9876543210\",\"password\":\"test123\"}"
```

---

## 🚀 MINIMAL SETUP (For Quick Testing)

If you just want to test without MongoDB/Redis:

### 1. Update src/server.js (Temporary)
Comment out database connections:
```javascript
// Comment these lines temporarily
// await connectDatabase();
// await initializeRedis();
```

### 2. Start Server
```bash
node src/server.js
```

### 3. Test Basic Routes
```bash
curl http://localhost:5000/health
```

---

## 📝 RECOMMENDED SETUP ORDER

### For Hackathon/Demo:

1. ✅ **Install Node.js packages**
   ```bash
   npm install
   ```

2. ✅ **Install MongoDB** (Local or use Atlas)
   - Local: https://www.mongodb.com/try/download/community
   - Cloud: https://www.mongodb.com/cloud/atlas (Free)

3. ✅ **Configure .env**
   ```bash
   copy .env.example .env
   # Edit with your MongoDB URI and JWT secret
   ```

4. ✅ **Start Server**
   ```bash
   npm start
   ```

5. ⚠️ **Optional Later:**
   - Redis (for caching)
   - Firebase (for push notifications)
   - Google Maps API (for route optimization)

---

## 🎯 CURRENT STATUS CHECK

Run these commands to check your setup:

```bash
# Check Node.js
node --version
# Should show v16.x or higher

# Check npm
npm --version
# Should show 8.x or higher

# Check if packages are installed
cd BACKEND
dir node_modules
# Should show many folders

# Check MongoDB
mongod --version
# Should show MongoDB version

# Check if server file exists
dir src\server.js
# Should show the file
```

---

## 💡 QUICK START COMMANDS

```bash
# Navigate to project
cd C:\Users\anand\Desktop\ResQRoute\BACKEND

# Install everything
npm install

# Create config
copy .env.example .env

# Edit .env with:
# - MongoDB URI (required)
# - JWT Secret (required)

# Start server
npm start

# Test
curl http://localhost:5000/health
```

---

## 🆘 STILL HAVING ISSUES?

### Check These:

1. **Is Node.js installed?**
   ```bash
   node --version
   ```

2. **Are you in the right directory?**
   ```bash
   cd C:\Users\anand\Desktop\ResQRoute\BACKEND
   dir
   # Should see package.json and src folder
   ```

3. **Did npm install complete successfully?**
   ```bash
   npm install
   # Wait for completion, check for errors
   ```

4. **Is MongoDB running?**
   ```bash
   # Try connecting
   mongo
   # or
   mongosh
   ```

5. **Check the error messages carefully**
   - Copy the full error
   - Check line numbers
   - Look for "Cannot find module" or "Connection refused"

---

## 📞 Error Reference

| Error | Solution |
|-------|----------|
| "nodemon not found" | `npm install` |
| "Cannot find module" | `npm install` |
| "MongoDB connection failed" | Install/start MongoDB |
| "Port already in use" | Change PORT in .env |
| "ENOENT .env" | Create .env from .env.example |
| "Invalid JWT secret" | Add JWT_SECRET to .env |

---

## ✅ SUCCESS INDICATORS

You'll know it's working when you see:

```
🚀 Backend Server running on port 5000
📡 Environment: development
MongoDB connected successfully
Redis connected successfully (optional)
🔌 Socket.io Server running on port 5001
```

Then test:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{"status":"OK","timestamp":"...","uptime":12.34}
```

---

**Need more help? All code is working and tested. Follow these steps carefully!**