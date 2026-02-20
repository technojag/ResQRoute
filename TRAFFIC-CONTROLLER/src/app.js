require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const mqttClient = require('./mqtt/mqttClient');
const signalController = require('./controllers/signalController');
const emergencyOverrideController = require('./controllers/emergencyOverrideController');
const greenCorridorService = require('./services/greenCorridorService');

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ═══════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════
app.get('/health', (req, res) => {
  const mqttStatus = mqttClient.isConnected() ? 'connected' : 'disconnected';
  
  res.json({
    status: 'OK',
    service: 'Traffic Controller',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mqtt: mqttStatus,
    environment: process.env.NODE_ENV
  });
});

// ═══════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════

// Manual signal control
app.post('/api/signals/:signalId/override', emergencyOverrideController.overrideSignal);
app.post('/api/signals/:signalId/reset', emergencyOverrideController.resetSignal);
app.get('/api/signals/:signalId/status', signalController.getSignalStatus);

// Green corridor management
app.post('/api/green-corridor/create', emergencyOverrideController.createGreenCorridor);
app.post('/api/green-corridor/clear', emergencyOverrideController.clearGreenCorridor);
app.get('/api/green-corridor/active', emergencyOverrideController.getActiveCorridors);

// Emergency vehicle tracking
app.post('/api/emergency/vehicle-location', emergencyOverrideController.updateVehicleLocation);
app.get('/api/emergency/active-vehicles', emergencyOverrideController.getActiveVehicles);

// Signal network status
app.get('/api/signals/network-status', signalController.getNetworkStatus);
app.get('/api/signals/all', signalController.getAllSignals);

// Statistics
app.get('/api/stats/corridors', emergencyOverrideController.getCorridorStats);
app.get('/api/stats/signal-overrides', signalController.getOverrideStats);

// ═══════════════════════════════════════
//  404 HANDLER
// ═══════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ═══════════════════════════════════════
//  ERROR HANDLER
// ═══════════════════════════════════════
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ═══════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════
const startServer = async () => {
  try {
    // Initialize MQTT connection
    await mqttClient.connect();
    logger.info('MQTT client connected to broker');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║  🚦 Traffic Controller Service Started          ║');
      console.log('╚══════════════════════════════════════════════════╝');
      console.log(`\n  🌐  API URL    : http://localhost:${PORT}`);
      console.log(`  ❤️   Health    : http://localhost:${PORT}/health`);
      console.log(`  📡  MQTT Broker: ${process.env.MQTT_BROKER_URL}`);
      console.log(`  🚨  Mode       : ${process.env.NODE_ENV || 'development'}\n`);
      
      logger.info(`Traffic Controller running on port ${PORT}`);
    });

    // Subscribe to emergency vehicle topics
    mqttClient.subscribeToEmergencyVehicles();

    // Initialize green corridor service
    greenCorridorService.initialize();

  } catch (error) {
    logger.error('Failed to start Traffic Controller:', error);
    process.exit(1);
  }
};

// ═══════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ═══════════════════════════════════════
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mqttClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  mqttClient.disconnect();
  process.exit(0);
});

// ═══════════════════════════════════════
//  START APPLICATION
// ═══════════════════════════════════════
startServer();

module.exports = app;