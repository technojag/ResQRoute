module.exports = {
  server: {
    port: process.env.PORT || 6000,
    env: process.env.NODE_ENV || 'development'
  },
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    clientId: process.env.MQTT_CLIENT_ID || 'traffic-controller-001',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  },
  signals: {
    defaultGreenDuration: parseInt(process.env.DEFAULT_GREEN_LIGHT_DURATION) || 45000,
    defaultRedDuration: parseInt(process.env.DEFAULT_RED_LIGHT_DURATION) || 60000,
    emergencyCorridorDuration: parseInt(process.env.EMERGENCY_GREEN_CORRIDOR_DURATION) || 120000,
    minYellowDuration: parseInt(process.env.MIN_YELLOW_LIGHT_DURATION) || 3000
  },
  geo: {
    signalCoverageRadius: parseInt(process.env.SIGNAL_COVERAGE_RADIUS) || 200,
    routeBufferRadius: parseInt(process.env.ROUTE_BUFFER_RADIUS) || 500
  }
};