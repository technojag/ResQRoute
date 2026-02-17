const mongoose = require('mongoose');

const medicalBookingSchema = new mongoose.Schema({
  // Booking Reference
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Patient Information
  patientDetails: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
    },
    phone: String,
    weight: Number,
    existingConditions: [String],
    allergies: [String],
    currentMedications: [String]
  },
  // Emergency Details
  emergencyType: {
    type: String,
    enum: [
      'cardiac_arrest',
      'accident',
      'breathing_difficulty',
      'severe_bleeding',
      'stroke',
      'unconscious',
      'burns',
      'poisoning',
      'pregnancy_emergency',
      'fracture',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  symptoms: [String],
  description: String,
  // Location Information
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      street: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  // Hospital Selection
  hospitalPreference: {
    type: String,
    enum: ['government', 'private'],
    required: true
  },
  selectedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  hospitalSelectionMethod: {
    type: String,
    enum: ['auto', 'ai_recommended', 'manual'],
    default: 'auto'
  },
  // For private hospital - AI recommendations shown
  aiRecommendations: [{
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    matchScore: Number,
    distance: Number,
    estimatedCost: Number
  }],
  // Ambulance Assignment
  assignedAmbulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance'
  },
  ambulanceAssignedAt: Date,
  // Status Tracking
  status: {
    type: String,
    enum: [
      'pending',           // Just created
      'searching',         // Looking for ambulance
      'ambulance_assigned',// Ambulance assigned
      'ambulance_enroute', // Ambulance on the way to pickup
      'patient_picked',    // Patient picked up
      'enroute_hospital',  // On the way to hospital
      'reached_hospital',  // Reached hospital
      'completed',         // Successfully completed
      'cancelled',         // Cancelled
      'failed'            // Failed to complete
    ],
    default: 'pending'
  },
  // Timeline
  timeline: [{
    status: String,
    timestamp: Date,
    location: {
      type: [Number] // [longitude, latitude]
    },
    note: String
  }],
  // ETA and Distance
  estimatedPickupTime: Number, // in minutes
  estimatedHospitalTime: Number, // in minutes
  distanceToPickup: Number, // in km
  distanceToHospital: Number, // in km
  // Actual Times
  ambulanceDispatchedAt: Date,
  ambulanceReachedPickupAt: Date,
  patientPickedAt: Date,
  reachedHospitalAt: Date,
  completedAt: Date,
  // Route Information
  route: {
    pickupToPatient: [[Number]], // Array of [longitude, latitude]
    patientToHospital: [[Number]]
  },
  // Payment Information
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'free', 'insurance', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'insurance', 'government_scheme', 'free']
  },
  governmentScheme: {
    type: String,
    enum: ['ayushman_bharat', 'cghs', 'esic', 'state_health_scheme', 'none'],
    default: 'none'
  },
  // Additional Services
  additionalServices: {
    oxygenRequired: { type: Boolean, default: false },
    ventilatorRequired: { type: Boolean, default: false },
    wheelchairRequired: { type: Boolean, default: false },
    stretcherRequired: { type: Boolean, default: true },
    medicalEscort: { type: Boolean, default: false }
  },
  // Rating and Feedback
  rating: {
    ambulanceService: Number,
    driverBehavior: Number,
    hospitalService: Number,
    overallExperience: Number
  },
  feedback: String,
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
    notified: { type: Boolean, default: false }
  },
  // Notes
  driverNotes: String,
  hospitalNotes: String,
  adminNotes: String,
  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  // Priority (for internal use)
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  // Traffic Control Integration
  greenCorridorActivated: {
    type: Boolean,
    default: false
  },
  greenCorridorRoute: [[Number]],
  // Multi-emergency coordination
  linkedEmergencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FireBooking'
  }]
}, {
  timestamps: true
});

// Indexes
medicalBookingSchema.index({ bookingId: 1 });
medicalBookingSchema.index({ userId: 1, createdAt: -1 });
medicalBookingSchema.index({ status: 1, createdAt: -1 });
medicalBookingSchema.index({ assignedAmbulance: 1, status: 1 });
medicalBookingSchema.index({ selectedHospital: 1, status: 1 });
medicalBookingSchema.index({ pickupLocation: '2dsphere' });

// Generate unique booking ID
medicalBookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingId = `MB${timestamp}${random}`;
  }
  next();
});

// Add timeline entry
medicalBookingSchema.methods.addTimelineEntry = async function(status, note = '', location = null) {
  this.timeline.push({
    status,
    timestamp: new Date(),
    location,
    note
  });
  return await this.save();
};

// Update status
medicalBookingSchema.methods.updateStatus = async function(status, note = '') {
  const previousStatus = this.status;
  this.status = status;
  
  // Update timestamps based on status
  const now = new Date();
  switch(status) {
    case 'ambulance_assigned':
      this.ambulanceAssignedAt = now;
      break;
    case 'ambulance_enroute':
      this.ambulanceDispatchedAt = now;
      break;
    case 'patient_picked':
      this.patientPickedAt = now;
      break;
    case 'reached_hospital':
      this.reachedHospitalAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      break;
  }
  
  // Add to timeline
  await this.addTimelineEntry(status, note);
  
  return await this.save();
};

// Calculate response time
medicalBookingSchema.methods.getResponseTime = function() {
  if (this.ambulanceReachedPickupAt && this.createdAt) {
    return Math.round((this.ambulanceReachedPickupAt - this.createdAt) / 1000 / 60); // in minutes
  }
  return null;
};

// Calculate total time
medicalBookingSchema.methods.getTotalTime = function() {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / 1000 / 60); // in minutes
  }
  return null;
};

const MedicalBooking = mongoose.model('MedicalBooking', medicalBookingSchema);

module.exports = MedicalBooking;