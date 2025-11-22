/**
 * Firebase Configuration
 * Initialize Firebase app and services
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyKjOpPq9UR4d1FOQvzO05v4i3C2Q9P8o",
  authDomain: "fir-hackathon-98bf5.firebaseapp.com",
  databaseURL:
    "https://fir-hackathon-98bf5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fir-hackathon-98bf5",
  storageBucket: "fir-hackathon-98bf5.firebasestorage.app",
  messagingSenderId: "121314874160",
  appId: "1:121314874160:web:1cc14e6fbe7992b103aef5",
  measurementId: "G-TDE2Q68S40",
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
