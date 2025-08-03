import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, db } from '../services/firebase';
import { doc, getDoc, setDoc, FirestoreError } from 'firebase/firestore';

// console.log("Firestore DB object imported:", db);

// Helper function to determine role based on email patterns
const determineRoleFromEmail = (email: string): string => {
  if (email.endsWith('@staff.pursuit.org')) { // Example staff pattern
    return 'staff';
  } else if (email.match(/^alum(ni)?-.+@pursuit\.org$/)) { // Example alumni pattern
    return 'alumni';
  } else if (email.endsWith('@builder.pursuit.org') || email.endsWith('@pursuit.org')) { // Example builder pattern (or default)
     // Catch-all for other @pursuit.org, might need refinement
    return 'builder';
  }
  return 'unknown'; // Should ideally not happen due to prior check
};

// Helper function to get role from Firestore or create/update if needed
const fetchOrCreateUserRole = async (user: User): Promise<string | null> => {
  if (!user.email || !user.uid) {
    // Keep critical errors visible
    console.error("User email or UID missing.");
    return null;
  }
  
  const userRef = doc(db, 'users', user.uid);
  // console.log(`Fetching/creating role for user: ${user.uid}, email: ${user.email}`);

  try {
    const docSnap = await getDoc(userRef);
    let determinedRole = determineRoleFromEmail(user.email);
    let currentRole = null;

    if (docSnap.exists()) {
      currentRole = docSnap.data()?.role;
      // console.log(`Existing role found in Firestore for ${user.uid}: ${currentRole}`);
      
      if (!currentRole) {
         // console.log(`Firestore role missing for ${user.uid}, using determined role: ${determinedRole}`);
         await setDoc(userRef, { email: user.email, role: determinedRole, displayName: user.displayName || 'N/A' }, { merge: true });
         currentRole = determinedRole;
      } else if (currentRole !== determinedRole) {
          // Keep warnings potentially useful
          console.warn(`Firestore role (${currentRole}) differs from email-determined role (${determinedRole}) for ${user.uid}. Using Firestore role.`);
      }
    } else {
      // console.log(`No Firestore record for ${user.uid}, creating with determined role: ${determinedRole}`);
      await setDoc(userRef, { email: user.email, role: determinedRole, displayName: user.displayName || 'N/A' });
      currentRole = determinedRole;
    }
    // console.log(`Final role for ${user.uid}: ${currentRole}`);
    return currentRole;
  } catch (error) {
    // Keep critical errors visible
    console.error(`Error fetching/setting role for user ${user.uid} in Firestore:`, error);
    if (error instanceof FirestoreError) {
        console.error("Firestore Error Code:", error.code);
    }
    return null;
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  role: string | null;
  driveAccessToken: string | null;
  signIn: () => Promise<any>;
  signInWithAccountSelect: () => Promise<any>;
  signOut: () => Promise<void>;
  getDriveAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // console.log(`Auth state change. User: ${user ? user.uid : 'null'}. Current loading: ${loading}`);
      
      if (user) {
        // Only allow @pursuit.org accounts
        const isPursuitEmail = user.email?.endsWith('@pursuit.org');
        
        if (!isPursuitEmail) {
          // Keep this important log
          console.log("Non-Pursuit email detected, signing out:", user.email);
          setError("Only @pursuit.org accounts are allowed.");
          await firebaseSignOut(auth);
          setUser(null);
          setRole(null);
        } else {
          console.log("Valid email detected:", user.email); // Add debug log
          setUser(user);
          setError(null);
          // console.log(`Fetching role for valid user: ${user.uid}`);
          const fetchedRole = await fetchOrCreateUserRole(user);
          console.log("Role fetched:", fetchedRole); // Add debug log
          setRole(fetchedRole);
          // console.log(`Auth state updated: User: ${user.uid}, Role: ${fetchedRole}`);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      
      setLoading(false);
      // console.log(`Finished auth state change. Loading: false, User: ${user ? user.uid : 'null'}, Role: ${role}`);
    });

    return () => {
      // console.log("Unsubscribing from auth state changes.");
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    setLoading(true); // Set loading true during sign-in process
    setError(null);
    setRole(null); // Reset role on new sign-in attempt
    try {
      // console.log("Starting Google sign in...");
      const result = await signInWithPopup(auth, googleProvider);
      // console.log("Sign in successful via popup for:", result.user.displayName);
      return result; // Return result for potential use elsewhere
    } catch (error: any) {
      // Keep critical errors visible
      console.error("Sign in error:", error);
      setError(error.message || "Sign in failed. Please try again.");
      setUser(null); // Ensure user is null on failed sign-in
      setRole(null);
      setLoading(false); // Set loading false on error
      throw error; // Re-throw error if needed
    }
  };

  const signInWithAccountSelect = async () => {
    setLoading(true);
    setError(null);
    setRole(null);
    try {
      // Create a new provider instance specifically for account selection
      const selectAccountProvider = new GoogleAuthProvider();
      selectAccountProvider.setCustomParameters({
        hd: 'pursuit.org',
        prompt: 'select_account'  // Always force account picker
      });
      
      console.log("Starting Google sign in with account selection...");
      const result = await signInWithPopup(auth, selectAccountProvider);
      console.log("Account selection sign in successful for:", result.user.displayName);
      return result;
    } catch (error: any) {
      console.error("Account selection sign in error:", error);
      setError(error.message || "Sign in failed. Please try again.");
      setUser(null);
      setRole(null);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true); // Indicate loading during sign out
    try {
      await firebaseSignOut(auth);
      // console.log("Firebase sign out successful.");
      // State updates (user, role to null) handled by onAuthStateChanged
      setUser(null);
      setRole(null);
      setDriveAccessToken(null);
    } catch (error) {
      // Keep critical errors visible
      console.error('Error signing out:', error);
      setError("Failed to sign out."); // Provide user feedback
      throw error;
    } finally {
      setLoading(false); // Ensure loading is set to false after attempt
    }
  };

  const getDriveAccessToken = async (): Promise<string | null> => {
    if (!user) {
      console.error('No user logged in');
      return null;
    }

    try {
      // Force fresh authentication to get OAuth access token with Drive scope
      console.log('🔄 Re-authenticating to get OAuth token with Drive scope...');
      
      // Create provider with Drive scope
      const driveProvider = new GoogleAuthProvider();
      driveProvider.setCustomParameters({
        hd: 'pursuit.org',
        prompt: 'consent' // Force consent to ensure we get the access token
      });
      driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
      
      const result = await signInWithPopup(auth, driveProvider);
      
      // Get the OAuth access token from the credential
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      if (accessToken) {
        console.log('✅ Got fresh OAuth access token with Drive scope');
        setDriveAccessToken(accessToken);
        return accessToken;
      }
      
      throw new Error('Could not retrieve OAuth access token from credential');
    } catch (error) {
      console.error('Failed to get Drive access token:', error);
      return null;
    }
  };

  // console.log("AuthContext Provider rerendering with values:", { user: user?.uid, loading, error, role });

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      role, 
      driveAccessToken,
      signIn, 
      signInWithAccountSelect, 
      signOut,
      getDriveAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 