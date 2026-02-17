const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide hospital name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['government', 'private'],
    required: [true, 'Please specify hospital type']
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
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
  email: String,
  emergencyPhone: String,
  website: String,
  // Facilities and Services
  departments: [{
    name: String,
    available: { type: Boolean, default: true },
    bedsTotal: Number,
    bedsAvailable: Number
  }],
  specialties: [String], // Cardiology, Neurology, Orthopedics, etc.
  facilities: {
    emergencyRoom: { type: Boolean, default: true },
    icu: { type: Boolean, default: false },
    nicu: { type: Boolean, default: false },
    operationTheater: { type: Boolean, default: false },
    bloodBank: { type: Boolean, default: false },
    dialysis: { type: Boolean, default: false },
    xray: { type: Boolean, default: false },
    ctScan: { type: Boolean, default: false },
    mri: { type: Boolean, default: false },
    ventilators: { type: Number, default: 0 },
    oxygenBeds: { type: Number, default: 0 }
  },
  // Government Hospital Specific
  governmentSchemes: {
    ayushmanBharat: { type: Boolean, default: false },
    cghs: { type: Boolean, default: false },
    esic: { type: Boolean, default: false },
    stateHealthScheme: { type: Boolean, default: false }
  },
  // Private Hospital Specific
  pricing: {
    consultationFee: Number,
    emergencyFee: Number,
    icuPerDay: Number,
    generalWardPerDay: Number,
    privateRoomPerDay: Number
  },
  insurance: {
    accepted: { type: Boolean, default: false },
    companies: [String] // List of accepted insurance companies
  },
  // Capacity and Availability
  totalBeds: {
    type: Number,
    required: true
  },
  availableBeds: {
    type: Number,
    required: true
  },
  emergencyBedsAvailable: {
    type: Number,
    default: 0
  },
  icuBedsAvailable: {
    type: Number,
    default: 0
  },
  // Ratings and Reviews
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // Staff
  doctors: {
    type: Number,
    default: 0
  },
  nurses: {
    type: Number,
    default: 0
  },
  // Admin
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  acceptingEmergencies: {
    type: Boolean,
    default: true
  },
  // Statistics
  stats: {
    totalEmergencies: { type: Number, default: 0 },
    successfulTreatments: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in minutes
    averageWaitTime: { type: Number, default: 0 } // in minutes
  },
  // Last updated
  lastBedUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ type: 1, isActive: 1, acceptingEmergencies: 1 });

// Update bed availability
hospitalSchema.methods.updateBedAvailability = async function(bedsUsed) {
  this.availableBeds = Math.max(0, this.availableBeds - bedsUsed);
  this.lastBedUpdate = Date.now();
  return await this.save();
};

// Check if hospital can accept emergency
hospitalSchema.methods.canAcceptEmergency = function(emergencyType, requiresICU = false) {
  if (!this.isActive || !this.acceptingEmergencies) {
    return false;
  }

  if (requiresICU && this.icuBedsAvailable === 0) {
    return false;
  }

  if (this.emergencyBedsAvailable === 0 && this.availableBeds === 0) {
    return false;
  }

  return true;
};

// Calculate match score for emergency
hospitalSchema.methods.calculateMatchScore = function(patientLocation, emergencyDetails) {
  let score = 100;

  // Distance penalty (0-30 points)
  const geoUtils = require('../utils/geoUtils');
  const distance = geoUtils.calculateDistanceInKm(
    { latitude: patientLocation.coordinates[1], longitude: patientLocation.coordinates[0] },
    { latitude: this.location.coordinates[1], longitude: this.location.coordinates[0] }
  );
  score -= Math.min(30, distance * 2);

  // Bed availability (0-20 points)
  if (this.availableBeds === 0) score -= 20;
  else if (this.availableBeds < 5) score -= 10;

  // Facilities match (0-20 points)
  if (emergencyDetails.requiresICU && !this.facilities.icu) score -= 20;
  if (emergencyDetails.requiresVentilator && this.facilities.ventilators === 0) score -= 20;

  // Rating bonus (0-10 points)
  score += this.rating * 2;

  // Government hospital bonus for economically weaker sections
  if (this.type === 'government') {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;