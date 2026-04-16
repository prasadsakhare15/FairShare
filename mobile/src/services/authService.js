import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from './userService';

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const logout = async () => {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
};

export const getCurrentUser = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return await getProfile();
  } catch {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    return null;
  }
};

export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return !!token;
};
