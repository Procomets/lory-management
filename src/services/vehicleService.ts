import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

export interface Vehicle {
  id?: string;
  vehicleNo: string;
  typeOfVehicle: string;
  modelMake: string;
  dateOfPurchase: string; // Year of Purchase (e.g. 2023)
  fcDueDate: string;
  insDueDate: string;
  rcBookUrl: string;
  fcBookUrl: string;
  insuranceBookUrl: string;
  createdAt?: string;
}

// Vehicle Types List
export const VEHICLE_TYPES = [
  '24 FEET',
  '32 FEET',
  '40 FEET',
  'TARAUS (10 WHEEL)',
  'TARAUS (12 WHEEL)',
  'TARAUS (16 WHEEL)',
  'TIPPER',
  'GRABBER',
  'HOOK LOAD',
  'NEW TIPPER 12 WHEEL',
  'GANAPATHY TO SFA EICHER'
] as const;

// Upload file to Cloudinary with fallback to Base64 preview
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset && cloudName !== 'YOUR_CLOUD_NAME') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.warn("Cloudinary upload failed, using Data URL fallback:", err);
    }
  }

  // Fallback: Convert file to Base64 Data URL for instant test preview
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Local storage key for mock fallback mode
const LOCAL_VEHICLES_KEY = 'lory_erp_vehicles_data';

// Fetch all vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
  let localVehicles: Vehicle[] = [];
  const stored = localStorage.getItem(LOCAL_VEHICLES_KEY);
  if (stored) {
    try {
      localVehicles = JSON.parse(stored);
    } catch (e) {
      localVehicles = [];
    }
  }

  if (isFirebaseConfigured) {
    try {
      const querySnapshot = await getDocs(collection(db, 'vehicles'));
      const firestoreVehicles: Vehicle[] = [];
      querySnapshot.forEach((docSnap) => {
        firestoreVehicles.push({
          id: docSnap.id,
          ...docSnap.data() as Omit<Vehicle, 'id'>
        });
      });

      firestoreVehicles.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (firestoreVehicles.length > 0) {
        localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(firestoreVehicles));
        return firestoreVehicles;
      }
    } catch (err: any) {
      console.warn("Firestore fetch error:", err?.message || err);
    }
  }

  if (localVehicles.length > 0) {
    return localVehicles;
  }

  // Initial Sample Data if empty
  const sampleVehicles: Vehicle[] = [
    {
      id: 'v-1',
      vehicleNo: 'TN38AB1234',
      typeOfVehicle: 'TARAUS (10 WHEEL)',
      modelMake: 'Ashok Leyland 3518',
      dateOfPurchase: '2023',
      fcDueDate: '2026-11-20',
      insDueDate: '2026-12-10',
      rcBookUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop&q=60',
      fcBookUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
      insuranceBookUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60',
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(sampleVehicles));
  return sampleVehicles;
};

// Add new vehicle
export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  const newVehicleData = {
    ...vehicle,
    vehicleNo: vehicle.vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    createdAt: new Date().toISOString()
  };

  let createdId = 'v-' + Date.now();

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'vehicles'), newVehicleData);
      createdId = docRef.id;
    } catch (err: any) {
      console.error("Firestore add error:", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        throw new Error('Firestore Access Denied: Please check Rules tab in Firebase Console and set "allow read, write: if true;".');
      }
    }
  }

  const created: Vehicle = {
    id: createdId,
    ...newVehicleData
  };

  const stored = localStorage.getItem(LOCAL_VEHICLES_KEY);
  const vehicles: Vehicle[] = stored ? JSON.parse(stored) : [];
  vehicles.unshift(created);
  localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(vehicles));

  return created;
};

// Update existing vehicle
export const updateVehicle = async (id: string, vehicle: Partial<Vehicle>): Promise<void> => {
  // Update local storage first
  const stored = localStorage.getItem(LOCAL_VEHICLES_KEY);
  if (stored) {
    const vehicles: Vehicle[] = JSON.parse(stored);
    const index = vehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      vehicles[index] = { ...vehicles[index], ...vehicle };
      localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(vehicles));
    }
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'vehicles', id);
      await setDoc(docRef, vehicle, { merge: true });
    } catch (err: any) {
      console.error("Firestore update error:", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        throw new Error('Firestore Access Denied: Please check Rules tab in Firebase Console and set "allow read, write: if true;".');
      }
    }
  }
};

// Delete vehicle
export const deleteVehicle = async (id: string): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_VEHICLES_KEY);
  if (stored) {
    let vehicles: Vehicle[] = JSON.parse(stored);
    vehicles = vehicles.filter(v => v.id !== id);
    localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(vehicles));
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'vehicles', id);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error("Firestore delete error:", err);
    }
  }
};


