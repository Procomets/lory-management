import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { updateDailyEntry } from './entryService';

export interface BillItem {
  srNo: number;
  entryId: string;
  date: string; // YYYY-MM-DD
  loryNo: string;
  driverName: string;
  loadingFrom: string;
  loadingTo: string;
  weight: number;
  freightAmount: number;
}

export interface BillRecord {
  id?: string;
  billNumber: string;
  billingDate: string; // YYYY-MM-DD
  generatedAt: string; // Full date & time string e.g. "10/09/2026, 09:01:18 AM"
  freightPartyName: string;
  freightPartyId?: string;
  partyAddress: string;
  partyPhone?: string;
  items: BillItem[];
  totalWeight: number;
  totalFreightAmount: number;
  entryIds: string[];
  createdAt?: string;
}

const LOCAL_BILLS_KEY = 'lory_erp_bills_data';

// Helper to generate next sequential bill number e.g. "SF-2026-0001"
export const generateNextBillNumber = (existingBills: BillRecord[]): string => {
  const currentYear = new Date().getFullYear();
  const prefix = `SF-${currentYear}-`;
  
  let maxSeq = 0;
  existingBills.forEach(b => {
    if (b.billNumber && b.billNumber.startsWith(prefix)) {
      const seqStr = b.billNumber.replace(prefix, '');
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};

// Fetch all bills from Firestore or LocalStorage
export const getBills = async (): Promise<BillRecord[]> => {
  let localBills: BillRecord[] = [];
  const stored = localStorage.getItem(LOCAL_BILLS_KEY);
  if (stored) {
    try {
      localBills = JSON.parse(stored);
    } catch (e) {
      localBills = [];
    }
  }

  if (isFirebaseConfigured) {
    try {
      const querySnapshot = await getDocs(collection(db, 'bills'));
      const firestoreBills: BillRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        firestoreBills.push({
          id: docSnap.id,
          ...docSnap.data() as Omit<BillRecord, 'id'>
        });
      });

      firestoreBills.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (firestoreBills.length > 0) {
        localStorage.setItem(LOCAL_BILLS_KEY, JSON.stringify(firestoreBills));
        return firestoreBills;
      }
    } catch (err: any) {
      console.warn("Firestore fetch bills error:", err?.message || err);
    }
  }

  return localBills.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

// Create a new Bill record & update associated entries to isBilled: true
export const createBill = async (
  billData: Omit<BillRecord, 'id'>, 
  entryIds: string[]
): Promise<BillRecord> => {
  const newBillPayload: Omit<BillRecord, 'id'> = {
    ...billData,
    createdAt: new Date().toISOString()
  };

  let createdId = 'bill-' + Date.now();

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'bills'), newBillPayload);
      createdId = docRef.id;
    } catch (err: any) {
      console.error("Firestore create bill error:", err);
    }
  }

  const createdBill: BillRecord = {
    id: createdId,
    ...newBillPayload
  };

  // Update local storage for bills
  const stored = localStorage.getItem(LOCAL_BILLS_KEY);
  const billsList: BillRecord[] = stored ? JSON.parse(stored) : [];
  billsList.unshift(createdBill);
  localStorage.setItem(LOCAL_BILLS_KEY, JSON.stringify(billsList));

  // Mark all selected entries as billed in Firestore & LocalStorage
  for (const entryId of entryIds) {
    try {
      await updateDailyEntry(entryId, { isBilled: true });
    } catch (err) {
      console.error(`Failed to update entry ${entryId} as billed:`, err);
    }
  }

  return createdBill;
};

// Delete a bill record
export const deleteBill = async (id: string, entryIds?: string[]): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_BILLS_KEY);
  if (stored) {
    let billsList: BillRecord[] = JSON.parse(stored);
    billsList = billsList.filter(b => b.id !== id);
    localStorage.setItem(LOCAL_BILLS_KEY, JSON.stringify(billsList));
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'bills', id);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error("Firestore delete bill error:", err);
    }
  }

  // Optionally revert entries back to unbilled
  if (entryIds && entryIds.length > 0) {
    for (const entryId of entryIds) {
      try {
        await updateDailyEntry(entryId, { isBilled: false });
      } catch (err) {
        console.error(`Failed to revert entry ${entryId} billed status:`, err);
      }
    }
  }
};
