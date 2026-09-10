import React, { useState, useEffect, useRef } from 'react';
import type { Vehicle } from '../../services/vehicleService';
import { getVehicles } from '../../services/vehicleService';
import type { Driver } from '../../services/driverService';
import { getDrivers } from '../../services/driverService';
import type { FreightParty } from '../../services/freightPartyService';
import { getFreightParties } from '../../services/freightPartyService';
import type { DailyEntry, EntrySortField, SortDirection } from '../../services/entryService';

interface SearchablePartySelectProps {
  value: string;
  onChange: (name: string, partyId?: string) => void;
  parties: FreightParty[];
}

const SearchablePartySelect: React.FC<SearchablePartySelectProps> = ({ value, onChange, parties }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeParties = parties.filter(p => p.status === 'Active');

  const filtered = activeParties.filter(p =>
    p.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.phoneNo && p.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    const matched = activeParties.find(p => p.partyName.toLowerCase() === val.toLowerCase());
    onChange(val, matched?.id);
    setIsOpen(true);
  };

  const handleSelectParty = (party: FreightParty) => {
    setSearchTerm(party.partyName);
    onChange(party.partyName, party.id);
    setIsOpen(false);
  };

  return (
    <div className="searchable-combobox-wrapper" ref={wrapperRef}>
      <div className="combobox-input-box">
        <input
          id="fColl"
          type="text"
          placeholder="Select or type Freight Party..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="combobox-input"
          autoComplete="off"
        />
        <ChevronDown 
          size={16} 
          className={`combobox-chevron ${isOpen ? 'rotate' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="combobox-dropdown-menu" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          {filtered.length > 0 ? (
            filtered.map((party, idx) => (
              <div
                key={party.id || idx}
                className={`party-option-item ${party.partyName === value ? 'selected' : ''}`}
                onClick={() => handleSelectParty(party)}
              >
                <div className="party-option-header">
                  <span className="party-option-name">{party.partyName}</span>
                  {party.phoneNo && (
                    <span className="party-option-phone">
                      {party.phoneNo}
                    </span>
                  )}
                </div>
                {party.address && (
                  <div className="party-option-address">
                    {party.address}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="combobox-no-results" style={{ padding: '10px 12px', textAlign: 'left' }}>
              <span>No registered party found.</span>
              <span className="text-xs text-blue-600 block mt-0.5">Using party name: "{searchTerm}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
import { 
  getEntriesByDate, 
  addDailyEntry, 
  updateDailyEntry, 
  deleteDailyEntry,
  getIdleRemarksByDate,
  saveIdleRemark,
  deleteIdleRemark,
  filterEntries,
  sortEntries
} from '../../services/entryService';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  Truck, 
  Save, 
  Check, 
  DollarSign, 
  FileText,
  AlertTriangle,
  Filter,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
  Building2,
  MapPin,
  Phone
} from 'lucide-react';

interface SearchableDriverSelectProps {
  value: string;
  onChange: (value: string) => void;
  drivers: Driver[];
}

const SearchableDriverSelect: React.FC<SearchableDriverSelectProps> = ({ value, onChange, drivers }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeDrivers = drivers.filter(d => d.status === 'Active');

  const filtered = activeDrivers.filter(d =>
    d.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.phoneNo && d.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelectDriver = (name: string) => {
    setSearchTerm(name);
    onChange(name);
    setIsOpen(false);
  };

  return (
    <div className="searchable-combobox-wrapper" ref={wrapperRef}>
      <div className="combobox-input-box">
        <input
          id="dName"
          type="text"
          placeholder="Type or click to search driver..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="combobox-input"
          autoComplete="off"
        />
        <ChevronDown 
          size={16} 
          className={`combobox-chevron ${isOpen ? 'rotate' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="combobox-dropdown-menu">
          {filtered.length > 0 ? (
            filtered.map((driver, idx) => (
              <div
                key={driver.id || idx}
                className={`combobox-option ${driver.driverName === value ? 'selected' : ''}`}
                onClick={() => handleSelectDriver(driver.driverName)}
              >
                <span className="combobox-option-name">{driver.driverName}</span>
                {driver.phoneNo && (
                  <span className="combobox-option-phone">({driver.phoneNo})</span>
                )}
              </div>
            ))
          ) : (
            <div className="combobox-no-results">
              <span>No registered driver found.</span>
              <span className="text-xs text-blue-600 block mt-0.5">Using custom name: "{searchTerm}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SearchableVehicleSelectProps {
  value: string;
  onChange: (value: string) => void;
  vehicles: Vehicle[];
}

const SearchableVehicleSelect: React.FC<SearchableVehicleSelectProps> = ({ value, onChange, vehicles }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = vehicles.filter(v => {
    const cleanNo = v.vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanSearch = searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const typeStr = (v.typeOfVehicle || '').toLowerCase();
    return !cleanSearch || cleanNo.includes(cleanSearch) || typeStr.includes(searchTerm.toLowerCase());
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelectVehicle = (vehicleNo: string) => {
    const cleanNo = vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSearchTerm(cleanNo);
    onChange(cleanNo);
    setIsOpen(false);
  };

  return (
    <div className="searchable-combobox-wrapper" ref={wrapperRef}>
      <div className="combobox-input-box">
        <input
          id="lNo"
          type="text"
          placeholder="Type or click to search vehicle..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="combobox-input font-semibold"
          autoComplete="off"
          required
        />
        <ChevronDown 
          size={16} 
          className={`combobox-chevron ${isOpen ? 'rotate' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="combobox-dropdown-menu">
          {filtered.length > 0 ? (
            filtered.map((vehicle, idx) => {
              const cleanNo = vehicle.vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
              return (
                <div
                  key={vehicle.id || idx}
                  className={`combobox-option ${cleanNo === value ? 'selected' : ''}`}
                  onClick={() => handleSelectVehicle(cleanNo)}
                >
                  <span className="combobox-option-name font-bold">{cleanNo}</span>
                  <span className="combobox-option-phone">({vehicle.typeOfVehicle || 'Vehicle'})</span>
                </div>
              );
            })
          ) : (
            <div className="combobox-no-results">
              <span>No vehicle found in Master.</span>
              <span className="text-xs text-blue-600 block mt-0.5">Using vehicle: "{searchTerm}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DailyEntryModule: React.FC = () => {
  const { currentUser } = useAuth();
  const isEmployee = currentUser?.role === 'employee';

  // Today date YYYY-MM-DD
  const getTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDaysDifferenceFromToday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dateStr.split('-');
    if (parts.length !== 3) return 0;
    const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    target.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - target.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [registeredVehicles, setRegisteredVehicles] = useState<Vehicle[]>([]);
  const [registeredDrivers, setRegisteredDrivers] = useState<Driver[]>([]);
  const [registeredParties, setRegisteredParties] = useState<FreightParty[]>([]);
  const [idleRemarks, setIdleRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterLoadingFrom, setFilterLoadingFrom] = useState<string>('');
  const [filterLoadingTo, setFilterLoadingTo] = useState<string>('');
  const [filterFreightCollectedFrom, setFilterFreightCollectedFrom] = useState<string>('');

  // Sorting States
  const [sortField, setSortField] = useState<EntrySortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Saved remarks state feedback per vehicle
  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [loryNo, setLoryNo] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [loadingFrom, setLoadingFrom] = useState<string>('');
  const [loadingTo, setLoadingTo] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [freightPmt, setFreightPmt] = useState<string>('');
  const [freightAmount, setFreightAmount] = useState<string>('');
  const [freightCollectedFrom, setFreightCollectedFrom] = useState<string>('');
  const [freightPartyId, setFreightPartyId] = useState<string>('');

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    fetchDateData(selectedDate);
  }, [selectedDate]);

  const loadMasterData = async () => {
    try {
      const [vList, dList, pList] = await Promise.all([
        getVehicles(),
        getDrivers(),
        getFreightParties()
      ]);
      setRegisteredVehicles(vList);
      setRegisteredDrivers(dList);
      setRegisteredParties(pList);
    } catch (err) {
      console.error("Failed to load master data:", err);
    }
  };

  const fetchDateData = async (dateStr: string) => {
    setLoading(true);
    try {
      const [entriesData, remarksData] = await Promise.all([
        getEntriesByDate(dateStr),
        getIdleRemarksByDate(dateStr)
      ]);
      setEntries(entriesData);
      setIdleRemarks(remarksData);
    } catch (err) {
      console.error("Failed to load daily entry data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Daily entry data is editable for all users (Admin and Employee)
  const isEditable = true;

  // Date Navigation Helpers
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const targetStr = `${yyyy}-${mm}-${dd}`;

    setSelectedDate(targetStr);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedDate(val);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    }
    return dateStr;
  };

  // Auto calculate Freight Amount when Weight or Freight PMT changes
  const handleWeightChange = (val: string) => {
    setWeight(val);
    const w = parseFloat(val) || 0;
    const pmt = parseFloat(freightPmt) || 0;
    if (w > 0 && pmt > 0) {
      setFreightAmount((w * pmt).toString());
    }
  };

  const handleFreightPmtChange = (val: string) => {
    setFreightPmt(val);
    const w = parseFloat(weight) || 0;
    const pmt = parseFloat(val) || 0;
    if (w > 0 && pmt > 0) {
      setFreightAmount((w * pmt).toString());
    }
  };

  const openAddModal = (presetLoryNo?: string) => {
    setEditingEntry(null);
    setLoryNo(presetLoryNo || '');
    setDriverName('');
    setLoadingFrom('');
    setLoadingTo('');
    setWeight('');
    setFreightPmt('');
    setFreightAmount('');
    setFreightCollectedFrom('');
    setFreightPartyId('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: DailyEntry) => {
    setEditingEntry(entry);
    setLoryNo(entry.loryNo);
    setDriverName(entry.driverName);
    setLoadingFrom(entry.loadingFrom);
    setLoadingTo(entry.loadingTo);
    setWeight(entry.weight ? entry.weight.toString() : '');
    setFreightPmt(entry.freightPmt ? entry.freightPmt.toString() : '');
    setFreightAmount(entry.freightAmount ? entry.freightAmount.toString() : '');
    setFreightCollectedFrom(entry.freightCollectedFrom || '');
    setFreightPartyId(entry.freightPartyId || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedLoryNo = loryNo.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleanedLoryNo) {
      setError('Lory No. / Vehicle No. is required.');
      return;
    }

    try {
      setSubmitting(true);

      const entryData = {
        date: selectedDate,
        loryNo: cleanedLoryNo,
        driverName: driverName.trim(),
        loadingFrom: loadingFrom.trim(),
        loadingTo: loadingTo.trim(),
        weight: parseFloat(weight) || 0,
        freightPmt: parseFloat(freightPmt) || 0,
        freightAmount: parseFloat(freightAmount) || 0,
        freightCollectedFrom: freightCollectedFrom.trim(),
        freightPartyId: freightPartyId || undefined
      };

      if (editingEntry && editingEntry.id) {
        await updateDailyEntry(editingEntry.id, entryData);
      } else {
        await addDailyEntry(entryData);
      }

      // Delete any idle remark for this vehicle on this date from database
      await deleteIdleRemark(selectedDate, cleanedLoryNo);

      setIsModalOpen(false);
      await fetchDateData(selectedDate);
    } catch (err: any) {
      console.error("Save daily entry failed:", err);
      setError(err.message || 'Failed to save entry details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete entry for vehicle "${name}"?`)) {
      try {
        await deleteDailyEntry(id);
        await fetchDateData(selectedDate);
      } catch (err) {
        console.error("Delete entry failed:", err);
      }
    }
  };

  const handleSaveRemark = async (vNo: string) => {
    const reason = idleRemarks[vNo] || '';
    try {
      await saveIdleRemark(selectedDate, vNo, reason);
      setSavedFeedback(prev => ({ ...prev, [vNo]: true }));
      setTimeout(() => {
        setSavedFeedback(prev => ({ ...prev, [vNo]: false }));
      }, 2000);
    } catch (err) {
      console.error("Save remark failed:", err);
    }
  };

  // Filter & Sort Helpers
  const resetFilters = () => {
    setSearchTerm('');
    setFilterDriver('');
    setFilterLoadingFrom('');
    setFilterLoadingTo('');
    setFilterFreightCollectedFrom('');
  };

  const handleSort = (field: EntrySortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: EntrySortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="sort-icon-neutral" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={13} className="sort-icon-active" />
    ) : (
      <ArrowDown size={13} className="sort-icon-active" />
    );
  };

  // Compute Unentered / Idle Vehicles from Master
  const enteredLoryNumbers = new Set(entries.map(e => e.loryNo.toUpperCase().replace(/[^A-Z0-9]/g, '')));
  
  const unenteredVehicles = registeredVehicles.filter(v => {
    const cleanNo = v.vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return !enteredLoryNumbers.has(cleanNo);
  });

  // Calculate Filtered & Sorted Entries
  const filteredEntriesList = filterEntries(entries, {
    searchTerm,
    driverName: filterDriver,
    loadingFrom: filterLoadingFrom,
    loadingTo: filterLoadingTo,
    freightCollectedFrom: filterFreightCollectedFrom
  });

  const sortedProcessedEntries = sortEntries(filteredEntriesList, sortField, sortDirection);

  const isFilterActive = Boolean(
    searchTerm || 
    filterDriver || 
    filterLoadingFrom || 
    filterLoadingTo || 
    filterFreightCollectedFrom
  );

  // Calculate Summary Metrics
  const totalTrips = entries.length;
  const totalWeight = entries.reduce((sum, e) => sum + (e.weight || 0), 0);
  const totalFreightAmount = entries.reduce((sum, e) => sum + (e.freightAmount || 0), 0);

  return (
    <div className="daily-entry-container">
      {/* Module Header & Date Picker Bar */}
      <div className="entry-header-card">
        <div className="entry-header-title">
          <h2>Daily Entry Module</h2>
          <p>Record daily vehicle dispatches, weight, freight amount & manage idle vehicle remarks</p>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="date-picker-controls">
          <button 
            type="button" 
            className="date-nav-btn" 
            onClick={() => changeDateByDays(-1)}
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="date-input-wrapper">
            <CalendarIcon size={16} className="calendar-icon" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={handleDateInputChange}
              className="date-input"
            />
          </div>

          <button 
            type="button" 
            className="date-nav-btn" 
            onClick={() => changeDateByDays(1)}
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>

          {selectedDate === getTodayStr() && (
            <span className="today-badge">Today</span>
          )}

          <span className="formatted-date-label">{formatDateDisplay(selectedDate)}</span>
        </div>

        {/* Add Entry Action Button */}
        <button type="button" className="btn-primary" onClick={() => openAddModal()}>
          <Plus size={18} />
          <span>Add Entry</span>
        </button>
      </div>

      {/* Daily Metrics Summary Cards */}
      <div className="entry-summary-cards">
        <div className="summary-card">
          <div className="summary-icon bg-blue-100 text-blue-600">
            <Truck size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{totalTrips}</span>
            <span className="summary-label">Trips Logged</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-emerald-100 text-emerald-600">
            <FileText size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{totalWeight.toLocaleString()} MT</span>
            <span className="summary-label">Total Weight</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-indigo-100 text-indigo-600">
            <DollarSign size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">₹{totalFreightAmount.toLocaleString()}</span>
            <span className="summary-label">Total Freight Amount</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-amber-100 text-amber-600">
            <AlertTriangle size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{unenteredVehicles.length}</span>
            <span className="summary-label">Idle / Unentered Vehicles</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="filter-panel-card">
        <div className="filter-title">
          <Filter size={16} className="text-blue-600" />
          <span>Filter Trip Entries:</span>
        </div>

        <div className="filter-controls-grid">
          {/* Quick Search */}
          <div className="filter-item">
            <label>Quick Search</label>
            <input 
              type="text" 
              placeholder="Search Lory, Driver, Location..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>


          {/* Driver Name Filter */}
          <div className="filter-item">
            <label>Driver Name</label>
            {registeredDrivers.length > 0 ? (
              <select
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
                className="filter-select"
              >
                <option value="">All Drivers</option>
                {registeredDrivers.map((driver, idx) => (
                  <option key={driver.id || idx} value={driver.driverName}>
                    {driver.driverName}
                  </option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                placeholder="Filter Driver..." 
                value={filterDriver} 
                onChange={(e) => setFilterDriver(e.target.value)}
                className="filter-input"
              />
            )}
          </div>

          {/* Loading From Filter */}
          <div className="filter-item">
            <label>Loading From</label>
            <input 
              type="text" 
              placeholder="Origin (e.g. Chennai)" 
              value={filterLoadingFrom} 
              onChange={(e) => setFilterLoadingFrom(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Loading To Filter */}
          <div className="filter-item">
            <label>Loading To</label>
            <input 
              type="text" 
              placeholder="Destination (e.g. Madurai)" 
              value={filterLoadingTo} 
              onChange={(e) => setFilterLoadingTo(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Freight Collected From Filter */}
          <div className="filter-item">
            <label>Freight Collected From</label>
            <input 
              type="text" 
              placeholder="Client / Party Name" 
              value={filterFreightCollectedFrom} 
              onChange={(e) => setFilterFreightCollectedFrom(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Reset Filters Button */}
          {isFilterActive && (
            <div className="filter-item flex-end">
              <button type="button" className="btn-reset-filter" onClick={resetFilters}>
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Entries Table Card */}
      <div className="table-card">
        <div className="card-header-bar">
          <h3>Daily Vehicle Trip Entries</h3>
          <span className="count-pill">{sortedProcessedEntries.length} of {entries.length} Entries Shown</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spin text-blue-600" />
            <p>Loading entries for selected date...</p>
          </div>
        ) : sortedProcessedEntries.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} className="text-slate-300" />
            <h3>No Entries Found</h3>
            <p>
              {isFilterActive 
                ? 'No trip entries match your active filter criteria.' 
                : isEditable 
                  ? `Click "Add Entry" above to record a new vehicle dispatch for ${formatDateDisplay(selectedDate)}.`
                  : `No vehicle trip entries recorded for ${formatDateDisplay(selectedDate)}.`
              }
            </p>
            {isFilterActive ? (
              <button type="button" className="btn-secondary mt-2" onClick={resetFilters}>
                Clear All Filters
              </button>
            ) : isEditable ? (
              <button type="button" className="btn-primary mt-2" onClick={() => openAddModal()}>
                <Plus size={16} />
                <span>Add Entry Now</span>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table grid-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>S.NO</th>
                  <th onClick={() => handleSort('loryNo')} className="sortable-th" title="Click to sort by Lory No">
                    <div className="th-content">
                      <span>LORY NO.</span>
                      {getSortIcon('loryNo')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('driverName')} className="sortable-th" title="Click to sort by Driver Name">
                    <div className="th-content">
                      <span>DRIVER NAME</span>
                      {getSortIcon('driverName')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('loadingFrom')} className="sortable-th" title="Click to sort by Loading From">
                    <div className="th-content">
                      <span>LOADING FROM</span>
                      {getSortIcon('loadingFrom')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('loadingTo')} className="sortable-th" title="Click to sort by Loading To">
                    <div className="th-content">
                      <span>LOADING TO</span>
                      {getSortIcon('loadingTo')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('weight')} className="sortable-th" style={{ textAlign: 'right' }} title="Click to sort by Weight">
                    <div className="th-content" style={{ justifyContent: 'flex-end' }}>
                      <span>WEIGHT (MT)</span>
                      {getSortIcon('weight')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('freightPmt')} className="sortable-th" style={{ textAlign: 'right' }} title="Click to sort by Freight PMT">
                    <div className="th-content" style={{ justifyContent: 'flex-end' }}>
                      <span>FREIGHT PMT (₹)</span>
                      {getSortIcon('freightPmt')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('freightAmount')} className="sortable-th" style={{ textAlign: 'right' }} title="Click to sort by Freight Amount">
                    <div className="th-content" style={{ justifyContent: 'flex-end' }}>
                      <span>FREIGHT AMOUNT (₹)</span>
                      {getSortIcon('freightAmount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('freightCollectedFrom')} className="sortable-th" title="Click to sort by Freight Collected From">
                    <div className="th-content">
                      <span>FREIGHT COLLECTED FROM</span>
                      {getSortIcon('freightCollectedFrom')}
                    </div>
                  </th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sortedProcessedEntries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="text-center font-semibold text-slate-500">{index + 1}</td>
                    <td className="font-semibold text-slate-800 whitespace-nowrap">
                      {entry.loryNo}
                    </td>
                    <td className="font-medium text-slate-700">{entry.driverName || '-'}</td>
                    <td className="text-slate-700">{entry.loadingFrom || '-'}</td>
                    <td className="text-slate-700">{entry.loadingTo || '-'}</td>
                    <td className="text-right font-semibold text-slate-800">
                      {entry.weight ? `${entry.weight} MT` : '-'}
                    </td>
                    <td className="text-right font-medium text-slate-700">
                      {entry.freightPmt ? `₹${entry.freightPmt}` : '-'}
                    </td>
                    <td className="text-right font-bold text-blue-700">
                      {entry.freightAmount ? `₹${entry.freightAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="text-slate-700 font-medium">{entry.freightCollectedFrom || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {isEditable ? (
                        <div className="action-buttons-group">
                          <button 
                            type="button" 
                            className="action-btn edit" 
                            title="Edit Entry"
                            onClick={() => openEditModal(entry)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="action-btn delete" 
                            title="Delete Entry"
                            onClick={() => entry.id && handleDelete(entry.id, entry.loryNo)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Down of the Table - Idle / Unentered Vehicles Reason Section */}
      <div className="idle-vehicles-card">
        <div className="idle-card-header">
          <div className="idle-header-info">
            <AlertCircle size={20} className="text-amber-600" />
            <div>
              <h3>Idle / Unentered Vehicles Remarks ({formatDateDisplay(selectedDate)})</h3>
              <p>The following vehicles from Master database have no trip recorded for this date. Enter reasons or remarks below:</p>
            </div>
          </div>
          <span className="idle-count-badge">{unenteredVehicles.length} Idle Vehicles</span>
        </div>

        {unenteredVehicles.length === 0 ? (
          <div className="idle-empty-state">
            <Check size={28} className="text-emerald-600" />
            <p className="font-semibold text-emerald-800">All registered vehicles have trip entries logged for this date!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table idle-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>S.NO</th>
                  <th>LORY NO. (MASTER)</th>
                  <th>TYPE OF VEHICLE</th>
                  <th>MODEL / MAKE</th>
                  <th>STATUS</th>
                  <th>REASON / REMARK FOR NO ENTRY</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {unenteredVehicles.map((v, idx) => {
                  const cleanNo = v.vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  const currentReason = idleRemarks[cleanNo] || '';
                  const isSaved = savedFeedback[cleanNo];

                  return (
                    <tr key={v.id || cleanNo}>
                      <td className="text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td className="font-semibold text-slate-800 whitespace-nowrap">
                        {cleanNo}
                      </td>
                      <td className="text-slate-700 font-medium">{v.typeOfVehicle || '-'}</td>
                      <td className="text-slate-700">{v.modelMake || '-'}</td>
                      <td>
                        <span className="idle-status-tag">Idle / No Entry</span>
                      </td>
                      <td>
                        <div className="remark-input-group">
                          <input 
                            type="text" 
                            placeholder={isEditable ? "Enter reason (e.g. Under maintenance, No driver, Idle at yard)..." : "View only"}
                            value={currentReason}
                            disabled={!isEditable}
                            onChange={(e) => {
                              const val = e.target.value;
                              setIdleRemarks(prev => ({ ...prev, [cleanNo]: val }));
                            }}
                            className="remark-input"
                          />
                          {isEditable && (
                            <button 
                              type="button" 
                              className={`btn-save-remark ${isSaved ? 'saved' : ''}`}
                              onClick={() => handleSaveRemark(cleanNo)}
                              title="Save Reason"
                            >
                              {isSaved ? <Check size={14} /> : <Save size={14} />}
                              <span>{isSaved ? 'Saved' : 'Save'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isEditable ? (
                          <button 
                            type="button" 
                            className="btn-quick-entry" 
                            onClick={() => openAddModal(cleanNo)}
                            title="Quickly add trip entry for this vehicle"
                          >
                            <Plus size={14} />
                            <span>+ Add Trip Entry</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Entry Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>{editingEntry ? 'Edit Daily Trip Entry' : 'Add Daily Trip Entry'}</h3>
              <button type="button" className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="modal-alert error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                {/* Lory No (Searchable Combobox) */}
                <div className="form-field">
                  <label htmlFor="lNo">LORY NO. (VEHICLE MASTER) *</label>
                  <SearchableVehicleSelect
                    value={loryNo}
                    onChange={setLoryNo}
                    vehicles={registeredVehicles}
                  />
                </div>

                {/* Driver Name (Searchable Combobox) */}
                <div className="form-field">
                  <label htmlFor="dName">DRIVER NAME (DRIVER MASTER)</label>
                  <SearchableDriverSelect
                    value={driverName}
                    onChange={setDriverName}
                    drivers={registeredDrivers}
                  />
                </div>

                {/* Loading From */}
                <div className="form-field">
                  <label htmlFor="lFrom">LOADING FROM</label>
                  <input
                    id="lFrom"
                    type="text"
                    placeholder="Origin location (e.g. Chennai)"
                    value={loadingFrom}
                    onChange={(e) => setLoadingFrom(e.target.value)}
                  />
                </div>

                {/* Loading To */}
                <div className="form-field">
                  <label htmlFor="lTo">LOADING TO</label>
                  <input
                    id="lTo"
                    type="text"
                    placeholder="Destination location (e.g. Madurai)"
                    value={loadingTo}
                    onChange={(e) => setLoadingTo(e.target.value)}
                  />
                </div>

                {/* Weight (MT) */}
                <div className="form-field">
                  <label htmlFor="wt">WEIGHT (MT)</label>
                  <input
                    id="wt"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25.5"
                    value={weight}
                    onChange={(e) => handleWeightChange(e.target.value)}
                  />
                </div>

                {/* Freight PMT */}
                <div className="form-field">
                  <label htmlFor="fPmt">FREIGHT PMT (₹ / MT)</label>
                  <input
                    id="fPmt"
                    type="number"
                    step="0.01"
                    placeholder="Rate per MT (e.g. 1200)"
                    value={freightPmt}
                    onChange={(e) => handleFreightPmtChange(e.target.value)}
                  />
                </div>

                {/* Freight Amount (Auto-Calculated) */}
                <div className="form-field">
                  <label htmlFor="fAmt">FREIGHT AMOUNT (₹)</label>
                  <input
                    id="fAmt"
                    type="number"
                    step="0.01"
                    placeholder="Total Freight Amount"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    className="font-bold text-blue-700"
                  />
                </div>

                {/* Freight Collected From */}
                <div className="form-field">
                  <label htmlFor="fColl">FREIGHT COLLECTED FROM</label>
                  <SearchablePartySelect 
                    value={freightCollectedFrom} 
                    onChange={(name, id) => {
                      setFreightCollectedFrom(name);
                      setFreightPartyId(id || '');
                    }} 
                    parties={registeredParties} 
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Saving Entry...
                    </>
                  ) : (
                    'Save Trip Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
