const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'hospital_admin', 'fire_station_admin', 'ambulance_driver', 'fire_truck_driver', 'dispatcher', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalHistory: [{
    condition: String,
    since: Date,
    notes: String
  }],
  allergies: [String],
  currentMedications: [String],
  // For drivers
  licenseNumber: String,
  licenseExpiry: Date,
  vehicleAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'vehicleType'
  },
  vehicleType: {
    type: String,
    enum: ['Ambulance', 'FireTruck']
  },
  // For hospital/fire station admins
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'organizationType'
  },
  organizationType: {
    type: String,
    enum: ['Hospital', 'FireStation']
  },
  // Notification tokens
  fcmTokens: [String],
  // Location (for drivers)
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
  isOnline: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index
userSchema.index({ currentLocation: '2dsphere' });

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;