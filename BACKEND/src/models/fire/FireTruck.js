const mongoose = require('mongoose');

const fireTruckSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Please provide vehicle number'],
    unique: true,
    uppercase: true,
    trim: true
  },
  truckType: {
    type: String,
    enum: ['pumper', 'ladder', 'tanker', 'rescue', 'hazmat', 'wildland'],
    required: true
  },
  // Ownership
  fireStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FireStation',
    required: true
  },
  // Crew
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  crew: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  crewCapacity: {
    type: Number,
    default: 6
  },
  // Vehicle Details
  make: String,
  model: String,
  year: Number,
  // Specifications
  specifications: {
    waterCapacity: { type: Number, default: 0 }, // in liters
    pumpCapacity: { type: Number, default: 0 }, // liters per minute
    ladderLength: { type: Number, default: 0 }, // in feet
    foamCapacity: { type: Number, default: 0 }, // in liters
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  // Equipment
  equipment: {
    hoses: { type: Number, default: 0 },
    nozzles: { type: Number, default: 0 },
    extinguishers: { type: Number, default: 0 },
    breathingApparatus: { type: Number, default: 0 },
    thermalCamera: { type: Boolean, default: false },
    jaws: { type: Boolean, default: false },
    chainsaw: { type: Boolean, default: false },
    generator: { type: Boolean, default: false },
    lightingEquipment: { type: Boolean, default: false },
    medicalKit: { type: Boolean, default: true },
    rescueRope: { type: Boolean, default: true }
  },
  // Current Location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  // Status
  status: {
    type: String,
    enum: ['available', 'on_scene', 'returning', 'maintenance', 'offline'],
    default: 'available'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Current Assignment
  currentIncident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FireBooking'
  },
  currentRoute: {
    startPoint: [Number],
    endPoint: [Number],
    estimatedTime: Number,
    actualRoute: [[Number]]
  },
  // Resource Levels
  resourceLevels: {
    waterLevel: { type: Number, min: 0, max: 100, default: 100 },
    foamLevel: { type: Number, min: 0, max: 100, default: 100 },
    fuelLevel: { type: Number, min: 0, max: 100, default: 100 }
  },
  // Performance Metrics
  metrics: {
    totalIncidents: { type: Number, default: 0 },
    successfulOperations: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  // Maintenance
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    cost: Number
  }],
  // Documents
  registrationValidUpto: Date,
  insuranceValidUpto: Date,
  fitnessValidUpto: Date,
  // Fuel
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel'],
    default: 'diesel'
  },
  // Last Updated
  lastLocationUpdate: Date,
  lastStatusUpdate: Date
}, {
  timestamps: true
});

// Indexes
fireTruckSchema.index({ currentLocation: '2dsphere' });
fireTruckSchema.index({ status: 1, isAvailable: 1 });
fireTruckSchema.index({ fireStationId: 1, status: 1 });

// Update location
fireTruckSchema.methods.updateLocation = async function(latitude, longitude) {
  this.currentLocation.coordinates = [longitude, latitude];
  this.lastLocationUpdate = Date.now();
  return await this.save();
};

// Update status
fireTruckSchema.methods.updateStatus = async function(status) {
  this.status = status;
  this.isAvailable = status === 'available';
  this.lastStatusUpdate = Date.now();
  return await this.save();
};

// Assign incident
fireTruckSchema.methods.assignIncident = async function(incidentId) {
  this.currentIncident = incidentId;
  this.status = 'on_scene';
  this.isAvailable = false;
  return await this.save();
};

// Complete operation
fireTruckSchema.methods.completeOperation = async function(rating = null) {
  this.currentIncident = null;
  this.currentRoute = {};
  this.status = 'available';
  this.isAvailable = true;
  this.metrics.totalIncidents += 1;
  this.metrics.successfulOperations += 1;
  
  if (rating) {
    this.metrics.totalRatings += 1;
    this.metrics.averageRating = 
      ((this.metrics.averageRating * (this.metrics.totalRatings - 1)) + rating) / 
      this.metrics.totalRatings;
  }
  
  return await this.save();
};

// Check capability
fireTruckSchema.methods.canHandleIncident = function(incidentType, severity) {
  if (!this.isActive || !this.isAvailable) return false;
  
  // Type-specific checks
  const typeCapability = {
    'building_fire': ['pumper', 'ladder', 'rescue'],
    'vehicle_fire': ['pumper', 'rescue'],
    'forest_fire': ['wildland', 'tanker'],
    'chemical_fire': ['hazmat', 'pumper'],
    'electrical_fire': ['pumper'],
    'industrial_fire': ['pumper', 'hazmat', 'rescue']
  };
  
  const capable = typeCapability[incidentType];
  return capable && capable.includes(this.truckType);
};

// Calculate match score
fireTruckSchema.methods.calculateMatchScore = function(incidentLocation, incidentDetails) {
  let score = 100;
  
  const geoUtils = require('../../utils/geoUtils');
  const distance = geoUtils.calculateDistanceInKm(
    { latitude: incidentLocation.coordinates[1], longitude: incidentLocation.coordinates[0] },
    { latitude: this.currentLocation.coordinates[1], longitude: this.currentLocation.coordinates[0] }
  );
  
  score -= Math.min(40, distance * 3);
  
  if (!this.canHandleIncident(incidentDetails.fireType, incidentDetails.severity)) {
    score -= 30;
  }
  
  if (this.resourceLevels.waterLevel < 50) score -= 10;
  if (this.resourceLevels.fuelLevel < 30) score -= 10;
  
  score += this.metrics.averageRating * 2;
  
  return Math.max(0, Math.min(100, score));
};

const FireTruck = mongoose.model('FireTruck', fireTruckSchema);

module.exports = FireTruck;