import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['manual_sos', 'accident_detected', 'medical_emergency', 'panic_button'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'false_alarm'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
    accuracy: Number
  },
  sensorData: {
    accelerometer: {
      x: Number,
      y: Number,
      z: Number
    },
    gyroscope: {
      x: Number,
      y: Number,
      z: Number
    },
    speed: Number,
    heartRate: Number,
    oxygenLevel: Number,
    impact: Number
  },
  aiAnalysis: {
    accidentProbability: Number,
    riskFactors: [String],
    recommendedAction: String
  },
  responders: [{
    responderId: { type: mongoose.Schema.Types.ObjectId },
    responderType: { type: String, enum: ['volunteer', 'hospital', 'police'] },
    status: { type: String, enum: ['notified', 'acknowledged', 'en_route', 'arrived'] },
    eta: Number,
    notifiedAt: Date,
    acknowledgedAt: Date
  }],
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    event: String,
    details: mongoose.Schema.Types.Mixed
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Index for geospatial queries
emergencySchema.index({ "location.latitude": 1, "location.longitude": 1 });
emergencySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Emergency', emergencySchema);