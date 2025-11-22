/**
 * API Index - Export tất cả API services
 */

// Import all services first (ESLint requirement)
import emailApi from './emailApi';
import aiAlertApi from './aiAlertApi';
import firebaseApi from './firebaseApi';
import personalizedAlertApi from './personalizedAlertApi';

// API Client & Config
export { default as apiClient, apiClientWithRetry } from './client';
export * from './config';

// Email APIs
export * from './emailApi';
export { default as emailApi } from './emailApi';

// AI Alert APIs
export * from './aiAlertApi';
export { default as aiAlertApi } from './aiAlertApi';

// Firebase APIs
export * from './firebaseApi';
export { default as firebaseApi } from './firebaseApi';

// Personalized Alert APIs
export * from './personalizedAlertApi';
export { default as personalizedAlertApi } from './personalizedAlertApi';

/**
 * Convenience object với tất cả APIs
 */

export const api = {
  email: emailApi,
  aiAlert: aiAlertApi,
  firebase: firebaseApi,
  personalized: personalizedAlertApi,
};

export default api;

