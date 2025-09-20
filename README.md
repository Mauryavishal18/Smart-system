# Emergency Detection System - Complete Implementation

A comprehensive real-time Emergency Help + Accident Detection System built with MERN stack, IoT integration, and AI/ML capabilities.

## 🚨 System Overview

This system provides 24/7 emergency monitoring and response through:
- **AI-powered accident detection** using sensor data
- **Real-time SOS alerts** with one-click emergency button
- **Crowdsourced rescue network** connecting volunteers and emergency services
- **IoT integration** with ESP32, OBD-II, and health sensors
- **Multi-channel notifications** (SMS, push notifications, calls)
- **Government service integration** (police, ambulance, hospitals)

## 🏗️ Architecture

### Frontend (React Web App)
- **Dashboard**: Real-time monitoring with AI risk assessment
- **SOS System**: One-click emergency alerts with location tracking
- **Live Map**: Google Maps integration showing nearby help
- **Risk Assessment**: AI-driven driver behavior analysis
- **Emergency History**: Complete log of all incidents

### Backend (Node.js + Express)
- **REST APIs**: User management, emergency alerts, rescue network
- **Real-time Communication**: Socket.IO for live updates
- **Security**: AES encryption, JWT authentication, rate limiting
- **Multi-channel Notifications**: Twilio SMS, Firebase push notifications
- **Database**: MongoDB with proper indexing and schemas

### AI/ML Service (Python + Flask)
- **Accident Detection**: ML models using accelerometer, gyroscope data
- **Risk Prediction**: Behavioral analysis for driver safety scoring
- **Anomaly Detection**: Unusual patterns in driving behavior
- **Real-time Analysis**: Live sensor data processing and alerts

### IoT Module (ESP32)
- **Sensor Integration**: MPU6050 (accelerometer/gyroscope), MAX30105 (heart rate/SpO2)
- **Vehicle Data**: OBD-II integration for speed, RPM, engine diagnostics
- **Offline Capability**: GSM module for SMS alerts when WiFi unavailable
- **Independent Operation**: Works without phone connectivity

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and Python 3.8+
- MongoDB (local or Atlas)
- Google Maps API key
- Twilio account (for SMS)
- ESP32 development board with sensors

### 1. Clone and Install Dependencies

```bash
# Install all dependencies
npm install

# Install Python dependencies for AI service
cd ai-service
pip install flask flask-cors numpy pandas scikit-learn joblib
cd ..
```

### 2. Environment Setup

Create `.env` file in the root directory:
```env
# Backend Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/emergency_system

# Twilio (SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Start Development Environment

```bash
# Start all services (frontend + backend + AI service)
npm run dev

# Or start individually:
npm run dev:frontend  # React frontend on http://localhost:5173
npm run dev:backend   # Node.js backend on http://localhost:5000
npm run dev:ai        # Python AI service on http://localhost:8000
```

### 4. Demo Login Credentials

The system includes demo accounts for testing:
- **Regular User**: `user@demo.com` / `demo123`
- **Volunteer**: `volunteer@demo.com` / `demo123`
- **Hospital**: `hospital@demo.com` / `demo123`
- **Police**: `police@demo.com` / `demo123`

## 📱 Live Demo Workflow

### 1. Accident Simulation
1. **Start Monitoring**: Click "Start Monitoring" on the dashboard
2. **Trigger Emergency**: Press the red SOS button (5-second countdown)
3. **AI Detection**: System simulates sensor data showing accident detection
4. **Automatic Alerts**: AI determines accident probability and triggers alerts

### 2. Multi-Channel Response
1. **SMS Alerts**: Emergency contacts receive SMS notifications
2. **Push Notifications**: Nearby volunteers get push notifications
3. **Government Services**: Police, ambulance, and hospitals are notified
4. **Real-time Updates**: Live dashboard shows emergency status

### 3. Rescue Coordination
1. **Live Map**: Shows emergency location and nearby responders
2. **Volunteer Response**: Volunteers can acknowledge and provide ETA
3. **Status Updates**: Real-time tracking of response progress
4. **Resolution**: Emergency can be marked as resolved

### 4. AI Risk Assessment
1. **Behavior Analysis**: System analyzes driving patterns
2. **Risk Scoring**: Real-time risk score based on sensor data
3. **Predictive Alerts**: Warnings for dangerous driving behavior
4. **Safety Recommendations**: Personalized safety tips

## 🔧 IoT Hardware Setup

### ESP32 Wiring Diagram
```
ESP32 Pin Connections:
- GPIO 16/17: GSM Module (TX/RX)
- GPIO 18/19: OBD-II Interface (TX/RX)
- GPIO 21/22: I2C (SDA/SCL) for sensors
- GPIO 2: Status LED
- GPIO 4: Emergency buzzer
- GPIO 21: Emergency button
- 3.3V/GND: Power for sensors
```

### Required Components
- ESP32 development board
- MPU6050 (accelerometer/gyroscope)
- MAX30105 (heart rate/SpO2 sensor)
- SIM800L GSM module
- ELM327 OBD-II adapter
- Buzzer, LED, push button
- Breadboard and jumper wires

### Flashing Firmware
1. Install Arduino IDE with ESP32 board package
2. Install required libraries: WiFi, ArduinoJson, Adafruit_MPU6050, MAX30105
3. Update WiFi credentials and server URL in the code
4. Flash the firmware to ESP32

## 🧠 AI/ML Models

### Accident Detection Model
- **Training Data**: 10,000+ synthetic samples of normal vs accident patterns
- **Features**: Accelerometer (X,Y,Z), Gyroscope (X,Y,Z), Speed, Heart Rate, SpO2
- **Algorithm**: Random Forest Classifier with 100 estimators
- **Accuracy**: ~92% on synthetic test data
- **Thresholds**: >70% probability triggers emergency alert

### Risk Assessment Model
- **Behavioral Analysis**: Speed patterns, acceleration changes, turning behavior
- **Scoring**: 0-100 risk score based on recent driving history
- **Categories**: Low (0-40), Medium (41-70), High (71-100)
- **Real-time Updates**: Continuous scoring based on live sensor data

### Anomaly Detection
- **Algorithm**: Isolation Forest for detecting unusual patterns
- **Training**: Only normal driving data for unsupervised learning
- **Use Case**: Detect previously unseen dangerous behaviors
- **Integration**: Combined with accident detection for higher accuracy

## 🔒 Security Features

### Data Protection
- **Encryption**: AES-256 encryption for sensitive data storage
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API protection against abuse
- **HTTPS**: All communications encrypted in transit
- **Data Anonymization**: Personal data anonymized in analytics

### Privacy Controls
- **Consent Management**: Clear opt-in/opt-out for data sharing
- **Location Privacy**: Location data encrypted and access-controlled
- **Data Retention**: Automatic deletion of old emergency records
- **Audit Logging**: Complete audit trail of all system access

## 🌐 API Documentation

### Emergency Endpoints
```javascript
// Create emergency alert
POST /api/emergency/alert
{
  "type": "manual_sos",
  "location": { "latitude": 28.6139, "longitude": 77.2090 },
  "sensorData": { "accelerometer": {...}, "heartRate": 85 }
}

