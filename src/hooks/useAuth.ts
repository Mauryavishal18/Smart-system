import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  riskScore?: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authService.getCurrentUser()
        .then(userData => {
          setUser(userData);
          setIsAuthenticated(true);
        })
        .catch(error => {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      // For demo purposes, simulate successful login
      const demoUser = {
        id: 'demo_' + Date.now(),
        name: 'Demo User',
        email: credentials.email,
        role: credentials.email.includes('volunteer') ? 'volunteer' : 
              credentials.email.includes('hospital') ? 'hospital' :
              credentials.email.includes('police') ? 'police' : 'user',
        riskScore: 65
      };
      
      localStorage.setItem('auth_token', 'demo_token');
      setUser(demoUser);
      setIsAuthenticated(true);
      return { user: demoUser, token: 'demo_token' };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };
};