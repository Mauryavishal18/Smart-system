import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Shield, TrendingUp, Heart, Zap } from 'lucide-react';

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({
    heartRate: 72,
    oxygenLevel: 98,
    speed: 0,
    accelerometer: { x: 0, y: 0, z: -9.8 },
    gyroscope: { x: 0, y: 0, z: 0 }
  });

  const [aiAnalysis, setAiAnalysis] = useState({
    riskLevel: 'low',
    accidentProbability: 0.1,
    recommendations: ['Continue safe driving', 'Maintain current speed']
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    let interval;
    
    if (isMonitoring) {
      // Simulate real-time sensor data
      interval = setInterval(() => {
        setSensorData({
          heartRate: 70 + Math.random() * 10,
          oxygenLevel: 96 + Math.random() * 4,
          speed: Math.max(0, Math.random() * 60),
          accelerometer: {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
            z: -9.8 + (Math.random() - 0.5) * 2
          },
          gyroscope: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2
          }
        });

        // Simulate AI analysis
        const riskFactors = Math.random();
        setAiAnalysis({
          riskLevel: riskFactors > 0.7 ? 'high' : riskFactors > 0.4 ? 'medium' : 'low',
          accidentProbability: riskFactors * 0.5,
          recommendations: [
            'Continue monitoring vitals',
            'Maintain safe driving practices',
            'Stay hydrated and alert'
          ]
        });
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getHeartRateColor = (rate) => {
    if (rate > 100) return 'text-red-600';
    if (rate > 85) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Monitoring Control */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Real-Time Monitoring</h2>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isMonitoring 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
        
        {isMonitoring && (
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">System actively monitoring your safety</span>
          </div>
        )}
      </div>

      {/* Vital Signs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heart Rate</p>
              <p className={`text-2xl font-bold ${getHeartRateColor(sensorData.heartRate)}`}>
                {Math.round(sensorData.heartRate)} BPM
              </p>
            </div>
            <Heart className={`w-8 h-8 ${getHeartRateColor(sensorData.heartRate)}`} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blood Oxygen</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(sensorData.oxygenLevel)}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Speed</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(sensorData.speed)} km/h
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Level</p>
              <p className={`text-2xl font-bold capitalize ${getRiskColor(aiAnalysis.riskLevel).split(' ')[0]}`}>
                {aiAnalysis.riskLevel}
              </p>
            </div>
            <Shield className={`w-8 h-8 ${getRiskColor(aiAnalysis.riskLevel).split(' ')[0]}`} />
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Safety Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Current Risk Assessment</h4>
            <div className={`p-4 rounded-lg ${getRiskColor(aiAnalysis.riskLevel)}`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold capitalize">{aiAnalysis.riskLevel} Risk</span>
              </div>
              <p className="text-sm mt-1">
                Accident Probability: {Math.round(aiAnalysis.accidentProbability * 100)}%
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">AI Recommendations</h4>
            <ul className="space-y-1">
              {aiAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sensor Data Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Sensor Data</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Accelerometer (m/s²)</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">X-axis:</span>
                <span className="font-mono text-sm">{sensorData.accelerometer.x.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Y-axis:</span>
                <span className="font-mono text-sm">{sensorData.accelerometer.y.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Z-axis:</span>
                <span className="font-mono text-sm">{sensorData.accelerometer.z.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Gyroscope (rad/s)</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">X-axis:</span>
                <span className="font-mono text-sm">{sensorData.gyroscope.x.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Y-axis:</span>
                <span className="font-mono text-sm">{sensorData.gyroscope.y.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Z-axis:</span>
                <span className="font-mono text-sm">{sensorData.gyroscope.z.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;