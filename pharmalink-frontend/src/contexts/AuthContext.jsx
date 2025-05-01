import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = baseURL;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (token) {
          const response = await axios.get('/api/auth/me');
          setUser({ ...response.data, isAdmin });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return user;
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const adminLogin = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/admin/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('isAdmin', 'true');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ ...user, isAdmin: true });
      
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg ||
                          'Admin login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register/user', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg ||
                          'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    adminLogin,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 