import { 
  collection, 
  getDocs, 
  setDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured, getSecondaryAuth } from '../firebase/config';
import type { UserRole } from '../context/AuthContext';

export interface ManagedUser {
  id?: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  createdAt?: string;
}

const LOCAL_USERS_KEY = 'lory_erp_users';
const MOCK_USERS_KEY = 'lory_erp_mock_users';

// Fetch all users from Firestore & local storage
export const getUsers = async (): Promise<ManagedUser[]> => {
  let localUsers: ManagedUser[] = [];
  
  // 1. Load from local storage
  const storedUsers = localStorage.getItem(LOCAL_USERS_KEY);
  const mockUsers = localStorage.getItem(MOCK_USERS_KEY);
  
  if (storedUsers) {
    try {
      localUsers = JSON.parse(storedUsers);
    } catch (e) {
      localUsers = [];
    }
  }

  // Merge mock users into local list if any
  if (mockUsers) {
    try {
      const parsedMock: any[] = JSON.parse(mockUsers);
      parsedMock.forEach(mu => {
        if (!localUsers.some(u => u.email.toLowerCase() === mu.email.toLowerCase())) {
          localUsers.push({
            uid: mu.uid || 'mock-' + Math.random().toString(36).substr(2, 9),
            name: mu.name || 'User',
            email: mu.email,
            role: mu.role || 'employee',
            password: mu.pass || mu.password || '******',
            createdAt: mu.createdAt || new Date().toISOString()
          });
        }
      });
    } catch (e) {}
  }

  // 2. Fetch from Firestore if configured
  if (isFirebaseConfigured) {
    try {
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      const firestoreUsers: ManagedUser[] = [];
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const userEmail = (data.email || '').toLowerCase();
        const localMatch = localUsers.find(lu => lu.email.toLowerCase() === userEmail || lu.uid === docSnap.id);
        const resolvedPassword = data.password || data.pass || localMatch?.password || '123456';

        firestoreUsers.push({
          uid: docSnap.id,
          id: docSnap.id,
          name: data.name || 'User',
          email: data.email || '',
          role: (data.role as UserRole) || 'employee',
          password: resolvedPassword,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });

      if (firestoreUsers.length > 0) {
        // Merge and update local storage
        const combined = [...firestoreUsers];
        localUsers.forEach(lu => {
          if (!combined.some(c => c.email.toLowerCase() === lu.email.toLowerCase())) {
            combined.push(lu);
          }
        });
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(combined));
        return combined;
      }
    } catch (err) {
      console.warn("Firestore fetch users warning:", err);
    }
  }

  // If list is completely empty, initialize with default admin user profile
  if (localUsers.length === 0) {
    const defaultUser: ManagedUser = {
      uid: 'user-admin-default',
      name: 'Sharanraj.T',
      email: 'sharanraj@lory.com',
      role: 'admin',
      password: 'adminpassword',
      createdAt: new Date().toISOString()
    };
    localUsers = [defaultUser];
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
  }

  return localUsers;
};

// Add New User - Registers user in Firebase Authentication AND Firestore
export const addUser = async (userData: Omit<ManagedUser, 'uid' | 'id'>): Promise<ManagedUser> => {
  let createdUid = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const cleanEmail = userData.email.trim().toLowerCase();
  const cleanName = userData.name.trim();
  const rawPass = userData.password || '123456';

  // 1. Create account in Firebase Authentication if configured
  if (isFirebaseConfigured) {
    try {
      const secondaryAuth = getSecondaryAuth();
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, rawPass);
      
      // Update display name in Firebase Auth
      await updateProfile(userCred.user, { displayName: cleanName });
      
      createdUid = userCred.user.uid;

      // Sign out secondary auth instance immediately to preserve active admin session
      await signOut(secondaryAuth);
    } catch (err: any) {
      console.warn("Firebase Auth create user warning:", err);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists in Firebase Authentication.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      }
    }
  }

  const newUser: ManagedUser = {
    uid: createdUid,
    id: createdUid,
    name: cleanName,
    email: cleanEmail,
    role: userData.role,
    password: rawPass,
    createdAt: new Date().toISOString()
  };

  // 2. Save in Firestore users collection
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'users', createdUid), {
        uid: createdUid,
        name: cleanName,
        email: cleanEmail,
        role: userData.role,
        password: rawPass,
        createdAt: newUser.createdAt
      });
      localStorage.setItem(`lory_erp_role_${createdUid}`, userData.role);
    } catch (err) {
      console.warn("Firestore setDoc user write warning:", err);
    }
  }

  // 3. Save to local storage & mock users for test mode
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  const usersList: ManagedUser[] = stored ? JSON.parse(stored) : [];
  usersList.unshift(newUser);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersList));

  const mockStored = localStorage.getItem(MOCK_USERS_KEY);
  const mockList: any[] = mockStored ? JSON.parse(mockStored) : [];
  mockList.push({
    uid: createdUid,
    name: cleanName,
    email: cleanEmail,
    pass: rawPass,
    role: userData.role
  });
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockList));

  return newUser;
};

// Update User Details (Name, Email, Role)
export const updateUser = async (uid: string, updatedData: Partial<ManagedUser>): Promise<void> => {
  // Update local storage list
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  if (stored) {
    let usersList: ManagedUser[] = JSON.parse(stored);
    const index = usersList.findIndex(u => u.uid === uid || u.id === uid);
    if (index !== -1) {
      usersList[index] = { ...usersList[index], ...updatedData };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersList));
    }
  }

  // Update mock users list
  const mockStored = localStorage.getItem(MOCK_USERS_KEY);
  if (mockStored) {
    let mockList: any[] = JSON.parse(mockStored);
    const index = mockList.findIndex((u: any) => u.uid === uid);
    if (index !== -1) {
      if (updatedData.name) mockList[index].name = updatedData.name;
      if (updatedData.email) mockList[index].email = updatedData.email;
      if (updatedData.role) mockList[index].role = updatedData.role;
      if (updatedData.password) mockList[index].pass = updatedData.password;
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockList));
    }
  }

  // Update role local cache
  if (updatedData.role) {
    localStorage.setItem(`lory_erp_role_${uid}`, updatedData.role);
  }

  // Update in Firestore
  if (isFirebaseConfigured) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, updatedData, { merge: true });
    } catch (err) {
      console.warn("Firestore update user warning:", err);
    }
  }
};

// Change Password for User (updates system record + sends reset email if Firebase active)
export const changeUserPassword = async (uid: string, email: string, newPass: string): Promise<void> => {
  await updateUser(uid, { password: newPass });

  if (isFirebaseConfigured && email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.warn("Firebase sendPasswordResetEmail warning:", err);
    }
  }
};

// Delete User
export const deleteUser = async (uid: string): Promise<void> => {
  // Remove from local storage users
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  if (stored) {
    let usersList: ManagedUser[] = JSON.parse(stored);
    usersList = usersList.filter(u => u.uid !== uid && u.id !== uid);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersList));
  }

  // Remove from mock users
  const mockStored = localStorage.getItem(MOCK_USERS_KEY);
  if (mockStored) {
    let mockList: any[] = JSON.parse(mockStored);
    mockList = mockList.filter((u: any) => u.uid !== uid);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockList));
  }

  // Delete from Firestore
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.warn("Firestore delete user warning:", err);
    }
  }
};
