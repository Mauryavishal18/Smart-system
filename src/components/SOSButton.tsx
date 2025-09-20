import React, { useState } from 'react';
import { AlertTriangle, Phone, MapPin, Clock } from 'lucide-react';
import { createEmergencyAlert } from '../services/emergencyService';

interface SOSButtonProps {
  onEmergency: () => void;
  location: { latitude: number; longitude: number } | null;
  isActive: boolean;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onEmergency, location, isActive }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSOSPress = async () => {
    if (loading || isActive) return;

    setLoading(true);
    setIsPressed(true);

    // Start countdown
    let count = 5;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        triggerEmergency();
      }
    }, 1000);

    // Allow cancellation during countdown
    setTimeout(() => {
      if (countdown > 0) {
        clearInterval(countdownInterval);
        setIsPressed(false);
        setCountdown(0);
        setLoading(false);
      }
    }, 5000);
  };

  const triggerEmergency = async () => {
    try {
      await createEmergencyAlert({
        type: 'manual_sos',
        location: location || { latitude: 0, longitude: 0, address: 'Unknown' },
        sensorData: {
          accelerometer: { x: 0, y: 0, z: -9.8 },
          gyroscope: { x: 0, y: 0, z: 0 },
          speed: 0,
          heartRate: 85,
          oxygenLevel: 97
        }
      });

      onEmergency();
      setIsPressed(false);
      setCountdown(0);
    } catch (error) {
      console.error('Failed to create emergency alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = () => {
    setIsPressed(false);
    setCountdown(0);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency SOS</h3>
        
        {!isPressed ? (
          <button
            onClick={handleSOSPress}
            disabled={loading || isActive}
            className={`w-32 h-32 rounded-full font-bold text-xl transition-all duration-200 transform ${
              isActive 
                ? 'bg-green-500 text-white shadow-lg scale-110 animate-pulse'
                : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isActive ? (
              <div className="flex flex-col items-center">
                <AlertTriangle className="w-8 h-8 mb-1" />
                <span className="text-sm">ACTIVE</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Phone className="w-8 h-8 mb-1" />
                <span>SOS</span>
              </div>
            )}
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-orange-500 text-white flex flex-col items-center justify-center font-bold text-xl animate-pulse">
              <Clock className="w-8 h-8 mb-1" />
              <span>{countdown}</span>
            </div>
            <button
              onClick={cancelSOS}
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>
              {location 
                ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : 'Location: Not available'
              }
            </span>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="font-medium text-yellow-800 mb-1">How SOS Works:</p>
            <ul className="text-yellow-700 space-y-1">
              <li>• Press and hold for 5 seconds</li>
              <li>• Alerts sent to emergency contacts</li>
              <li>• Nearby volunteers notified</li>
              <li>• Location shared with responders</li>
              <li>• Government services contacted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSButton;