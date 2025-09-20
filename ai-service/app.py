#!/usr/bin/env python3

import os
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import logging
from datetime import datetime, timedelta
import joblib
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AccidentDetector:
    def __init__(self):
        self.scaler = StandardScaler()
        self.accident_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.risk_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        
        # Train with synthetic data
        self._train_models()
    
    def _generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic training data for accident detection"""
        np.random.seed(42)
        
        # Normal driving patterns
        normal_data = []
        for _ in range(n_samples // 2):
            # Normal acceleration (0-2 m/s²)
            accel_x = np.random.normal(0, 0.5)
            accel_y = np.random.normal(0, 0.5)
            accel_z = np.random.normal(-9.8, 0.5)  # Gravity
            
            # Normal gyroscope (-0.5 to 0.5 rad/s)
            gyro_x = np.random.normal(0, 0.2)
            gyro_y = np.random.normal(0, 0.2)
            gyro_z = np.random.normal(0, 0.2)
            
            # Normal speed (0-80 km/h)
            speed = np.random.uniform(0, 80)
            
            # Normal heart rate and oxygen
            heart_rate = np.random.normal(75, 10)
            oxygen_level = np.random.normal(98, 2)
            
            normal_data.append([
                accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,
                speed, heart_rate, oxygen_level, 0  # 0 = no accident
            ])
        
        # Accident patterns
        accident_data = []
        for _ in range(n_samples // 2):
            # High impact acceleration
            accel_x = np.random.normal(0, 3) + np.random.choice([-15, 15])
            accel_y = np.random.normal(0, 3) + np.random.choice([-15, 15])
            accel_z = np.random.normal(-9.8, 3) + np.random.choice([-10, 10])
            
            # High rotation during impact
            gyro_x = np.random.normal(0, 2) + np.random.choice([-5, 5])
            gyro_y = np.random.normal(0, 2) + np.random.choice([-5, 5])
            gyro_z = np.random.normal(0, 2) + np.random.choice([-5, 5])
            
            # Speed during accident
            speed = np.random.uniform(20, 120)
            
            # Stressed vitals
            heart_rate = np.random.normal(110, 20)
            oxygen_level = np.random.normal(94, 4)
            
            accident_data.append([
                accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,
                speed, heart_rate, oxygen_level, 1  # 1 = accident
            ])
        
        data = normal_data + accident_data
        columns = ['accel_x', 'accel_y', 'accel_z', 'gyro_x', 'gyro_y', 'gyro_z',
                  'speed', 'heart_rate', 'oxygen_level', 'accident']
        
        return pd.DataFrame(data, columns=columns)
    
    def _train_models(self):
        """Train the ML models with synthetic data"""
        try:
            logger.info("Training accident detection models...")
            
            # Generate training data
            df = self._generate_synthetic_data()
            
            # Features and target
            feature_cols = ['accel_x', 'accel_y', 'accel_z', 'gyro_x', 'gyro_y', 'gyro_z',
                           'speed', 'heart_rate', 'oxygen_level']
            X = df[feature_cols]
            y = df['accident']
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train accident detection model
            self.accident_model.fit(X_scaled, y)
            
            # Train anomaly detector on normal data only
            normal_data = X_scaled[y == 0]
            self.anomaly_detector.fit(normal_data)
            
            # Train risk assessment model
            risk_labels = self._generate_risk_labels(X)
            self.risk_model.fit(X_scaled, risk_labels)
            
            self.is_trained = True
            logger.info("Models trained successfully")
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
    
    def _generate_risk_labels(self, X):
        """Generate risk labels based on driving patterns"""
        risk_scores = []
        for _, row in X.iterrows():
            risk = 0
            
            # High speed risk
            if row['speed'] > 80:
                risk += 2
            elif row['speed'] > 60:
                risk += 1
            
            # High acceleration risk
            accel_magnitude = np.sqrt(row['accel_x']**2 + row['accel_y']**2 + row['accel_z']**2)
            if accel_magnitude > 12:
                risk += 2
            elif accel_magnitude > 10:
                risk += 1
            
            # High rotation risk
            gyro_magnitude = np.sqrt(row['gyro_x']**2 + row['gyro_y']**2 + row['gyro_z']**2)
            if gyro_magnitude > 2:
                risk += 2
            elif gyro_magnitude > 1:
                risk += 1
            
            # Health risk factors
            if row['heart_rate'] > 100 or row['oxygen_level'] < 95:
                risk += 1
            
            # Convert to risk categories (0=low, 1=medium, 2=high)
            if risk >= 4:
                risk_scores.append(2)  # High risk
            elif risk >= 2:
                risk_scores.append(1)  # Medium risk
            else:
                risk_scores.append(0)  # Low risk
        
        return risk_scores
    
    def detect_accident(self, sensor_data):
        """Detect accident from sensor data"""
        if not self.is_trained:
            return {'error': 'Models not trained'}
        
        try:
            # Extract features
            features = [
                sensor_data.get('accelerometer', {}).get('x', 0),
                sensor_data.get('accelerometer', {}).get('y', 0),
                sensor_data.get('accelerometer', {}).get('z', -9.8),
                sensor_data.get('gyroscope', {}).get('x', 0),
                sensor_data.get('gyroscope', {}).get('y', 0),
                sensor_data.get('gyroscope', {}).get('z', 0),
                sensor_data.get('speed', 0),
                sensor_data.get('heartRate', 75),
                sensor_data.get('oxygenLevel', 98)
            ]
            
            # Scale features
            features_scaled = self.scaler.transform([features])
            
            # Predict accident probability
            accident_prob = self.accident_model.predict_proba(features_scaled)[0][1]
            
            # Detect anomalies
            anomaly_score = self.anomaly_detector.score_samples(features_scaled)[0]
            is_anomaly = self.anomaly_detector.predict(features_scaled)[0] == -1
            
            # Assess risk
            risk_level = self.risk_model.predict(features_scaled)[0]
            
            # Determine if accident detected
            accident_detected = accident_prob > 0.7 or (is_anomaly and accident_prob > 0.4)
            
            return {
                'accident_detected': bool(accident_detected),
                'accident_probability': float(accident_prob),
                'anomaly_score': float(anomaly_score),
                'risk_level': ['low', 'medium', 'high'][risk_level],
                'confidence': float(accident_prob if accident_detected else 1 - accident_prob)
            }
            
        except Exception as e:
            logger.error(f"Error in accident detection: {e}")
            return {'error': str(e)}
    
    def assess_driving_risk(self, driving_history):
        """Assess overall driving risk from historical data"""
        if not driving_history:
            return {'risk_score': 50, 'risk_level': 'medium'}
        
        try:
            risk_factors = []
            total_score = 0
            
            # Analyze recent driving patterns
            for record in driving_history[-100:]:  # Last 100 records
                sensor_data = record.get('sensorData', {})
                
                # Speed analysis
                speed = sensor_data.get('speed', 0)
                if speed > 100:
                    risk_factors.append('Excessive speeding detected')
                    total_score += 10
                elif speed > 80:
                    total_score += 5
                
                # Acceleration analysis
                accel = sensor_data.get('accelerometer', {})
                accel_magnitude = np.sqrt(accel.get('x', 0)**2 + accel.get('y', 0)**2 + accel.get('z', -9.8)**2)
                if accel_magnitude > 15:
                    risk_factors.append('Hard braking/acceleration detected')
                    total_score += 8
                elif accel_magnitude > 12:
                    total_score += 4
                
                # Gyroscope analysis (sharp turns)
                gyro = sensor_data.get('gyroscope', {})
                gyro_magnitude = np.sqrt(gyro.get('x', 0)**2 + gyro.get('y', 0)**2 + gyro.get('z', 0)**2)
                if gyro_magnitude > 3:
                    risk_factors.append('Sharp turns detected')
                    total_score += 6
                elif gyro_magnitude > 2:
                    total_score += 3
            
            # Calculate risk score (0-100)
            risk_score = min(100, max(0, 50 + (total_score / len(driving_history[-100:]) * 10)))
            
            # Determine risk level
            if risk_score > 80:
                risk_level = 'high'
            elif risk_score > 60:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            return {
                'risk_score': round(risk_score, 1),
                'risk_level': risk_level,
                'risk_factors': list(set(risk_factors)),
                'recommendations': self._get_safety_recommendations(risk_level)
            }
            
        except Exception as e:
            logger.error(f"Error in risk assessment: {e}")
            return {'error': str(e)}
    
    def _get_safety_recommendations(self, risk_level):
        """Get safety recommendations based on risk level"""
        recommendations = {
            'low': [
                'Continue maintaining safe driving habits',
                'Regular vehicle maintenance checks',
                'Stay alert and avoid distractions'
            ],
            'medium': [
                'Reduce speed and maintain safe following distance',
                'Avoid aggressive acceleration and braking',
                'Take breaks during long drives',
                'Check tire pressure and brake condition'
            ],
            'high': [
                'Immediately reduce driving speed',
                'Avoid driving during peak traffic hours',
                'Consider defensive driving course',
                'Have vehicle inspected by mechanic',
                'Take frequent breaks and stay hydrated',
                'Avoid night driving if possible'
            ]
        }
        
        return recommendations.get(risk_level, recommendations['medium'])

# Initialize the detector
detector = AccidentDetector()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'AI Emergency Detection Service',
        'version': '1.0.0',
        'models_trained': detector.is_trained
    })

@app.route('/api/analyze-emergency', methods=['POST'])
def analyze_emergency():
    """Analyze emergency situation using AI"""
    try:
        data = request.get_json()
        sensor_data = data.get('sensorData', {})
        emergency_type = data.get('type', 'unknown')
        location = data.get('location', {})
        
        # Detect accident
        accident_analysis = detector.detect_accident(sensor_data)
        
        # Generate recommendations
        recommendations = []
        risk_factors = []
        
        if accident_analysis.get('accident_detected'):
            recommendations.extend([
                'Immediate medical attention required',
                'Contact emergency services',
                'Do not move if spinal injury suspected'
            ])
            risk_factors.append('High impact detected')
        
        if sensor_data.get('heartRate', 75) > 100:
            risk_factors.append('Elevated heart rate')
            recommendations.append('Monitor vital signs')
        
        if sensor_data.get('oxygenLevel', 98) < 95:
            risk_factors.append('Low oxygen saturation')
            recommendations.append('Ensure clear airway')
        
        response = {
            'accidentProbability': accident_analysis.get('accident_probability', 0),
            'riskFactors': risk_factors,
            'recommendedAction': recommendations[0] if recommendations else 'Monitor situation',
            'confidence': accident_analysis.get('confidence', 0.5),
            'urgency': 'critical' if accident_analysis.get('accident_detected') else 'medium',
            'analysis': accident_analysis
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error analyzing emergency: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/assess-risk', methods=['POST'])
def assess_driving_risk():
    """Assess driving risk based on historical data"""
    try:
        data = request.get_json()
        driving_history = data.get('drivingHistory', [])
        current_sensor_data = data.get('currentSensorData', {})
        
        # Assess overall risk
        risk_assessment = detector.assess_driving_risk(driving_history)
        
        # Analyze current driving
        current_analysis = detector.detect_accident(current_sensor_data)
        
        response = {
            'riskScore': risk_assessment.get('risk_score', 50),
            'riskLevel': risk_assessment.get('risk_level', 'medium'),
            'riskFactors': risk_assessment.get('risk_factors', []),
            'recommendations': risk_assessment.get('recommendations', []),
            'currentDrivingStatus': {
                'safe': not current_analysis.get('accident_detected', False),
                'alertLevel': current_analysis.get('risk_level', 'medium')
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error assessing risk: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-behavior', methods=['POST'])
def predict_behavior():
    """Predict risky driving behavior"""
    try:
        data = request.get_json()
        sensor_data = data.get('sensorData', {})
        
        # Analyze current behavior
        analysis = detector.detect_accident(sensor_data)
        
        behaviors = []
        alerts = []
        
        # Check for specific risky behaviors
        speed = sensor_data.get('speed', 0)
        if speed > 80:
            behaviors.append('speeding')
            alerts.append(f'Speed warning: {speed} km/h detected')
        
        accel = sensor_data.get('accelerometer', {})
        accel_magnitude = np.sqrt(accel.get('x', 0)**2 + accel.get('y', 0)**2)
        if accel_magnitude > 8:
            behaviors.append('harsh_acceleration')
            alerts.append('Harsh acceleration detected')
        
        gyro = sensor_data.get('gyroscope', {})
        gyro_magnitude = np.sqrt(gyro.get('x', 0)**2 + gyro.get('y', 0)**2 + gyro.get('z', 0)**2)
        if gyro_magnitude > 2:
            behaviors.append('sharp_turning')
            alerts.append('Sharp turning detected')
        
        response = {
            'riskyBehaviors': behaviors,
            'alerts': alerts,
            'safetyScore': max(0, 100 - len(behaviors) * 20),
            'recommendations': [
                'Maintain steady speed',
                'Smooth acceleration and braking',
                'Gentle steering inputs'
            ]
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error predicting behavior: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)