import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

export interface DailyEntry {
  id?: string;
  date: string; // YYYY-MM-DD
  loryNo: string; // Vehicle No
  driverName: string;
  loadingFrom: string;
  loadingTo: string;
  weight: number;
  freightPmt: number;
  freightAmount: number;
  freightCollectedFrom: string;
  freightPartyId?: string;
  isBooked?: boolean;
  isBilled?: boolean;
  createdAt?: string;
}

export interface IdleVehicleRemark {
  id?: string;
  date: string; // YYYY-MM-DD
  loryNo: string;
  reason: string;
  updatedAt?: string;
}

const LOCAL_ENTRIES_KEY = 'lory_erp_daily_entries';
const LOCAL_IDLE_REMARKS_KEY = 'lory_erp_idle_remarks';

// Helper to ensure isBilled accurately reflects generated bills
const syncBilledStatusWithGeneratedBills = (entries: DailyEntry[]): DailyEntry[] => {
  const storedBills = localStorage.getItem('lory_erp_bills_data');
  let billedEntryIds = new Set<string>();

  if (storedBills) {
    try {
      const generatedBills: any[] = JSON.parse(storedBills);
      generatedBills.forEach(b => {
        if (Array.isArray(b.entryIds)) {
          b.entryIds.forEach((id: string) => billedEntryIds.add(id));
        }
      });
    } catch (e) {
      billedEntryIds = new Set<string>();
    }
  }

  return entries.map(e => ({
    ...e,
    isBilled: e.id ? (billedEntryIds.has(e.id) || (e.isBilled === true && billedEntryIds.has(e.id))) : false
  }));
};

// Fetch all entries across all dates
export const getAllEntries = async (): Promise<DailyEntry[]> => {
  let localEntries: DailyEntry[] = [];
  const stored = localStorage.getItem(LOCAL_ENTRIES_KEY);
  if (stored) {
    try {
      localEntries = JSON.parse(stored);
    } catch (err) {
      localEntries = [];
    }
  }

  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'daily_entries'));
      const snapshot = await getDocs(q);
      const firestoreEntries: DailyEntry[] = [];
      snapshot.forEach(docSnap => {
        firestoreEntries.push({
          id: docSnap.id,
          ...docSnap.data() as Omit<DailyEntry, 'id'>
        });
      });

      if (firestoreEntries.length > 0) {
        localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(firestoreEntries));
        const synced = syncBilledStatusWithGeneratedBills(firestoreEntries);
        return synced.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      }
    } catch (err) {
      console.warn("Firestore fetch all entries error:", err);
    }
  }

  const synced = syncBilledStatusWithGeneratedBills(localEntries);
  return synced.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
};

// Fetch entries for a specific date
export const getEntriesByDate = async (dateStr: string): Promise<DailyEntry[]> => {
  let localEntries: DailyEntry[] = [];
  const stored = localStorage.getItem(LOCAL_ENTRIES_KEY);
  if (stored) {
    try {
      const all: DailyEntry[] = JSON.parse(stored);
      localEntries = all.filter(e => e.date === dateStr);
    } catch (err) {
      localEntries = [];
    }
  }

  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'daily_entries'), where('date', '==', dateStr));
      const snapshot = await getDocs(q);
      const firestoreEntries: DailyEntry[] = [];
      snapshot.forEach(docSnap => {
        firestoreEntries.push({
          id: docSnap.id,
          ...docSnap.data() as Omit<DailyEntry, 'id'>
        });
      });

      if (firestoreEntries.length > 0) {
        // Sync local storage
        const storedAll = localStorage.getItem(LOCAL_ENTRIES_KEY);
        let all: DailyEntry[] = storedAll ? JSON.parse(storedAll) : [];
        all = all.filter(e => e.date !== dateStr).concat(firestoreEntries);
        localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(all));
        return syncBilledStatusWithGeneratedBills(firestoreEntries);
      }
    } catch (err) {
      console.warn("Firestore fetch entries error:", err);
    }
  }

  return syncBilledStatusWithGeneratedBills(localEntries);
};

