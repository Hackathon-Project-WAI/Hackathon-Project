/**
 * Firebase Configuration
 * Initialize Firebase app and services
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjU-UIf6pjFeKboqM0wFGYTTBTXllEc_E",
  authDomain: "hackathon-weather-634bf.firebaseapp.com",
  databaseURL:
    "https://hackathon-weather-634bf-default-rtdb.asia-southeast1.firebasedatabase.app",
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

// Initialize Realtime Database
const db = getDatabase(app);

// Initialize Analytics (optional - chỉ chạy trên production)
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, auth, db, analytics };
export default app;
