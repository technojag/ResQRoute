const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Please provide vehicle number'],
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['basic', 'als', 'bls', 'neonatal', 'air'],
    required: true,
    default: 'basic'
    // basic: Basic Life Support
    // als: Advanced Life Support
    // bls: Basic Life Support with more equipment
    // neonatal: For newborns
    // air: Air ambulance
  },
  // Ownership
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  hospitalType: {
    type: String,
    enum: ['government', 'private'],
    required: true
  },
  // Driver Information
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paramedic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Vehicle Details
  make: String,
  model: String,
  year: Number,
  capacity: {
    type: Number,
    default: 2 // Number of patients
  },
  // Equipment
  equipment: {
    oxygen: { type: Boolean, default: true },
    ventilator: { type: Boolean, default: false },
    defibrillator: { type: Boolean, default: false },
    ecgMonitor: { type: Boolean, default: false },
    suction: { type: Boolean, default: true },
    stretcher: { type: Boolean, default: true },
    wheelChair: { type: Boolean, default: true },
    firstAidKit: { type: Boolean, default: true },
    medications: [String]
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
    enum: ['available', 'on_duty', 'maintenance', 'offline'],
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
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalBooking'
  },
  currentRoute: {
    startPoint: {
      type: [Number], // [longitude, latitude]
    },
    endPoint: {
      type: [Number],
    },
    estimatedTime: Number, // in minutes
    actualRoute: [[Number]] // Array of coordinates
  },
  // Performance Metrics
  metrics: {
    totalTrips: { type: Number, default: 0 },
    successfulTrips: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in minutes
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
  // Insurance and Documents
  insurance: {
    company: String,
    policyNumber: String,
    validUpto: Date
  },
  registrationValidUpto: Date,
  pollutionCertificateValidUpto: Date,
  fitnessValidUpto: Date,
  // Fuel
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'cng', 'electric'],
    default: 'diesel'
  },
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  // Last Updated
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index
ambulanceSchema.index({ currentLocation: '2dsphere' });
ambulanceSchema.index({ status: 1, isAvailable: 1, isActive: 1 });
ambulanceSchema.index({ hospitalId: 1, status: 1 });

// Update location
ambulanceSchema.methods.updateLocation = async function(latitude, longitude) {
  this.currentLocation.coordinates = [longitude, latitude];
  this.lastLocationUpdate = Date.now();
  return await this.save();
};

// Update status
ambulanceSchema.methods.updateStatus = async function(status) {
  this.status = status;
  this.isAvailable = status === 'available';
  this.lastStatusUpdate = Date.now();
  return await this.save();
};

// Assign booking
ambulanceSchema.methods.assignBooking = async function(bookingId) {
  this.currentBooking = bookingId;
  this.status = 'on_duty';
  this.isAvailable = false;
  return await this.save();
};

// Complete trip
ambulanceSchema.methods.completeTrip = async function(rating = null) {
  this.currentBooking = null;
  this.currentRoute = {};
  this.status = 'available';
  this.isAvailable = true;
  this.metrics.totalTrips += 1;
  this.metrics.successfulTrips += 1;
  
  if (rating) {
    this.metrics.totalRatings += 1;
    this.metrics.averageRating = 
      ((this.metrics.averageRating * (this.metrics.totalRatings - 1)) + rating) / 
      this.metrics.totalRatings;
  }
  
  return await this.save();
};

// Check if ambulance can handle emergency type
ambulanceSchema.methods.canHandleEmergency = function(emergencyType, requiresAdvancedSupport = false) {
  if (!this.isActive || !this.isAvailable) {
    return false;
  }

  if (requiresAdvancedSupport && this.vehicleType === 'basic') {
    return false;
  }

  return true;
};

// Calculate match score
ambulanceSchema.methods.calculateMatchScore = function(pickupLocation, emergencyDetails) {
  let score = 100;

  // Distance penalty (0-40 points)
  const geoUtils = require('../../utils/geoUtils');
  const distance = geoUtils.calculateDistanceInKm(
    { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
    { latitude: this.currentLocation.coordinates[1], longitude: this.currentLocation.coordinates[0] }
  );
  score -= Math.min(40, distance * 3);

  // Vehicle type match (0-30 points)
  if (emergencyDetails.severity === 'critical' && this.vehicleType !== 'als') {
    score -= 30;
  }

  // Equipment availability (0-20 points)
  if (emergencyDetails.requiresVentilator && !this.equipment.ventilator) score -= 20;
  if (emergencyDetails.requiresDefibrillator && !this.equipment.defibrillator) score -= 20;

  // Performance bonus (0-10 points)
  score += this.metrics.averageRating * 2;

  return Math.max(0, Math.min(100, score));
};

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);

module.exports = Ambulance;