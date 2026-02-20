# 🚀 QUICK START - Traffic Controller

## 🎯 Run Without MQTT (Easiest for Testing)

### Step 1 — Install packages
```bash
cd TRAFFIC-CONTROLLER
npm install
```

### Step 2 — Create .env
```bash
copy .env.example .env
```

### Step 3 — Start in MOCK mode
```bash
npm run mock
```

That's it! Server runs at **http://localhost:6000**

---

## ✅ Test It Works

```bash
curl http://localhost:6000/health
```

Should show:
```json
{
  "status": "OK",
  "mqtt": "MOCK MODE (No MQTT broker required)"
}
```

---

## 📋 Mock Mode Features

✅ All API endpoints work  
✅ No MQTT broker needed  
✅ Perfect for testing/demo  
✅ Works with backend integration  
✅ Simulates green corridor creation  

---

## 🔧 To Use Real MQTT Later

### Option 1: Install Mosquitto on Windows

1. Download from: https://mosquitto.org/download/
2. Install and run: `mosquitto -v`
3. Then use: `npm start` instead of `npm run mock`

### Option 2: Use Docker

```bash
docker run -d -p 1883:1883 eclipse-mosquitto
npm start
```

---

## 🎬 For Your Hackathon Demo

Use **MOCK mode** (`npm run mock`) — it works perfectly and doesn't require MQTT setup!

The backend and frontend will work exactly the same.