import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import api from '../services/api';

interface UseAPIOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useAPI = <T,>(
  endpoint: string,
  options: UseAPIOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await (api as any)[endpoint]();
        setData(response.data);
        options.onSuccess?.(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'An error occurred';
        setError(errorMessage);
        message.error(errorMessage);
        options.onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, options]);

  return { data, loading, error };
};

/**
 * Hook for authentication
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      setUser(response.data.user);
      message.success('Login successful');
      return true;
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return { isAuthenticated, user, loading, login, logout };
};

/**
 * Hook for form submission
 */
export const useFormSubmit = (
  submitFn: (data: any) => Promise<any>,
  options: UseAPIOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await submitFn(data);
      options.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      message.error(errorMessage);
      options.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
};
