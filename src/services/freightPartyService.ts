import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

export interface FreightParty {
  id?: string;
  partyName: string;
  phoneNo?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

const LOCAL_FREIGHT_PARTIES_KEY = 'lory_erp_freight_parties_data';

// Initial sample parties if none exist
const INITIAL_FREIGHT_PARTIES: FreightParty[] = [
  {
    id: 'fp-1',
    partyName: 'Sri Lakshmi Logistics',
    phoneNo: '9840123456',
    address: 'No. 45, G.N.T. Road, Madhavaram, Chennai - 600060',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fp-2',
    partyName: 'Apex Freight Carriers',
    phoneNo: '9789123456',
    address: 'Plot 12, Industrial Estate, Salem - 636004',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fp-3',
    partyName: 'Kovai Transport Agency',
    phoneNo: '9443123456',
    address: '102, Trichy Road, Coimbatore - 641018',
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

// Fetch all freight parties from Firestore or LocalStorage
export const getFreightParties = async (): Promise<FreightParty[]> => {
  let localParties: FreightParty[] = [];
  const stored = localStorage.getItem(LOCAL_FREIGHT_PARTIES_KEY);
  if (stored) {
    try {
      localParties = JSON.parse(stored);
    } catch (e) {
      localParties = [];
    }
  }

  if (isFirebaseConfigured) {
    try {
      const querySnapshot = await getDocs(collection(db, 'freight_parties'));
      const firestoreParties: FreightParty[] = [];
      querySnapshot.forEach((docSnap) => {
        firestoreParties.push({
          id: docSnap.id,
          ...docSnap.data() as Omit<FreightParty, 'id'>
        });
      });

      firestoreParties.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (firestoreParties.length > 0) {
        localStorage.setItem(LOCAL_FREIGHT_PARTIES_KEY, JSON.stringify(firestoreParties));
        return firestoreParties;
      }
    } catch (err: any) {
      console.warn("Firestore fetch freight parties error:", err?.message || err);
    }
  }

  if (localParties.length > 0) {
    return localParties;
  }

  // Seed default sample parties if completely empty
  localStorage.setItem(LOCAL_FREIGHT_PARTIES_KEY, JSON.stringify(INITIAL_FREIGHT_PARTIES));
  return INITIAL_FREIGHT_PARTIES;
};

// Add new freight party
export const addFreightParty = async (party: Omit<FreightParty, 'id'>): Promise<FreightParty> => {
  const newPartyData: Omit<FreightParty, 'id'> = {
    partyName: party.partyName.trim(),
    phoneNo: party.phoneNo?.trim() || '',
    address: party.address?.trim() || '',
    status: party.status || 'Active',
    createdAt: new Date().toISOString()
  };

  let createdId = 'fp-' + Date.now();

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'freight_parties'), newPartyData);
      createdId = docRef.id;
    } catch (err: any) {
      console.error("Firestore add freight party error:", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        throw new Error('Firestore Access Denied: Please update security rules in Firebase Console.');
      }
    }
  }

  const created: FreightParty = {
    id: createdId,
    ...newPartyData
  };

  const stored = localStorage.getItem(LOCAL_FREIGHT_PARTIES_KEY);
  const parties: FreightParty[] = stored ? JSON.parse(stored) : [];
  parties.unshift(created);
  localStorage.setItem(LOCAL_FREIGHT_PARTIES_KEY, JSON.stringify(parties));

  return created;
};

// Update freight party
export const updateFreightParty = async (id: string, partyData: Partial<FreightParty>): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_FREIGHT_PARTIES_KEY);
  if (stored) {
    const parties: FreightParty[] = JSON.parse(stored);
    const index = parties.findIndex(p => p.id === id);
    if (index !== -1) {
      parties[index] = { ...parties[index], ...partyData };
      localStorage.setItem(LOCAL_FREIGHT_PARTIES_KEY, JSON.stringify(parties));
    }
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'freight_parties', id);
      await setDoc(docRef, partyData, { merge: true });
    } catch (err: any) {
      console.error("Firestore update freight party error:", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
        throw new Error('Firestore Access Denied: Please update security rules in Firebase Console.');
      }
    }
  }
};

// Delete freight party
export const deleteFreightParty = async (id: string): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_FREIGHT_PARTIES_KEY);
  if (stored) {
    let parties: FreightParty[] = JSON.parse(stored);
    parties = parties.filter(p => p.id !== id);
    localStorage.setItem(LOCAL_FREIGHT_PARTIES_KEY, JSON.stringify(parties));
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'freight_parties', id);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error("Firestore delete freight party error:", err);
    }
  }
};
