import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCo3m_Ey6NBHstnNH5E4Bc2Nq6onPbSwSs",
  authDomain: "notloom.firebaseapp.com",
  projectId: "notloom",
  storageBucket: "notloom.firebasestorage.app",
  messagingSenderId: "47073516739",
  appId: "1:47073516739:web:2c6c137d610fa79fd5d676",
  measurementId: "G-26MTBZZ2XG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Restrict authentication to Pursuit organization emails
googleProvider.setCustomParameters({
  hd: 'pursuit.org'
}); 