// Add new entry
export const addDailyEntry = async (entry: Omit<DailyEntry, 'id'>): Promise<DailyEntry> => {
  const newEntryData = {
    ...entry,
    isBooked: entry.isBooked !== undefined ? entry.isBooked : true,
    isBilled: entry.isBilled !== undefined ? entry.isBilled : false,
    createdAt: new Date().toISOString()
  };

  let createdId = 'e-' + Date.now();

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'daily_entries'), newVehicleData(newEntryData));
      createdId = docRef.id;
    } catch (err) {
      console.warn("Firestore add entry error:", err);
    }
  }

  const created: DailyEntry = {
    id: createdId,
    ...newEntryData
  };

  const stored = localStorage.getItem(LOCAL_ENTRIES_KEY);
  const all: DailyEntry[] = stored ? JSON.parse(stored) : [];
  all.unshift(created);
  localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(all));

  // Automatically delete any idle remark for this vehicle on this date
  await deleteIdleRemark(entry.date, entry.loryNo);

  return created;
};

// Helper for data normalization
function newVehicleData(data: any) {
  return data;
}

// Update existing entry
export const updateDailyEntry = async (id: string, entry: Partial<DailyEntry>): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_ENTRIES_KEY);
  if (stored) {
    const all: DailyEntry[] = JSON.parse(stored);
    const index = all.findIndex(e => e.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...entry };
      localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(all));
    }
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'daily_entries', id);
      await setDoc(docRef, entry, { merge: true });
    } catch (err) {
      console.warn("Firestore update entry error:", err);
    }
  }

  if (entry.date && entry.loryNo) {
    await deleteIdleRemark(entry.date, entry.loryNo);
  }
};

// Delete entry
export const deleteDailyEntry = async (id: string): Promise<void> => {
  const stored = localStorage.getItem(LOCAL_ENTRIES_KEY);
  if (stored) {
    let all: DailyEntry[] = JSON.parse(stored);
    all = all.filter(e => e.id !== id);
    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(all));
  }

  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'daily_entries', id));
    } catch (err) {
      console.warn("Firestore delete idle remark error:", err);
    }
  }
};

// Fetch Idle Vehicle Remarks for a specific date
export const getIdleRemarksByDate = async (dateStr: string): Promise<Record<string, string>> => {
  const remarksMap: Record<string, string> = {};

  const stored = localStorage.getItem(LOCAL_IDLE_REMARKS_KEY);
  if (stored) {
    try {
      const all: IdleVehicleRemark[] = JSON.parse(stored);
      all.filter(r => r.date === dateStr).forEach(r => {
        remarksMap[r.loryNo] = r.reason;
      });
    } catch (err) {}
  }

  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'idle_vehicle_remarks'), where('date', '==', dateStr));
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as IdleVehicleRemark;
        if (data.loryNo && data.reason) {
          remarksMap[data.loryNo] = data.reason;
        }
      });
    } catch (err) {
      console.warn("Firestore fetch idle remarks error:", err);
    }
  }

  return remarksMap;
};

// Save Idle Vehicle Remark
export const saveIdleRemark = async (dateStr: string, loryNo: string, reason: string): Promise<void> => {
  const docId = `${dateStr}_${loryNo}`;

  // Update local storage
  const stored = localStorage.getItem(LOCAL_IDLE_REMARKS_KEY);
  let all: IdleVehicleRemark[] = stored ? JSON.parse(stored) : [];
  const index = all.findIndex(r => r.date === dateStr && r.loryNo === loryNo);
  if (index !== -1) {
    all[index].reason = reason;
    all[index].updatedAt = new Date().toISOString();
  } else {
    all.push({
      id: docId,
      date: dateStr,
      loryNo,
      reason,
      updatedAt: new Date().toISOString()
    });
  }
  localStorage.setItem(LOCAL_IDLE_REMARKS_KEY, JSON.stringify(all));

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'idle_vehicle_remarks', docId);
      await setDoc(docRef, {
        date: dateStr,
        loryNo,
        reason,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore save idle remark error:", err);
    }
  }
};

// Delete Idle Vehicle Remark (when vehicle gets a trip entry logged)
export const deleteIdleRemark = async (dateStr: string, loryNo: string): Promise<void> => {
  const cleanNo = loryNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const docId = `${dateStr}_${cleanNo}`;

  // Remove from local storage
  const stored = localStorage.getItem(LOCAL_IDLE_REMARKS_KEY);
  if (stored) {
    try {
      let all: IdleVehicleRemark[] = JSON.parse(stored);
      all = all.filter(r => !(r.date === dateStr && r.loryNo.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanNo));
      localStorage.setItem(LOCAL_IDLE_REMARKS_KEY, JSON.stringify(all));
    } catch (err) {}
  }

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'idle_vehicle_remarks', docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore delete idle remark error:", err);
    }
  }
};

export interface EntryFilterOptions {
  searchTerm?: string;
  loryNo?: string;
  driverName?: string;
  loadingFrom?: string;
  loadingTo?: string;
  freightCollectedFrom?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  billedStatus?: 'ALL' | 'BILLED' | 'NOT_BILLED';
}