// Get active emergencies
GET /api/emergency/active?lat=28.6139&lng=77.2090&radius=10

// Update emergency status
PATCH /api/emergency/:id/status
{
  "status": "resolved",
  "notes": "False alarm - user safe"
}
```

### AI Service Endpoints
```javascript
// Analyze emergency situation
POST /api/analyze-emergency
{
  "sensorData": {...},
  "type": "accident_detected",
  "location": {...}
}

// Assess driving risk
POST /api/assess-risk
{
  "drivingHistory": [...],
  "currentSensorData": {...}
}
```

## 📊 Monitoring and Analytics

### System Health
- **Real-time Metrics**: Response times, error rates, uptime
- **Alert Monitoring**: Failed notifications, system failures
- **Performance Tracking**: API response times, database performance
- **IoT Device Status**: Online/offline status of emergency devices

### Emergency Analytics
- **Response Times**: Average time from alert to first response
- **Geographic Patterns**: Heat maps of emergency locations
- **Effectiveness Metrics**: False positive rates, successful rescues
- **User Behavior**: Risk score trends, safety improvement

## 🚀 Production Deployment

### Cloud Infrastructure
- **Backend**: Heroku, AWS EC2, or Google Cloud Run
- **Database**: MongoDB Atlas with replica sets
- **AI Service**: AWS Lambda or Google Cloud Functions
- **CDN**: Cloudflare for static assets
- **Monitoring**: New Relic, DataDog, or Prometheus

### Scaling Considerations
- **Horizontal Scaling**: Load balancers for multiple backend instances
- **Database Optimization**: Proper indexing, read replicas
- **Caching**: Redis for session management and frequently accessed data
- **Message Queues**: Bull/Redis for handling high-volume notifications

### Security in Production
- **SSL Certificates**: HTTPS everywhere with Let's Encrypt
- **Environment Variables**: Secure credential management
- **Firewall**: Network-level security controls
- **Intrusion Detection**: Monitoring for suspicious activities

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow ESLint/Prettier configurations
2. **Testing**: Write unit tests for all new features
3. **Documentation**: Update README and API docs
4. **Security**: Run security audits before deployment

### Feature Requests
- **AI Improvements**: Better accident detection algorithms
- **Integration**: Additional emergency service APIs
- **Mobile Apps**: React Native versions for iOS/Android
- **Wearable Support**: Smartwatch integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support and Contact

For technical support, demo requests, or questions:
- **Email**: support@emergencyguardian.com
- **Documentation**: [docs.emergencyguardian.com](https://docs.emergencyguardian.com)
- **Issues**: GitHub Issues for bug reports
- **Discord**: [Community Discord Server](https://discord.gg/emergency-guardian)

---

**⚠️ IMPORTANT**: This is a demonstration system. For production use in life-critical applications, additional testing, certification, and compliance with local emergency service protocols is required.

**🚨 EMERGENCY**: In real emergencies, always call your local emergency number (911, 112, 108, etc.) directly.