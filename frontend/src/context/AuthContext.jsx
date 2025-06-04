import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/auth/me');
          
          setCurrentUser(res.data); // Setează utilizatorul
        } catch (error) {
          console.error('Eroare la preluarea utilizatorului:', error);
          localStorage.removeItem('token');
          setCurrentUser(null);
          navigate('/login');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      console.log('Răspuns login:', res.data); // Log pentru depanare
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      setCurrentUser(user); // Setează doar obiectul user
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Eroare la login:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}