export type EntrySortField = 'date' | 'loryNo' | 'driverName' | 'isBooked' | 'isBilled' | 'loadingFrom' | 'loadingTo' | 'weight' | 'freightPmt' | 'freightAmount' | 'freightCollectedFrom';
export type SortDirection = 'asc' | 'desc';

// Helper function to filter entries
export const filterEntries = (entries: DailyEntry[], filters: EntryFilterOptions): DailyEntry[] => {
  return entries.filter(e => {
    // Search Term across key text fields (including date)
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const q = filters.searchTerm.trim().toLowerCase();
      const matchesSearch = 
        (e.date && e.date.toLowerCase().includes(q)) ||
        (e.loryNo && e.loryNo.toLowerCase().includes(q)) ||
        (e.driverName && e.driverName.toLowerCase().includes(q)) ||
        (e.loadingFrom && e.loadingFrom.toLowerCase().includes(q)) ||
        (e.loadingTo && e.loadingTo.toLowerCase().includes(q)) ||
        (e.freightCollectedFrom && e.freightCollectedFrom.toLowerCase().includes(q));
      
      if (!matchesSearch) return false;
    }

    // Exact Date Filter
    if (filters.date && filters.date.trim()) {
      if (!e.date || e.date !== filters.date.trim()) return false;
    }

    // Start Date Filter
    if (filters.startDate && filters.startDate.trim()) {
      if (!e.date || e.date < filters.startDate.trim()) return false;
    }

    // End Date Filter
    if (filters.endDate && filters.endDate.trim()) {
      if (!e.date || e.date > filters.endDate.trim()) return false;
    }

    // Billed Status Filter
    if (filters.billedStatus && filters.billedStatus !== 'ALL') {
      const isBilled = Boolean(e.isBilled);
      if (filters.billedStatus === 'BILLED' && !isBilled) return false;
      if (filters.billedStatus === 'NOT_BILLED' && isBilled) return false;
    }

    // Lory No Filter
    if (filters.loryNo && filters.loryNo !== 'ALL') {
      const cleanFilter = filters.loryNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const cleanEntry = e.loryNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanEntry !== cleanFilter) return false;
    }

    // Driver Name Filter
    if (filters.driverName && filters.driverName.trim()) {
      if (!e.driverName || !e.driverName.toLowerCase().includes(filters.driverName.trim().toLowerCase())) {
        return false;
      }
    }

    // Loading From Filter
    if (filters.loadingFrom && filters.loadingFrom.trim()) {
      if (!e.loadingFrom || !e.loadingFrom.toLowerCase().includes(filters.loadingFrom.trim().toLowerCase())) {
        return false;
      }
    }

    // Loading To Filter
    if (filters.loadingTo && filters.loadingTo.trim()) {
      if (!e.loadingTo || !e.loadingTo.toLowerCase().includes(filters.loadingTo.trim().toLowerCase())) {
        return false;
      }
    }

    // Freight Collected From Filter
    if (filters.freightCollectedFrom && filters.freightCollectedFrom.trim()) {
      if (!e.freightCollectedFrom || !e.freightCollectedFrom.toLowerCase().includes(filters.freightCollectedFrom.trim().toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};

// Helper function to sort entries
export const sortEntries = (
  entries: DailyEntry[], 
  field: EntrySortField | null, 
  direction: SortDirection = 'asc'
): DailyEntry[] => {
  if (!field) return entries;

  return [...entries].sort((a, b) => {
    if (field === 'date') {
      const valA = a.date || '';
      const valB = b.date || '';
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (field === 'isBilled' || field === 'isBooked') {
      const isA = field === 'isBilled' ? a.isBilled !== false : a.isBooked !== false;
      const isB = field === 'isBilled' ? b.isBilled !== false : b.isBooked !== false;
      if (isA === isB) return 0;
      return direction === 'asc' ? (isA ? -1 : 1) : (isA ? 1 : -1);
    }

    let valA: any = a[field] ?? '';
    let valB: any = b[field] ?? '';

    // Numerical sorting for weight, freightPmt, freightAmount
    if (typeof valA === 'number' || typeof valB === 'number') {
      valA = parseFloat(valA) || 0;
      valB = parseFloat(valB) || 0;
      return direction === 'asc' ? valA - valB : valB - valA;
    }

    // String sorting
    valA = valA.toString().toLowerCase();
    valB = valB.toString().toLowerCase();

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};
