import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('finbuddy_token'));


  // Load user on app start
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Handle global 401 interceptor logout event
  useEffect(() => {
    const handleGlobalLogout = () => {
      setUser(null);
      setToken(null);
      disconnectSocket();
    };
    window.addEventListener('auth:logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth:logout', handleGlobalLogout);
    };
  }, []);

  const loadUser = async () => {
    try {
      // Silently refresh token on startup to extend the 7-day session window
      const { data } = await api.post('/auth/refresh');
      saveAuth(data.token, data.user);
    } catch (error) {
      localStorage.removeItem('finbuddy_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    saveAuth(data.token, data.user);
    toast.success(`Welcome to FinBuddy, ${data.user.name}! 🎉`);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    if (data.requires2FA) {
      return { requires2FA: true, userId: data.userId };
    }

    saveAuth(data.token, data.user);
    toast.success(`Welcome back, ${data.user.name}! 💰`);
    return data;
  };

  const verify2FA = async (userId, otp) => {
    const { data } = await api.post('/auth/verify-otp', { userId, otp });
    saveAuth(data.token, data.user);
    toast.success('Logged in successfully!');
    return data;
  };

  // Handle Google OAuth success (called after redirect)
  const handleGoogleSuccess = (token) => {
    localStorage.setItem('finbuddy_token', token);
    setToken(token);
    loadUser();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { }
    localStorage.removeItem('finbuddy_token');
    localStorage.removeItem('finbuddy_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
    toast.success('Logged out!');
  };

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
    try {
      const current = JSON.parse(localStorage.getItem('finbuddy_user') || '{}');
      localStorage.setItem('finbuddy_user', JSON.stringify({ ...current, ...updatedUser }));
    } catch (e) {}
  };

  const saveAuth = (newToken, newUser) => {
    localStorage.setItem('finbuddy_token', newToken);
    setToken(newToken);
    setUser(newUser);
    connectSocket(newToken);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      loading,
      register,
      login,
      verify2FA,
      handleGoogleSuccess,
      logout,
      updateUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
