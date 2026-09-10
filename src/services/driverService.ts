import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

export interface Driver {
  id?: string;
  driverName: string;
  phoneNo?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

const LOCAL_DRIVERS_KEY = 'lory_erp_drivers_data';

// Initial sample drivers if none exist
const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd-1',
    driverName: 'Ramesh Kumar',
    phoneNo: '9876543210',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-2',
    driverName: 'Suresh V',
    phoneNo: '9842156789',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-3',
    driverName: 'Murugan K',
    phoneNo: '9789012345',
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

// Fetch all drivers from Firebase Firestore or LocalStorage
export const getDrivers = async (): Promise<Driver[]> => {
  let localDrivers: Driver[] = [];
  const stored = localStorage.getItem(LOCAL_DRIVERS_KEY);
  if (stored) {
    try {
      localDrivers = JSON.parse(stored);
    } catch (e) {
      localDrivers = [];
    }
  }

  if (isFirebaseConfigured) {
    try {
      const querySnapshot = await getDocs(collection(db, 'drivers'));
      const firestoreDrivers: Driver[] = [];
      querySnapshot.forEach((docSnap) => {
        firestoreDrivers.push({
          id: docSnap.id,
          ...docSnap.data() as Omit<Driver, 'id'>
        });
      });

      firestoreDrivers.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (firestoreDrivers.length > 0) {
        localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(firestoreDrivers));
        return firestoreDrivers;
      }
    } catch (err: any) {
      console.warn("Firestore fetch drivers error:", err?.message || err);
    }
  }

  if (localDrivers.length > 0) {
    return localDrivers;
  }

  // Seed default sample drivers if completely empty
  localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(INITIAL_DRIVERS));
  return INITIAL_DRIVERS;
};

// Add new driver to Firebase Firestore and LocalStorage
export const addDriver = async (driver: Omit<Driver, 'id'>): Promise<Driver> => {
  const newDriverData: Omit<Driver, 'id'> = {
    driverName: driver.driverName.trim(),
    phoneNo: driver.phoneNo?.trim() || '',
    status: driver.status || 'Active',
    createdAt: new Date().toISOString()
  };

  let createdId = 'd-' + Date.now();

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'drivers'), newDriverData);
      createdId = docRef.id;
    } catch (err: any) {
      console.error("Firestore add driver error:", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        throw new Error('Firestore Access Denied: Please update security rules in Firebase Console.');
      }
    }
  }

  const created: Driver = {
    id: createdId,
    ...newDriverData
  };

  const stored = localStorage.getItem(LOCAL_DRIVERS_KEY);
  const drivers: Driver[] = stored ? JSON.parse(stored) : [];
  drivers.unshift(created);
  localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(drivers));

  return created;
};

// Update driver in Firebase Firestore and LocalStorage
export const updateDriver = async (id: string, driverData: Partial<Driver>): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_DRIVERS_KEY);
  if (stored) {
    const drivers: Driver[] = JSON.parse(stored);
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      drivers[index] = { ...drivers[index], ...driverData };
      localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(drivers));
    }
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'drivers', id);
      await setDoc(docRef, driverData, { merge: true });
    } catch (err: any) {
      console.error("Firestore update driver error:", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        throw new Error('Firestore Access Denied: Please update security rules in Firebase Console.');
      }
    }
  }
};

// Delete driver from Firebase Firestore and LocalStorage
export const deleteDriver = async (id: string): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_DRIVERS_KEY);
  if (stored) {
    let drivers: Driver[] = JSON.parse(stored);
    drivers = drivers.filter(d => d.id !== id);
    localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(drivers));
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'drivers', id);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error("Firestore delete driver error:", err);
    }
  }
};
