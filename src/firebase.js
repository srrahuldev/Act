import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8rc-zjWRDGBMBjXDPanrzewFMRPShMgw",
  authDomain: "studenttask-41a4c.firebaseapp.com",
  projectId: "studenttask-41a4c",
  storageBucket: "studenttask-41a4c.firebasestorage.app",
  messagingSenderId: "704276598352",
  appId: "1:704276598352:web:5a9918c40a00a992f30b55",
  measurementId: "G-4JZ1GRLB1D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, analytics, db, auth, googleProvider };
