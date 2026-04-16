import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Production API URL ─────────────────────────────────────────────────────
// Define EXPO_PUBLIC_API_URL in your .env file or build environment.
// Falls back to a predefined constant if omitted.
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'https://api.fairshare.example.com';

// Dev: use dev machine's IP from Expo connection (works on physical device same WiFi)
// Emulator: 10.0.2.2 for Android, localhost for iOS
const getApiBaseUrl = () => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.replace(/^exp:\/\//, '').split(':')[0] || hostUri.split(':')[0];
      if (host && host !== 'localhost' && !host.startsWith('127.')) {
        return `http://${host}:3001`; // physical device – same machine as Metro
      }
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
  }
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
export const API_TIMEOUT = 30000; // 30 seconds timeout
