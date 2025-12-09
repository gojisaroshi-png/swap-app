import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBht0X0ntBSfXmaUPPcDzNCI2PoXLQSA9o",
  authDomain: "swap-app-bbb7d.firebaseapp.com",
  projectId: "swap-app-bbb7d",
  storageBucket: "swap-app-bbb7d.firebasestorage.app",
  messagingSenderId: "308001868000",
  appId: "1:308001868000:web:48aa6b758f605a8ea8e885",
  measurementId: "G-T3HF5YXEGF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { db, auth };