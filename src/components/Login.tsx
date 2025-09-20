import React, { useState } from 'react';
import { AlertTriangle, Shield, Users, Phone } from 'lucide-react';

interface LoginProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await onLogin({ email: formData.email, password: formData.password });
      } else {
        // Registration logic would go here
        console.log('Registration:', formData);
        // For demo, just login after registration
        await onLogin({ email: formData.email, password: formData.password });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: string) => {
    const demoCredentials = {
      user: { email: 'user@demo.com', password: 'demo123' },
      volunteer: { email: 'volunteer@demo.com', password: 'demo123' },
      hospital: { email: 'hospital@demo.com', password: 'demo123' },
      police: { email: 'police@demo.com', password: 'demo123' }
    };

    setLoading(true);
    try {
      await onLogin(demoCredentials[role] || demoCredentials.user);
    } catch (err: any) {
      setError('Demo login failed. Using default credentials.');
      // Simulate successful login for demo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Welcome Section */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Emergency Guardian</h1>
              <p className="text-lg text-gray-600">AI-Powered Emergency Detection System</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Real-Time Protection</h3>
                <p className="text-gray-600">AI monitors your safety 24/7 using advanced sensors</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Phone className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Instant Emergency Response</h3>
                <p className="text-gray-600">One-click SOS alerts emergency contacts and nearby help</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="w-6 h-6 text-purple-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Community Network</h3>
                <p className="text-gray-600">Connect with volunteers, hospitals, and emergency services</p>
              </div>
            </div>
          </div>

          {/* Demo Login Buttons */}
          <div className="bg-white/50 backdrop-blur rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Try Demo As:</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => demoLogin('user')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                disabled={loading}
              >
                Regular User
              </button>
              <button
                onClick={() => demoLogin('volunteer')}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                disabled={loading}
              >
                Volunteer
              </button>
              <button
                onClick={() => demoLogin('hospital')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                disabled={loading}
              >
                Hospital
              </button>
              <button
                onClick={() => demoLogin('police')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                disabled={loading}
              >
                Police
              </button>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Access your emergency protection dashboard'
                : 'Join our life-saving emergency network'
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="user">Regular User</option>
                    <option value="volunteer">Volunteer Responder</option>
                    <option value="hospital">Hospital Staff</option>
                    <option value="police">Police Officer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="user@demo.com for demo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="demo123 for demo"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;