/**
 * Firebase Configuration
 * Initialize Firebase app and services
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjU-UIf6pjFeKboqM0wFGYTTBTXllEc_E",
  authDomain: "hackathon-weather-634bf.firebaseapp.com",
  projectId: "hackathon-weather-634bf",
  storageBucket: "hackathon-weather-634bf.firebasestorage.app",
  messagingSenderId: "571676910483",
  appId: "1:571676910483:web:8fd3feebf30803ac19be66",
  measurementId: "G-BNMMF9YHSP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Analytics (optional - chỉ chạy trên production)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, analytics };
export default app;
