const mongoose = require('mongoose');

const fireStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide fire station name'],
    trim: true
  },
  stationCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  // Location
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  // Contact Information
  phone: {
    type: String,
    required: true
  },
  emergencyPhone: {
    type: String,
    default: '101'
  },
  email: String,
  // Coverage Area
  coverageRadius: {
    type: Number, // in kilometers
    default: 5
  },
  jurisdictionAreas: [String], // List of areas/localities covered
  // Staff
  staff: {
    fireOfficers: { type: Number, default: 0 },
    firefighters: { type: Number, default: 0 },
    drivers: { type: Number, default: 0 },
    support: { type: Number, default: 0 }
  },
  // Resources
  resources: {
    fireTrucks: { type: Number, default: 0 },
    waterTankers: { type: Number, default: 0 },
    rescueVehicles: { type: Number, default: 0 },
    ladderTrucks: { type: Number, default: 0 },
    foamTenders: { type: Number, default: 0 }
  },
  // Equipment
  equipment: {
    fireHoses: { type: Number, default: 0 },
    extinguishers: { type: Number, default: 0 },
    breathingApparatus: { type: Number, default: 0 },
    thermalCameras: { type: Number, default: 0 },
    rescueTools: { type: Number, default: 0 },
    protectiveGear: { type: Number, default: 0 }
  },
  // Water Supply
  waterSupply: {
    internalTankCapacity: { type: Number, default: 0 }, // in liters
    currentLevel: { type: Number, default: 0 },
    externalSources: [String] // Nearby water sources
  },
  // Capabilities
  capabilities: {
    structuralFire: { type: Boolean, default: true },
    vehicleFire: { type: Boolean, default: true },
    wildfire: { type: Boolean, default: false },
    chemicalFire: { type: Boolean, default: false },
    highRiseRescue: { type: Boolean, default: false },
    waterRescue: { type: Boolean, default: false },
    hazmat: { type: Boolean, default: false }
  },
  // Admin
  chiefOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  operationalStatus: {
    type: String,
    enum: ['fully_operational', 'limited', 'maintenance', 'emergency_only'],
    default: 'fully_operational'
  },
  // Statistics
  stats: {
    totalIncidents: { type: Number, default: 0 },
    resolvedIncidents: { type: Number, default: 0 },
    activeIncidents: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in minutes
    liveSaved: { type: Number, default: 0 },
    propertySaved: { type: Number, default: 0 } // estimated value
  },
  // Operating Hours
  operatingHours: {
    type: String,
    default: '24/7'
  },
  is24x7: {
    type: Boolean,
    default: true
  },
  // Last updated
  lastResourceUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index
fireStationSchema.index({ location: '2dsphere' });
fireStationSchema.index({ stationCode: 1 });
fireStationSchema.index({ isActive: 1, operationalStatus: 1 });

// Check if station can handle incident
fireStationSchema.methods.canHandleIncident = function(incidentType, severity) {
  if (!this.isActive || this.operationalStatus === 'maintenance') {
    return false;
  }

  // Check capabilities
  const capabilityMap = {
    'building_fire': 'structuralFire',
    'vehicle_fire': 'vehicleFire',
    'forest_fire': 'wildfire',
    'chemical_fire': 'chemicalFire',
    'electrical_fire': 'structuralFire',
    'gas_leak': 'hazmat'
  };

  const requiredCapability = capabilityMap[incidentType];
  if (requiredCapability && !this.capabilities[requiredCapability]) {
    return false;
  }

  // Check resource availability
  if (this.stats.activeIncidents >= this.resources.fireTrucks) {
    return false;
  }

  return true;
};

// Calculate match score for incident
fireStationSchema.methods.calculateMatchScore = function(incidentLocation, incidentDetails) {
  let score = 100;

  // Distance penalty (0-40 points)
  const geoUtils = require('../../utils/geoUtils');
  const distance = geoUtils.calculateDistanceInKm(
    { latitude: incidentLocation.coordinates[1], longitude: incidentLocation.coordinates[0] },
    { latitude: this.location.coordinates[1], longitude: this.location.coordinates[0] }
  );
  score -= Math.min(40, distance * 4);

  // Resource availability (0-30 points)
  const availableUnits = this.resources.fireTrucks - this.stats.activeIncidents;
  if (availableUnits === 0) score -= 30;
  else if (availableUnits === 1) score -= 15;

  // Capability match (0-20 points)
  const hasSpecializedEquipment = this.capabilities[incidentDetails.requiredCapability];
  if (!hasSpecializedEquipment) score -= 20;

  // Performance bonus (0-10 points)
  const performanceRatio = this.stats.totalIncidents > 0 
    ? (this.stats.resolvedIncidents / this.stats.totalIncidents) * 10
    : 5;
  score += performanceRatio;

  return Math.max(0, Math.min(100, score));
};

const FireStation = mongoose.model('FireStation', fireStationSchema);

module.exports = FireStation;