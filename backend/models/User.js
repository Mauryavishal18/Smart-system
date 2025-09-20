import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'volunteer', 'hospital', 'police', 'admin'],
    default: 'user'
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String
  }],
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    conditions: [String]
  },
  driverProfile: {
    riskScore: { type: Number, default: 50 },
    totalTrips: { type: Number, default: 0 },
    accidentCount: { type: Number, default: 0 },
    lastRiskUpdate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceTokens: [String], // For push notifications
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);