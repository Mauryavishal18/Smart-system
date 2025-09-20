import express from 'express';
import Emergency from '../models/Emergency.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmergencyNotifications } from '../services/notificationService.js';
import { getNearbyResponders } from '../services/locationService.js';
import axios from 'axios';

const router = express.Router();

// Create emergency alert
router.post('/alert', authMiddleware, async (req, res) => {
  try {
    const {
      type,
      location,
      sensorData,
      priority = 'high'
    } = req.body;

    // Get AI analysis for the emergency
    let aiAnalysis = {};
    try {
      const aiResponse = await axios.post('http://localhost:8000/api/analyze-emergency', {
        sensorData,
        type,
        location
      });
      aiAnalysis = aiResponse.data;
    } catch (aiError) {
      console.log('AI service unavailable, proceeding without analysis');
      aiAnalysis = {
        accidentProbability: type === 'accident_detected' ? 0.8 : 0.5,
        riskFactors: ['Unknown'],
        recommendedAction: 'Immediate response required'
      };
    }

    // Create emergency record
    const emergency = new Emergency({
      userId: req.user.userId,
      type,
      location,
      sensorData,
      priority,
      aiAnalysis,
      timeline: [{
        timestamp: new Date(),
        event: 'Emergency created',
        details: { type, location }
      }]
    });

    await emergency.save();

    // Find nearby responders
    const nearbyResponders = await getNearbyResponders(location, 10); // 10km radius

    // Notify responders
    await sendEmergencyNotifications(emergency, nearbyResponders);

    // Emit real-time update
    req.io.emit('emergency_alert', {
      emergencyId: emergency._id,
      userId: req.user.userId,
      type,
      location,
      priority,
      aiAnalysis
    });

    res.status(201).json({
      message: 'Emergency alert created successfully',
      emergency: emergency,
      notifiedResponders: nearbyResponders.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update emergency status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const emergencyId = req.params.id;

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    emergency.status = status;
    if (notes) emergency.notes = notes;
    
    if (status === 'resolved') {
      emergency.resolvedAt = new Date();
      emergency.resolvedBy = req.user.userId;
    }

    emergency.timeline.push({
      timestamp: new Date(),
      event: `Status updated to ${status}`,
      details: { notes, updatedBy: req.user.userId }
    });

    await emergency.save();

    // Emit real-time update
    req.io.emit('emergency_update', {
      emergencyId: emergency._id,
      status,
      resolvedAt: emergency.resolvedAt
    });

    res.json({
      message: 'Emergency status updated',
      emergency
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's emergencies
router.get('/my-emergencies', authMiddleware, async (req, res) => {
  try {
    const emergencies = await Emergency.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ emergencies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active emergencies (for responders)
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, radius = 20 } = req.query;

    let query = { status: 'active' };

    // If location provided, find emergencies within radius
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      // Simple bounding box calculation (for demo)
      const latDelta = radiusKm / 111; // roughly 111km per degree
      const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));

      query['location.latitude'] = {
        $gte: latNum - latDelta,
        $lte: latNum + latDelta
      };
      query['location.longitude'] = {
        $gte: lngNum - lngDelta,
        $lte: lngNum + lngDelta
      };
    }

    const emergencies = await Emergency.find(query)
      .populate('userId', 'name phone emergencyContacts medicalInfo')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ emergencies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;