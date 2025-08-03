import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNrgy9wfXZgEClHbXzGa0kMz-5DruFfOE",
  authDomain: "pursuitshipped-8892b.firebaseapp.com",
  projectId: "pursuitshipped-8892b",
  storageBucket: "pursuitshipped-8892b.firebasestorage.app",
  messagingSenderId: "97901159610",
  appId: "1:97901159610:web:8dde7c32e8aae3f9438e83",
  measurementId: "G-VTS6BHZ5ZT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure default OAuth for Pursuit accounts (remembers last account)
googleProvider.setCustomParameters({
  hd: 'pursuit.org'  // Restrict to @pursuit.org domain only
});

// Add Google Drive API scopes for file upload
googleProvider.addScope('https://www.googleapis.com/auth/drive.file'); 