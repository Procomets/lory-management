import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';

export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isFirebaseActive: boolean;
  register: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Check localStorage for saved session if mock mode or initial fast load
    const saved = localStorage.getItem('lory_erp_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        let role: UserRole = (localStorage.getItem(`lory_erp_role_${user.uid}`) as UserRole) || 'employee';
        let name = user.displayName || 'User';

        try {
          // Fetch user document from Firestore users collection
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            role = (data.role as UserRole) || role;
            name = data.name || name;
          } else {
            // Document doesn't exist yet, attempt auto-creation in Firestore
            await setDoc(userDocRef, {
              uid: user.uid,
              name,
              email: user.email || '',
              role,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn("Firestore fetch error, utilizing local cached role profile:", err);
        }

        // Cache role locally for persistent quick load
        localStorage.setItem(`lory_erp_role_${user.uid}`, role);

        const profile: UserProfile = {
          uid: user.uid,
          name,
          email: user.email || '',
          role
        };

        localStorage.setItem('lory_erp_current_user', JSON.stringify(profile));
        setCurrentUser(profile);
      } else {
        localStorage.removeItem('lory_erp_current_user');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (name: string, email: string, pass: string, role: UserRole) => {
    setError(null);
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCred.user, { displayName: name });

        // Save profile in Firestore 'users' collection with specified role
        try {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            uid: userCred.user.uid,
            name,
            email,
            role,
            createdAt: new Date().toISOString()
          });
        } catch (firestoreErr) {
          console.error("Firestore setDoc write error on registration:", firestoreErr);
        }

        // Store role locally as fallback
        localStorage.setItem(`lory_erp_role_${userCred.user.uid}`, role);

        const profile: UserProfile = {
          uid: userCred.user.uid,
          name,
          email,
          role
        };

        localStorage.setItem('lory_erp_current_user', JSON.stringify(profile));
        setCurrentUser(profile);
      } else {
        // Mock Registration for local testing mode
        const mockUsers = JSON.parse(localStorage.getItem('lory_erp_mock_users') || '[]');
        const existing = mockUsers.find((u: UserProfile) => u.email.toLowerCase() === email.toLowerCase());
        
        if (existing) {
          throw new Error('An account with this email address already exists.');
        }

        const newUser: UserProfile = {
          uid: 'mock-' + Date.now(),
          name,
          email,
          role
        };

        mockUsers.push({ ...newUser, pass });
        localStorage.setItem('lory_erp_mock_users', JSON.stringify(mockUsers));
        localStorage.setItem('lory_erp_current_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
      }
    } catch (err: any) {
      console.error("Registration failed:", err);
      let msg = err.message || 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email format.';
      } else if (err.code?.includes('api-key-not-valid') || err.message?.includes('api-key-not-valid')) {
        console.warn("Invalid API key detected, completing registration in local test mode.");
        const mockUsers = JSON.parse(localStorage.getItem('lory_erp_mock_users') || '[]');
        const newUser: UserProfile = {
          uid: 'mock-' + Date.now(),
          name,
          email,
          role
        };
        mockUsers.push({ ...newUser, pass });
        localStorage.setItem('lory_erp_mock_users', JSON.stringify(mockUsers));
        localStorage.setItem('lory_erp_current_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
        setLoading(false);
        return;
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        
        let role: UserRole = (localStorage.getItem(`lory_erp_role_${userCred.user.uid}`) as UserRole) || 'employee';
        let name = userCred.user.displayName || 'User';

        try {
          // Fetch role from Firestore 'users' collection
          const userDocRef = doc(db, 'users', userCred.user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            role = (data.role as UserRole) || role;
            name = data.name || name;
          }
        } catch (err) {
          console.warn("Could not fetch user document from Firestore during login:", err);
        }

        // Cache role locally
        localStorage.setItem(`lory_erp_role_${userCred.user.uid}`, role);

        const profile: UserProfile = {
          uid: userCred.user.uid,
          name,
          email: userCred.user.email || email,
          role
        };

        localStorage.setItem('lory_erp_current_user', JSON.stringify(profile));
        setCurrentUser(profile);
      } else {
        // Mock Login
        const mockUsers = JSON.parse(localStorage.getItem('lory_erp_mock_users') || '[]');
        const userMatch = mockUsers.find(
          (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass
        );

        if (!userMatch) {
          throw new Error('Invalid email or password. Please check your credentials.');
        }

        const profile: UserProfile = {
          uid: userMatch.uid,
          name: userMatch.name,
          email: userMatch.email,
          role: userMatch.role
        };

        localStorage.setItem('lory_erp_current_user', JSON.stringify(profile));
        setCurrentUser(profile);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      let msg = err.message || 'Login failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code?.includes('api-key-not-valid') || err.message?.includes('api-key-not-valid')) {
        const mockUsers = JSON.parse(localStorage.getItem('lory_erp_mock_users') || '[]');
        const userMatch = mockUsers.find(
          (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass
        );
        if (userMatch) {
          const profile: UserProfile = {
            uid: userMatch.uid,
            name: userMatch.name,
            email: userMatch.email,
            role: userMatch.role
          };
          localStorage.setItem('lory_erp_current_user', JSON.stringify(profile));
          setCurrentUser(profile);
          setLoading(false);
          return;
        }
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem('lory_erp_current_user');
    setCurrentUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseActive: isFirebaseConfigured,
        register,
        login,
        logout,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
