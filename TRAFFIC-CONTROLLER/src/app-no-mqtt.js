require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock storage
const signals = new Map();
const corridors = new Map();
const vehicles = new Map();

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Traffic Controller',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mqtt: 'MOCK MODE (No MQTT broker required)',
    environment: process.env.NODE_ENV
  });
});

// Signal Control
app.post('/api/signals/:signalId/override', (req, res) => {
  const { signalId } = req.params;
  const { action, duration } = req.body;
  
  logger.info(`Signal ${signalId} overridden: ${action}`);
  
  signals.set(signalId, {
    id: signalId,
    state: 'GREEN',
    override: true,
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    message: 'Signal override successful (MOCK)',
    data: { signalId, action, duration }
  });
});

app.get('/api/signals/:signalId/status', (req, res) => {
  const signal = signals.get(req.params.signalId) || {
    id: req.params.signalId,
    state: 'RED',
    status: 'ONLINE'
  };
  
  res.json({ success: true, data: { signal } });
});

app.get('/api/signals/all', (req, res) => {
  const allSignals = Array.from(signals.values());
  res.json({
    success: true,
    count: allSignals.length,
    data: { signals: allSignals }
  });
});

// Green Corridor
app.post('/api/green-corridor/create', (req, res) => {
  const { vehicleId, vehicleType, route } = req.body;
  
  const corridorId = `corridor-${vehicleId}-${Date.now()}`;
  
  const corridor = {
    id: corridorId,
    vehicleId,
    vehicleType,
    signals: ['SIGNAL-001', 'SIGNAL-002', 'SIGNAL-003'],
    createdAt: new Date(),
    status: 'ACTIVE'
  };
  
  corridors.set(corridorId, corridor);
  
  logger.info(`Green corridor created: ${corridorId} (MOCK)`);
  
  res.json({
    success: true,
    message: 'Green corridor created (MOCK MODE)',
    data: { corridor }
  });
});

app.post('/api/green-corridor/clear', (req, res) => {
  const { corridorId, vehicleId } = req.body;
  
  let corridor = corridors.get(corridorId);
  if (!corridor && vehicleId) {
    corridor = Array.from(corridors.values()).find(c => c.vehicleId === vehicleId);
  }
  
  if (corridor) {
    corridors.delete(corridor.id);
    logger.info(`Green corridor cleared: ${corridor.id} (MOCK)`);
  }
  
  res.json({
    success: true,
    message: 'Green corridor cleared (MOCK)',
    data: { corridorId: corridor?.id }
  });
});

app.get('/api/green-corridor/active', (req, res) => {
  const activeCorridors = Array.from(corridors.values());
  res.json({
    success: true,
    count: activeCorridors.length,
    data: { corridors: activeCorridors }
  });
});

// Vehicle Tracking
app.post('/api/emergency/vehicle-location', (req, res) => {
  const { vehicleId, location, vehicleType } = req.body;
  
  vehicles.set(vehicleId, {
    id: vehicleId,
    type: vehicleType,
    location,
    lastUpdate: new Date()
  });
  
  logger.info(`Vehicle ${vehicleId} location updated (MOCK)`);
  
  res.json({
    success: true,
    message: 'Vehicle location updated (MOCK)',
    data: { vehicleId }
  });
});

app.get('/api/emergency/active-vehicles', (req, res) => {
  const activeVehicles = Array.from(vehicles.values());
  res.json({
    success: true,
    count: activeVehicles.length,
    data: { vehicles: activeVehicles }
  });
});

// Statistics
app.get('/api/stats/corridors', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        total: corridors.size,
        active: corridors.size,
        completed: 0
      }
    }
  });
});

app.get('/api/signals/network-status', (req, res) => {
  res.json({
    success: true,
    data: {
      network: {
        total: signals.size,
        online: signals.size,
        offline: 0,
        overridden: signals.size
      },
      mqttConnected: false,
      mode: 'MOCK - No MQTT required'
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  🚦 Traffic Controller (MOCK MODE)               ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n  🌐  API URL    : http://localhost:${PORT}`);
  console.log(`  ❤️   Health    : http://localhost:${PORT}/health`);
  console.log(`  📡  MQTT       : DISABLED (Mock mode for testing)`);
  console.log(`  🚨  Mode       : ${process.env.NODE_ENV || 'development'}\n`);
  
  logger.info(`Traffic Controller (MOCK) running on port ${PORT}`);
  logger.warn('Running in MOCK mode - no MQTT broker needed');
});

module.exports = app;