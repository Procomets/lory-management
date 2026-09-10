import React, { useState, useEffect } from 'react';
import type { Driver } from '../../services/driverService';
import { getDrivers } from '../../services/driverService';
import type { FreightParty } from '../../services/freightPartyService';
import { getFreightParties } from '../../services/freightPartyService';
import type { DailyEntry, EntrySortField, SortDirection } from '../../services/entryService';
import { 
  getAllEntries, 
  updateDailyEntry,
  filterEntries,
  sortEntries
} from '../../services/entryService';
import type { BillRecord, BillItem } from '../../services/billService';
import { 
  getBills, 
  createBill, 
  deleteBill, 
  generateNextBillNumber 
} from '../../services/billService';
import { generateBillPDF } from '../../utils/pdfGenerator';
import { 
  Loader2, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileText,
  Printer,
  History,
  Download,
  Trash2,
  X,
  AlertCircle,
  Search,
  DollarSign,
  Package
} from 'lucide-react';

export const BillingModule: React.FC = () => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [registeredDrivers, setRegisteredDrivers] = useState<Driver[]>([]);
  const [registeredParties, setRegisteredParties] = useState<FreightParty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Row Selection State
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterBilledStatus, setFilterBilledStatus] = useState<'ALL' | 'BILLED' | 'NOT_BILLED'>('ALL');
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterLoadingFrom, setFilterLoadingFrom] = useState<string>('');
  const [filterLoadingTo, setFilterLoadingTo] = useState<string>('');
  const [filterFreightCollectedFrom, setFilterFreightCollectedFrom] = useState<string>('');

  // Sorting States
  const [sortField, setSortField] = useState<EntrySortField | null>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Module Section Tab State ('ENTRIES' | 'HISTORY')
  const [activeTab, setActiveTab] = useState<'ENTRIES' | 'HISTORY'>('ENTRIES');

  // History Filter State
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');

  useEffect(() => {
    loadMasterData();
    fetchBillingEntries();
    fetchGeneratedBills();
  }, []);

  const loadMasterData = async () => {
    try {
      const [dList, pList] = await Promise.all([
        getDrivers(),
        getFreightParties()
      ]);
      setRegisteredDrivers(dList);
      setRegisteredParties(pList);
    } catch (err) {
      console.error("Failed to load master data:", err);
    }
  };

  const fetchBillingEntries = async () => {
    setLoading(true);
    try {
      const entriesData = await getAllEntries();
      setEntries(entriesData);
    } catch (err) {
      console.error("Failed to load billing entries data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return dateStr;
  };

  // Sort Handler
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
      return <ArrowUpDown size={14} className="sort-icon inactive" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="sort-icon active" />
    ) : (
      <ArrowDown size={14} className="sort-icon active" />
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterBilledStatus('ALL');
    setFilterDriver('');
    setFilterLoadingFrom('');
    setFilterLoadingTo('');
    setFilterFreightCollectedFrom('');
  };

  const isFilterActive = 
    searchTerm || 
    filterStartDate || 
    filterEndDate || 
    filterBilledStatus !== 'ALL' || 
    filterDriver || 
    filterLoadingFrom || 
    filterLoadingTo || 
    filterFreightCollectedFrom;

  // Filter and Sort Entries
  const filteredEntries = filterEntries(entries, {
    searchTerm,
    startDate: filterStartDate,
    endDate: filterEndDate,
    billedStatus: filterBilledStatus,
    driverName: filterDriver,
    loadingFrom: filterLoadingFrom,
    loadingTo: filterLoadingTo,
    freightCollectedFrom: filterFreightCollectedFrom
  });

  const sortedEntries = sortEntries(filteredEntries, sortField, sortDirection);

  // Row Selection Helpers
  const isAllSelected = sortedEntries.length > 0 && sortedEntries.every(e => e.id && selectedEntryIds.includes(e.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEntryIds([]);
    } else {
      const allIds = sortedEntries.map(e => e.id).filter((id): id is string => !!id);
      setSelectedEntryIds(allIds);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (!id) return;
    if (selectedEntryIds.includes(id)) {
      setSelectedEntryIds(selectedEntryIds.filter(item => item !== id));
    } else {
      setSelectedEntryIds([...selectedEntryIds, id]);
    }
  };

  const handleToggleBilledStatus = async (entry: DailyEntry) => {
    if (!entry.id) return;
    const currentBilled = Boolean(entry.isBilled);
    const newStatus = !currentBilled;
    try {
      await updateDailyEntry(entry.id, { isBilled: newStatus });
      setEntries(prev => prev.map(item => item.id === entry.id ? { ...item, isBilled: newStatus } : item));
    } catch (err) {
      console.error("Failed to update billed status:", err);
    }
  };

  // Bill Generation & History States
  const [isGeneratingBill, setIsGeneratingBill] = useState<boolean>(false);
  const [generatedBills, setGeneratedBills] = useState<BillRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [billError, setBillError] = useState<string | null>(null);

  // Generate Bill PDF & Store in Firebase collection
  const handleBillNow = async () => {
    if (selectedEntryIds.length === 0) return;
    setBillError(null);

    const selectedEntries = entries.filter(e => e.id && selectedEntryIds.includes(e.id));
    if (selectedEntries.length === 0) return;

    // Verify all selected entries belong to the same freight party
    const partyNames = Array.from(new Set(selectedEntries.map(e => (e.freightCollectedFrom || '').trim()).filter(Boolean)));

    if (partyNames.length > 1) {
      setBillError(`Selected entries belong to multiple Freight Parties (${partyNames.join(', ')}). Please select entries for a single Freight Party to generate a bill.`);
      return;
    }

    setIsGeneratingBill(true);
    try {
      const rawPartyName = partyNames[0] || 'Freight Party';

      // Find matching Freight Party Master record for official address & phone
      const matchedParty = registeredParties.find(p => 
        (p.id && selectedEntries[0].freightPartyId && p.id === selectedEntries[0].freightPartyId) ||
        (p.partyName.toLowerCase() === rawPartyName.toLowerCase())
      );

      const partyAddress = matchedParty?.address || 'Address not registered in Freight Party Master';
      const partyPhone = matchedParty?.phoneNo || '';

      // Fetch existing bills to generate sequential bill number
      const existingBills = await getBills();
      const billNumber = generateNextBillNumber(existingBills);

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const billingDate = `${yyyy}-${mm}-${dd}`;

      const generatedAt = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const items: BillItem[] = selectedEntries.map((e, idx) => ({
        srNo: idx + 1,
        entryId: e.id!,
        date: e.date,
        loryNo: e.loryNo,
        driverName: e.driverName || '-',
        loadingFrom: e.loadingFrom || '-',
        loadingTo: e.loadingTo || '-',
        weight: e.weight || 0,
        freightAmount: e.freightAmount || 0
      }));

      const totalWeightVal = selectedEntries.reduce((sum, e) => sum + (e.weight || 0), 0);
      const totalFreightVal = selectedEntries.reduce((sum, e) => sum + (e.freightAmount || 0), 0);

      const billPayload: Omit<BillRecord, 'id'> = {
        billNumber,
        billingDate,
        generatedAt,
        freightPartyName: matchedParty?.partyName || rawPartyName,
        freightPartyId: matchedParty?.id || selectedEntries[0].freightPartyId || '',
        partyAddress,
        partyPhone,
        items,
        totalWeight: totalWeightVal,
        totalFreightAmount: totalFreightVal,
        entryIds: selectedEntries.map(e => e.id!)
      };

      // 1. Create bill record in Firestore / LocalStorage & update entries isBilled: true
      const createdBill = await createBill(billPayload, selectedEntries.map(e => e.id!));

      // 2. Generate and download PDF
      generateBillPDF(createdBill);

      // 3. Update local entries state to set isBilled: true
      setEntries(prev => prev.map(item => item.id && selectedEntryIds.includes(item.id) ? { ...item, isBilled: true, isBooked: true } : item));

      // 4. Clear selection & refresh generated bills history
      setSelectedEntryIds([]);
      await fetchGeneratedBills();
    } catch (err: any) {
      console.error("Bill generation error:", err);
      setBillError("Failed to generate bill: " + (err?.message || err));
    } finally {
      setIsGeneratingBill(false);
    }
  };

  const fetchGeneratedBills = async () => {
    setHistoryLoading(true);
    try {
      const list = await getBills();
      setGeneratedBills(list);
    } catch (err) {
      console.error("Failed to load generated bills:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteBillRecord = async (bill: BillRecord) => {
    if (!bill.id) return;
    if (!window.confirm(`Are you sure you want to delete Bill #${bill.billNumber}? This will revert selected entries to unbilled status.`)) return;

    try {
      await deleteBill(bill.id, bill.entryIds);
      setGeneratedBills(prev => prev.filter(b => b.id !== bill.id));
      setEntries(prev => prev.map(item => item.id && bill.entryIds.includes(item.id) ? { ...item, isBilled: false, isBooked: false } : item));
    } catch (err) {
      console.error("Delete bill error:", err);
    }
  };

  // Filter Generated Bills History
  const filteredHistoryBills = generatedBills.filter(bill => {
    if (!historySearchTerm) return true;
    const q = historySearchTerm.toLowerCase();
    return (
      (bill.billNumber && bill.billNumber.toLowerCase().includes(q)) ||
      (bill.freightPartyName && bill.freightPartyName.toLowerCase().includes(q)) ||
      (bill.partyAddress && bill.partyAddress.toLowerCase().includes(q)) ||
      (bill.billingDate && bill.billingDate.toLowerCase().includes(q))
    );
  });

  // History Statistics
  const totalHistoryAmount = generatedBills.reduce((sum, b) => sum + (b.totalFreightAmount || 0), 0);
  const totalHistoryTonnage = generatedBills.reduce((sum, b) => sum + (b.totalWeight || 0), 0);

  // Totals for filtered records
  const totalWeight = sortedEntries.reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalFreightAmount = sortedEntries.reduce((sum, item) => sum + (item.freightAmount || 0), 0);

  return (
    <div className="daily-entry-container">
      {/* Top Header Bar with Module Title & Actions */}
      <div className="entry-header-card">
        <div className="entry-header-info">
          <div>
            <h1 className="entry-title">Billing Module</h1>
            <p className="entry-subtitle">All billing records across all dates & freight details</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleBillNow}
            disabled={selectedEntryIds.length === 0 || isGeneratingBill}
            className="btn-bill-now"
            title={selectedEntryIds.length === 0 ? "Select rows from the table to generate PDF bill" : "Generate PDF Bill for selected rows"}
          >
            {isGeneratingBill ? <Loader2 size={16} className="spin" /> : <Printer size={16} />}
            <span>Bill Now {selectedEntryIds.length > 0 ? `(${selectedEntryIds.length})` : ''}</span>
          </button>

          {selectedEntryIds.length > 0 && (
            <button 
              type="button" 
              onClick={() => setSelectedEntryIds([])}
              className="btn-bulk-action btn-bulk-clear"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
              title="Deselect all selected rows"
            >
              Clear Selection ({selectedEntryIds.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => { setActiveTab('HISTORY'); fetchGeneratedBills(); }}
            className={`btn-bills-history ${activeTab === 'HISTORY' ? 'active' : ''}`}
            title="View and re-download previously generated PDF bills"
          >
            <History size={16} />
            <span>Bills History</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="billing-tab-navigation">
        <button
          type="button"
          onClick={() => setActiveTab('ENTRIES')}
          className={`billing-tab-btn ${activeTab === 'ENTRIES' ? 'active' : ''}`}
        >
          <FileText size={16} />
          <span>Trip Billing Entries</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('HISTORY'); fetchGeneratedBills(); }}
          className={`billing-tab-btn ${activeTab === 'HISTORY' ? 'active' : ''}`}
        >
          <History size={16} />
          <span>Generated Bills History</span>
        </button>
      </div>

      {/* Bill Generation Error Alert */}
      {billError && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#991b1b', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{billError}</span>
          </div>
          <button onClick={() => setBillError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* TAB 2: GENERATED BILLS HISTORY SECTION */}
      {activeTab === 'HISTORY' ? (
        <div className="history-section-container">
          {/* Summary Stat Cards */}
          <div className="history-stats-grid">
            <div className="history-stat-card">
              <div className="history-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <History size={22} />
              </div>
              <div className="history-stat-info">
                <label>Total Bills Generated</label>
                <h4>{generatedBills.length}</h4>
              </div>
            </div>

            <div className="history-stat-card">
              <div className="history-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <DollarSign size={22} />
              </div>
              <div className="history-stat-info">
                <label>Total Billed Amount</label>
                <h4>₹{totalHistoryAmount.toLocaleString('en-IN')}</h4>
              </div>
            </div>

            <div className="history-stat-card">
              <div className="history-stat-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
                <Package size={22} />
              </div>
              <div className="history-stat-info">
                <label>Total Billed Tonnage</label>
                <h4>{totalHistoryTonnage.toFixed(2)} MT</h4>
              </div>
            </div>
          </div>

          {/* History Search & Filter Bar */}
          <div className="filter-panel-card mb-6">
            <div className="filter-controls-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="filter-item search-filter">
                <label>Search Generated Bills</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search by Bill No, Freight Party Name, Address, Date..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="filter-input"
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bills History Table Card */}
          <div className="table-card">
            <div className="card-header-bar">
              <h3>All Generated PDF Bills</h3>
              <span className="count-pill">{filteredHistoryBills.length} of {generatedBills.length} Bills Shown</span>
            </div>

            {historyLoading ? (
              <div className="table-loading-container" style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="spin text-blue-600 mb-2" size={32} style={{ margin: '0 auto 8px auto' }} />
                <p>Loading generated bills...</p>
              </div>
            ) : filteredHistoryBills.length === 0 ? (
              <div className="table-empty-container" style={{ padding: '40px', textAlign: 'center' }}>
                <FileText size={48} className="text-slate-300 mb-2" style={{ margin: '0 auto 8px auto' }} />
                <p className="font-semibold text-slate-700">No generated bills found</p>
                <p className="text-xs text-slate-500 mt-1">Select entries from the "Trip Billing Entries" tab and click "Bill Now" to create your first PDF bill.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="master-table grid-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>S.NO</th>
                      <th>INVOICE NO</th>
                      <th>BILLING DATE</th>
                      <th>FREIGHT PARTY & ADDRESS</th>
                      <th>TRIPS BILLED</th>
                      <th>TOTAL WEIGHT</th>
                      <th>TOTAL AMOUNT (₹)</th>
                      <th>GENERATED AT</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistoryBills.map((bill, index) => (
                      <tr key={bill.id || index}>
                        <td className="font-medium text-slate-500">{index + 1}</td>
                        <td className="font-bold text-slate-800">{bill.billNumber}</td>
                        <td className="font-semibold text-slate-700 whitespace-nowrap">{bill.billingDate}</td>
                        <td>
                          <div className="font-bold text-slate-900">{bill.freightPartyName}</div>
                          {bill.partyAddress && (
                            <div className="text-xs text-slate-500 mt-0.5" style={{ lineHeight: 1.3 }}>
                              {bill.partyAddress}
                            </div>
                          )}
                        </td>
                        <td className="font-medium text-slate-700">{bill.items?.length || 0} trips</td>
                        <td className="font-bold text-slate-800">{bill.totalWeight} MT</td>
                        <td className="font-bold text-emerald-600">₹{bill.totalFreightAmount.toLocaleString('en-IN')}</td>
                        <td className="text-xs text-slate-500 whitespace-nowrap">{bill.generatedAt}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => generateBillPDF(bill)}
                              style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Download PDF Bill"
                            >
                              <Download size={13} />
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBillRecord(bill)}
                              style={{ padding: '6px 10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                              title="Delete Bill Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 1: TRIP BILLING ENTRIES SECTION */
        <>

          {/* Filter Controls Panel */}
          <div className="filter-panel-card mb-6">
            <div className="filter-title">
              <Filter size={16} className="text-blue-600" />
              <span>Filter Records:</span>
            </div>

            <div className="filter-controls-grid">
              {/* Main Search */}
              <div className="filter-item search-filter">
                <label>Search Query</label>
                <input 
                  type="text" 
                  placeholder="Search Date, Lory, Driver, Location..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>

              {/* Start Date Range Filter */}
              <div className="filter-item">
                <label>Start Date</label>
                <input 
                  type="date" 
                  value={filterStartDate} 
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              {/* End Date Range Filter */}
              <div className="filter-item">
                <label>End Date</label>
                <input 
                  type="date" 
                  value={filterEndDate} 
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              {/* Billed Status Filter */}
              <div className="filter-item">
                <label>Billed Status</label>
                <select
                  value={filterBilledStatus}
                  onChange={(e) => setFilterBilledStatus(e.target.value as 'ALL' | 'BILLED' | 'NOT_BILLED')}
                  className="filter-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="BILLED">Billed Only</option>
                  <option value="NOT_BILLED">Not Billed Only</option>
                </select>
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
                  placeholder="Destination (e.g. Salem)" 
                  value={filterLoadingTo} 
                  onChange={(e) => setFilterLoadingTo(e.target.value)}
                  className="filter-input"
                />
              </div>

              {/* Freight Collected From Filter */}
              <div className="filter-item">
                <label>Freight Collected From</label>
                {registeredParties.length > 0 ? (
                  <select
                    value={filterFreightCollectedFrom}
                    onChange={(e) => setFilterFreightCollectedFrom(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Freight Parties</option>
                    {registeredParties.map((party, idx) => (
                      <option key={party.id || idx} value={party.partyName}>
                        {party.partyName} {party.address ? `(${party.address})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Client / Party Name" 
                    value={filterFreightCollectedFrom} 
                    onChange={(e) => setFilterFreightCollectedFrom(e.target.value)}
                    className="filter-input"
                  />
                )}
              </div>

              {/* Remove Filters Button */}
              {isFilterActive && (
                <div className="filter-item flex-end">
                  <button type="button" className="btn-reset-filter" onClick={handleResetFilters} title="Clear all active filters">
                    <RotateCcw size={14} />
                    <span>Remove Filters</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Billing Data Table */}
          <div className="table-card">
            <div className="card-header-bar">
              <h3>All Vehicle Trip Billing Entries</h3>
              <span className="count-pill">{sortedEntries.length} of {entries.length} Entries Shown</span>
            </div>

            {loading ? (
              <div className="table-loading-container">
                <Loader2 className="spin text-blue-600 mb-2" size={32} />
                <p>Loading billing data...</p>
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="table-empty-container">
                <FileText size={48} className="text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No trip entries found</p>
                <p className="text-xs text-slate-500 mt-1">Clear active filters or log new entries</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="master-table grid-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>S.NO</th>

                      <th onClick={() => handleSort('date')} className="sortable-th" title="Click to sort by Date">
                        <div className="th-content">
                          <span>DATE</span>
                          {getSortIcon('date')}
                        </div>
                      </th>

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

                      <th onClick={() => handleSort('weight')} className="sortable-th" title="Click to sort by Weight">
                        <div className="th-content">
                          <span>WEIGHT (MT)</span>
                          {getSortIcon('weight')}
                        </div>
                      </th>

                      <th onClick={() => handleSort('freightPmt')} className="sortable-th" title="Click to sort by Freight PMT">
                        <div className="th-content">
                          <span>FREIGHT PMT (₹)</span>
                          {getSortIcon('freightPmt')}
                        </div>
                      </th>

                      <th onClick={() => handleSort('freightAmount')} className="sortable-th" title="Click to sort by Freight Amount">
                        <div className="th-content">
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

                      <th onClick={() => handleSort('isBilled')} className="sortable-th" title="Click to sort by Billed Status">
                        <div className="th-content">
                          <span>BILLED OR NOT</span>
                          {getSortIcon('isBilled')}
                        </div>
                      </th>

                      <th style={{ width: '45px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          title="Select / Deselect All"
                          className="custom-checkbox"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry, index) => {
                      const isSelected = !!(entry.id && selectedEntryIds.includes(entry.id));
                      const isBilled = Boolean(entry.isBilled);

                      return (
                        <tr key={entry.id || index} className={isSelected ? "row-selected" : ""}>
                          <td className="font-medium text-slate-500">{index + 1}</td>
                          <td className="font-semibold text-slate-700 whitespace-nowrap">
                            {formatDateDisplay(entry.date)}
                          </td>
                          <td className="font-bold text-slate-800">{entry.loryNo}</td>
                          <td className="font-medium text-slate-700">{entry.driverName || '-'}</td>
                          <td className="text-slate-600">{entry.loadingFrom || '-'}</td>
                          <td className="text-slate-600">{entry.loadingTo || '-'}</td>
                          <td className="font-bold text-slate-800">{entry.weight > 0 ? `${entry.weight} MT` : '-'}</td>
                          <td className="font-semibold text-slate-800">{entry.freightPmt > 0 ? `₹${entry.freightPmt.toLocaleString('en-IN')}` : '-'}</td>
                          <td className="font-bold text-slate-800">{entry.freightAmount > 0 ? `₹${entry.freightAmount.toLocaleString('en-IN')}` : '-'}</td>
                          <td className="text-slate-600">{entry.freightCollectedFrom || '-'}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleBilledStatus(entry)}
                              title="Click to toggle Billed / Not Billed status"
                              className="billed-status-btn"
                            >
                              {isBilled ? (
                                <span className="billed-badge badge-is-billed">
                                  Billed
                                </span>
                              ) : (
                                <span className="billed-badge badge-not-billed">
                                  Not Billed
                                </span>
                              )}
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => entry.id && handleToggleSelect(entry.id)}
                              className="custom-checkbox"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Summary Total Row */}
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                      <td colSpan={6} className="text-right py-3 pr-4">TOTAL:</td>
                      <td className="py-3 text-slate-800">{totalWeight > 0 ? `${totalWeight.toFixed(2)} MT` : '-'}</td>
                      <td className="py-3 text-slate-400">-</td>
                      <td className="py-3 text-slate-800">₹{totalFreightAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3">-</td>
                      <td className="py-3">-</td>
                      <td className="py-3">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

