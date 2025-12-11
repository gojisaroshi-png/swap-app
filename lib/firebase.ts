// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBojHdyU_nmKUsQ6FlIu2Umkpc1rmX1Z7Q",
  authDomain: "blockchain-lavka.firebaseapp.com",
  projectId: "blockchain-lavka",
  storageBucket: "blockchain-lavka.firebasestorage.app",
  messagingSenderId: "207878567702",
  appId: "1:207878567702:web:5a8bc64a19757d693d8237"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { db, auth };