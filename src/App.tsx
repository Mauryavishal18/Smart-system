import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, Activity, Shield, Users, Guitar as Hospital, Car } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SOSButton from './components/SOSButton';
import MapView from './components/MapView';
import RiskAssessment from './components/RiskAssessment';
import EmergencyHistory from './components/EmergencyHistory';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useSocket } from './hooks/useSocket';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const { user, login, logout, isAuthenticated } = useAuth();
  const { location, updateLocation } = useLocation();
  const socket = useSocket();

  useEffect(() => {
    // Listen for emergency alerts
    if (socket) {
      socket.on('emergency_alert', (data) => {
        console.log('Emergency alert received:', data);
        // Handle incoming emergency alerts
      });

      socket.on('emergency_update', (data) => {
        console.log('Emergency update:', data);
        // Handle emergency status updates
      });
    }

    return () => {
      if (socket) {
        socket.off('emergency_alert');
        socket.off('emergency_update');
      }
    };
  }, [socket]);

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'map', label: 'Live Map', icon: MapPin },
    { id: 'risk', label: 'Risk Assessment', icon: Shield },
    { id: 'history', label: 'Emergency History', icon: AlertTriangle },
    { id: 'network', label: 'Rescue Network', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Emergency Banner */}
      {emergencyActive && (
        <div className="bg-red-600 text-white p-3 text-center font-semibold">
          <AlertTriangle className="inline-block w-5 h-5 mr-2" />
          EMERGENCY ACTIVE - Help is on the way
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Guardian</h1>
                <p className="text-sm text-gray-600">AI-Powered Emergency Detection System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">System Active</span>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
              </div>
              
              <button
                onClick={logout}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === item.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SOS Button - Always Visible */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <SOSButton
                onEmergency={() => setEmergencyActive(true)}
                location={location}
                isActive={emergencyActive}
              />
              
              {/* Quick Stats */}
              <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Risk Score</span>
                    </div>
                    <span className="font-semibold text-blue-600">{user?.riskScore || 50}/100</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Safe Trips</span>
                    </div>
                    <span className="font-semibold text-green-600">42</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Nearby Help</span>
                    </div>
                    <span className="font-semibold text-orange-600">8 Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'map' && <MapView location={location} />}
            {activeTab === 'risk' && <RiskAssessment />}
            {activeTab === 'history' && <EmergencyHistory />}
            {activeTab === 'network' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Rescue Network</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Hospital className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-blue-900">Hospitals</h3>
                    <p className="text-blue-700">3 nearby facilities</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Users className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-green-900">Volunteers</h3>
                    <p className="text-green-700">12 active helpers</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <Phone className="w-8 h-8 text-red-600 mb-2" />
                    <h3 className="font-semibold text-red-900">Emergency Services</h3>
                    <p className="text-red-700">24/7 available</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Emergency Overlay */}
      {emergencyActive && (
        <div className="fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">EMERGENCY ACTIVE</h2>
            <p className="text-gray-700 mb-4">Help has been notified and is on the way</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setEmergencyActive(false)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                I'm Safe
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                Need Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;