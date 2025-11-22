/**
 * API Client - Axios instance với interceptors và error handling
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './config';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token, log requests, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Log request (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // Có thể thêm authentication token ở đây
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý responses và errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Xử lý errors
    if (error.response) {
      // Server trả về error response
      const { status, data } = error.response;
      
      console.error(`❌ API Error ${status}:`, data?.error || data?.message || 'Unknown error');
      
      // Xử lý các status codes đặc biệt
      switch (status) {
        case 400:
          console.error('Bad Request - Kiểm tra lại tham số');
          break;
        case 401:
          console.error('Unauthorized - Token hết hạn hoặc không hợp lệ');
          // Có thể redirect về login page
          break;
        case 403:
          console.error('Forbidden - Không có quyền truy cập');
          break;
        case 404:
          console.error('Not Found - Endpoint không tồn tại');
          break;
        case 500:
          console.error('Internal Server Error');
          break;
        case 503:
          console.error('Service Unavailable - Backend chưa sẵn sàng');
          break;
        default:
          console.error(`Error ${status}`);
      }
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('❌ No response from server:', error.message);
      console.error('Kiểm tra backend có đang chạy không (http://localhost:3001)');
    } else {
      // Lỗi khác
      console.error('❌ Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Retry logic cho failed requests
 */
export const apiClientWithRetry = async (requestFn, retries = 3, delay = 1000) => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0 && error.response?.status >= 500) {
      console.log(`🔄 Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClientWithRetry(requestFn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export default apiClient;

