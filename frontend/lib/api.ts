import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_BASE_URL = 'rv_api_url';
const STORAGE_KEY_PHONE = 'rv_user_phone';
const STORAGE_KEY_PREFIXES = ['sb-', 'receiptvault_'];

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

// Use environment variable or localhost default
let BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Try to restore saved base URL
AsyncStorage.getItem(STORAGE_KEY_BASE_URL).then((url) => {
  if (url) BASE_URL = url;
});

export const setBaseUrl = async (url: string) => {
  BASE_URL = url;
  await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, url);
};

export const getBaseUrl = () => BASE_URL;

// Interceptor: add auth headers
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
});

apiClient.interceptors.request.use(async (config) => {
  const savedBaseUrl = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);
  if (savedBaseUrl) {
    BASE_URL = savedBaseUrl;
  }
  config.baseURL = `${BASE_URL}/api`;

  const phone = await AsyncStorage.getItem(STORAGE_KEY_PHONE);
  if (phone) {
    config.headers['x-user-phone'] = normalizePhone(phone);
  }
  return config;
});

export const api = apiClient;

// Auth endpoints
export const sendOtp = (phone: string) =>
  api.post('/auth/send-otp', { phone });

export const verifyOtp = (phone: string, otp: string) =>
  api.post('/auth/verify-otp', { phone, otp });

export const getOAuthConfig = () =>
  api.get('/auth/oauth-config');

export const getGoogleOAuthUrl = () =>
  axios.get(`${BASE_URL}/api/auth/google-url`);

export const getRegistrationStatus = (payload: { email?: string; phone?: string }) =>
  api.post('/auth/registration-status', payload);

export const registerOAuthUser = (payload: { phone: string; email: string; displayName?: string; emailVerified: boolean; otp?: string }) =>
  api.post('/auth/register-oauth', payload);

export const saveGoogleConsent = (payload: { userId: string; email: string; refreshToken: string }) =>
  api.post('/auth/google-consent', payload);

// Receipt endpoints
export const uploadReceipt = async (fileOrUri: File | string) => {
  const formData = new FormData();
  
  // Handle both Web File objects and React Native image URIs
  if (typeof fileOrUri === 'string') {
    // React Native - image URI from ImagePicker
    const filename = fileOrUri.split('/').pop() || 'receipt.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Create a blob-like object from the URI
    formData.append('receipt', {
      uri: fileOrUri,
      type,
      name: filename,
    } as any);
  } else {
    // Web File object
    formData.append('receipt', fileOrUri);
  }
  
  return api.post('/upload-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getReceipts = (limit?: number) =>
  api.get('/receipts', { params: { limit } });

export const getReceipt = (id: string) =>
  api.get(`/receipts/${id}`);

export const deleteReceipt = (id: string) =>
  api.delete(`/receipts/${id}`);

export const deleteAllReceipts = () =>
  api.delete('/receipts');

export const exportReceipts = () =>
  api.get('/export');

export const getSpendingAnalytics = (period: 'week' | 'month' | 'year' = 'week') =>
  api.get('/analytics/spending', { params: { period } });

export const getCategoryAnalytics = () =>
  api.get('/analytics/categories');

export const getTopMerchants = () =>
  api.get('/analytics/top-merchants');

export const getDashboardStats = () =>
  api.get('/dashboard/stats');

// User persistence
export const saveUserPhone = async (phone: string) => {
  await AsyncStorage.setItem(STORAGE_KEY_PHONE, normalizePhone(phone));
};

export const getUserPhone = () =>
  AsyncStorage.getItem(STORAGE_KEY_PHONE);

export const clearUserData = async () => {
  await AsyncStorage.multiRemove([STORAGE_KEY_PHONE, STORAGE_KEY_BASE_URL]);
};

export const clearAllLocalAuthData = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const supabaseKeys = keys.filter((key) => STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)));
  await AsyncStorage.multiRemove([...supabaseKeys, STORAGE_KEY_PHONE, STORAGE_KEY_BASE_URL]);
};
