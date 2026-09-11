import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../../services/vehicleService';
import { 
  getVehicles, 
  addVehicle, 
  updateVehicle, 
  deleteVehicle, 
  uploadToCloudinary,
  VEHICLE_TYPES
} from '../../services/vehicleService';
import { 
  Plus, 
  Search, 
  Truck, 
  FileText, 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  X, 
  Upload, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  CheckCircle2,
  Filter,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const VehicleMastery: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Advanced Filter States
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterPurchaseYear, setFilterPurchaseYear] = useState<string>('ALL');
  const [filterDueStatus, setFilterDueStatus] = useState<string>('ALL');

  // Sorting States
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [typeOfVehicle, setTypeOfVehicle] = useState<string>(VEHICLE_TYPES[0]);
  const [modelMake, setModelMake] = useState<string>('');
  const [purchaseYear, setPurchaseYear] = useState<string>(new Date().getFullYear().toString());
  const [fcDueDate, setFcDueDate] = useState<string>('');
  const [insDueDate, setInsDueDate] = useState<string>('');

  // Image files & preview URLs
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [rcPreview, setRcPreview] = useState<string>('');
  
  const [fcFile, setFcFile] = useState<File | null>(null);
  const [fcPreview, setFcPreview] = useState<string>('');
  
  const [insFile, setInsFile] = useState<File | null>(null);
  const [insPreview, setInsPreview] = useState<string>('');

  // Lightbox Image Viewer Modal
  const [activeDocViewer, setActiveDocViewer] = useState<{ title: string; url: string } | null>(null);

  // Generate Year options (Current year back to 1990)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    fetchVehiclesList();
  }, []);

  const fetchVehiclesList = async () => {
    setLoading(true);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleNo('');
    setTypeOfVehicle(VEHICLE_TYPES[0]);
    setModelMake('');
    setPurchaseYear(currentYear.toString());
    setFcDueDate('');
    setInsDueDate('');
    
    setRcFile(null);
    setRcPreview('');
    setFcFile(null);
    setFcPreview('');
    setInsFile(null);
    setInsPreview('');
    
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleNo(v.vehicleNo);
    setTypeOfVehicle(v.typeOfVehicle || VEHICLE_TYPES[0]);
    setModelMake(v.modelMake);
    setPurchaseYear(v.dateOfPurchase || currentYear.toString());
    setFcDueDate(v.fcDueDate);
    setInsDueDate(v.insDueDate);
    
    setRcFile(null);
    setRcPreview(v.rcBookUrl || '');
    setFcFile(null);
    setFcPreview(v.fcBookUrl || '');
    setInsFile(null);
    setInsPreview(v.insuranceBookUrl || '');
    
    setError(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFile: React.Dispatch<React.SetStateAction<File | null>>, 
    setPreview: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vehicleNo.trim() || !modelMake.trim()) {
      setError('Vehicle Number and Model / Make are required.');
      return;
    }

    try {
      setSubmitting(true);

      // Upload image files to Cloudinary (or fallback)
      let rcBookUrl = editingVehicle?.rcBookUrl || '';
      if (rcFile) {
        rcBookUrl = await uploadToCloudinary(rcFile);
      }

      let fcBookUrl = editingVehicle?.fcBookUrl || '';
      if (fcFile) {
        fcBookUrl = await uploadToCloudinary(fcFile);
      }

      let insuranceBookUrl = editingVehicle?.insuranceBookUrl || '';
      if (insFile) {
        insuranceBookUrl = await uploadToCloudinary(insFile);
      }

      const cleanVehicleNo = vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, '');

      const vehicleData = {
        vehicleNo: cleanVehicleNo,
        typeOfVehicle,
        modelMake: modelMake.trim(),
        dateOfPurchase: purchaseYear,
        fcDueDate,
        insDueDate,
        rcBookUrl,
        fcBookUrl,
        insuranceBookUrl
      };

      if (editingVehicle) {
        const vehicleId = editingVehicle.id || 'v-1';
        await updateVehicle(vehicleId, vehicleData);
      } else {
        await addVehicle(vehicleData);
      }

      setIsModalOpen(false);
      await fetchVehiclesList();
    } catch (err: any) {
      console.error("Save vehicle failed:", err);
      setError(err.message || 'Failed to save vehicle details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete vehicle "${name}"?`)) {
      try {
        await deleteVehicle(id);
        await fetchVehiclesList();
      } catch (err) {
        console.error("Delete vehicle failed:", err);
      }
    }
  };

  // Helper to format YYYY-MM-DD into DD-MM-YYYY (date-month-year)
  const formatDateDMY = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Date status calculation (Cell shading for <=5 days red, <=10 days orange, >10 days valid plain)
  const getDueDateStatus = (dateStr: string) => {
    if (!dateStr) return { cellClass: '', label: '' };
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 5) {
      // 5 days near entered date or expired -> shade red
      return { 
        cellClass: 'date-shaded-red', 
        label: diffDays < 0 ? 'Expired' : `Expires in ${diffDays}d` 
      };
    } else if (diffDays <= 10) {
      // Near 10 days -> keep cell orange
      return { 
        cellClass: 'date-shaded-orange', 
        label: `Expires in ${diffDays}d` 
      };
    } else {
      // Valid date (> 10 days) -> NO box showing valid!
      return { 
        cellClass: '', 
        label: '' 
      };
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('ALL');
    setFilterModel('');
    setFilterPurchaseYear('ALL');
    setFilterDueStatus('ALL');
  };

  const handleSort = (field: string) => {
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

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="sort-icon-neutral" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={13} className="sort-icon-active" />
    ) : (
      <ArrowDown size={13} className="sort-icon-active" />
    );
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = !searchTerm || 
      v.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.typeOfVehicle && v.typeOfVehicle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'ALL' || v.typeOfVehicle === filterType;
    const matchesModel = !filterModel.trim() || v.modelMake.toLowerCase().includes(filterModel.trim().toLowerCase());
    const matchesYear = filterPurchaseYear === 'ALL' || v.dateOfPurchase === filterPurchaseYear;

    let matchesDueStatus = true;
    if (filterDueStatus !== 'ALL') {
      const fcStatus = getDueDateStatus(v.fcDueDate);
      const insStatus = getDueDateStatus(v.insDueDate);

      if (filterDueStatus === 'RED') {
        matchesDueStatus = fcStatus.cellClass === 'date-shaded-red' || insStatus.cellClass === 'date-shaded-red';
      } else if (filterDueStatus === 'ORANGE') {
        matchesDueStatus = fcStatus.cellClass === 'date-shaded-orange' || insStatus.cellClass === 'date-shaded-orange';
      } else if (filterDueStatus === 'VALID') {
        matchesDueStatus = fcStatus.cellClass === '' && insStatus.cellClass === '';
      }
    }

    return matchesSearch && matchesType && matchesModel && matchesYear && matchesDueStatus;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (!sortField) return 0;

    let valA = (a[sortField as keyof Vehicle] || '').toString().toLowerCase();
    let valB = (b[sortField as keyof Vehicle] || '').toString().toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const isFilterActive = searchTerm || filterType !== 'ALL' || filterModel || filterPurchaseYear !== 'ALL' || filterDueStatus !== 'ALL';

  return (
    <div className="vehicle-mastery-container">
      {/* Module Header Bar (Icon Removed as requested) */}
      <div className="mastery-header">
        <div className="header-info">
          <div>
            <h2 className="mastery-title">Vehicle Mastery</h2>
            <p className="mastery-subtitle">Manage fleet vehicles, type classifications, fitness certificates & document records</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Due Date Status Legend Instructions */}
          <div className="date-legend">
            <span className="legend-badge legend-red" title="FC / Insurance due date is within 5 days or expired">
              <span className="legend-dot bg-red"></span>
              <span>Due ≤ 5d / Expired</span>
            </span>
            <span className="legend-badge legend-orange" title="FC / Insurance due date is within 10 days">
              <span className="legend-dot bg-orange"></span>
              <span>Due ≤ 10d</span>
            </span>
          </div>

          {/* Search Input */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search Vehicle No, Type, or Model..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Vehicle Button */}
          <button type="button" className="btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="filter-panel-card">
        <div className="filter-title">
          <Filter size={16} className="text-blue-600" />
          <span>Filter Records:</span>
        </div>

        <div className="filter-controls-grid">
          {/* Type of Vehicle Filter */}
          <div className="filter-item">
            <label>Type of Vehicle</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
              <option value="ALL">All Vehicle Types</option>
              {VEHICLE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Model / Make Filter */}
          <div className="filter-item">
            <label>Model / Make</label>
            <input 
              type="text" 
              placeholder="e.g. Ashok Leyland" 
              value={filterModel} 
              onChange={(e) => setFilterModel(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Purchase Year Filter */}
          <div className="filter-item">
            <label>Purchase Year</label>
            <select value={filterPurchaseYear} onChange={(e) => setFilterPurchaseYear(e.target.value)} className="filter-select">
              <option value="ALL">All Purchase Years</option>
              {yearOptions.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Due Status Filter */}
          <div className="filter-item">
            <label>Due Status (Colors)</label>
            <select value={filterDueStatus} onChange={(e) => setFilterDueStatus(e.target.value)} className="filter-select">
              <option value="ALL">All Statuses</option>
              <option value="RED">🔴 Due ≤ 5 Days / Expired (Red)</option>
              <option value="ORANGE">🟠 Due ≤ 10 Days (Orange)</option>
              <option value="VALID">Clean / Valid (&gt; 10 Days)</option>
            </select>
          </div>

          {/* Reset Button */}
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

      {/* Main Table Content */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spin text-blue-600" />
            <p>Loading vehicle records from Firebase...</p>
          </div>
        ) : sortedVehicles.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} className="text-slate-300" />
            <h3>No Vehicles Found</h3>
            <p>{isFilterActive ? 'No vehicles match your active search and filter criteria.' : 'Click "Add Vehicle" to register a new vehicle into the fleet database.'}</p>
            {isFilterActive && (
              <button type="button" className="btn-secondary mt-2" onClick={resetFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('vehicleNo')} className="sortable-th" title="Click to sort by Vehicle No">
                    <div className="th-content">
                      <span>VEHICLE NO</span>
                      {getSortIcon('vehicleNo')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('typeOfVehicle')} className="sortable-th" title="Click to sort by Type of Vehicle">
                    <div className="th-content">
                      <span>TYPE OF VEHICLE</span>
                      {getSortIcon('typeOfVehicle')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('modelMake')} className="sortable-th" title="Click to sort by Model / Make">
                    <div className="th-content">
                      <span>MODEL / MAKE</span>
                      {getSortIcon('modelMake')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('dateOfPurchase')} className="sortable-th" title="Click to sort by Purchase Year">
                    <div className="th-content">
                      <span>PURCHASE YEAR</span>
                      {getSortIcon('dateOfPurchase')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('fcDueDate')} className="sortable-th" title="Click to sort by FC Due Date">
                    <div className="th-content">
                      <span>FC DUE DATE</span>
                      {getSortIcon('fcDueDate')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('insDueDate')} className="sortable-th" title="Click to sort by Insurance Due Date">
                    <div className="th-content">
                      <span>INS. DUE DATE</span>
                      {getSortIcon('insDueDate')}
                    </div>
                  </th>
                  <th>DOCUMENTS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sortedVehicles.map((v) => {
                  const fcStatus = getDueDateStatus(v.fcDueDate);
                  const insStatus = getDueDateStatus(v.insDueDate);

                  return (
                    <tr key={v.id}>
                      <td className="font-semibold text-slate-800" style={{ whiteSpace: 'nowrap' }}>
                        {v.vehicleNo ? v.vehicleNo.toUpperCase().replace(/[^A-Z0-9]/g, '') : ''}
                      </td>
                      <td className="font-medium text-slate-700">
                        {v.typeOfVehicle || 'N/A'}
                      </td>
                      <td className="font-medium text-slate-700">{v.modelMake}</td>
                      <td>
                        <span className="font-semibold text-slate-800">{v.dateOfPurchase || '-'}</span>
                      </td>
                      
                      {/* FC Due Date */}
                      <td className={fcStatus.cellClass}>
                        <div className="date-cell-content">
                          <span className="font-semibold">{formatDateDMY(v.fcDueDate)}</span>
                          {fcStatus.label && (
                            <span className="date-warning-subtext">{fcStatus.label}</span>
                          )}
                        </div>
                      </td>

                      {/* Insurance Due Date */}
                      <td className={insStatus.cellClass}>
                        <div className="date-cell-content">
                          <span className="font-semibold">{formatDateDMY(v.insDueDate)}</span>
                          {insStatus.label && (
                            <span className="date-warning-subtext">{insStatus.label}</span>
                          )}
                        </div>
                      </td>

                      {/* Document Thumbnails */}
                      <td>
                        <div className="doc-chips-container">
                          {v.rcBookUrl ? (
                            <button 
                              type="button" 
                              className="doc-chip rc"
                              onClick={() => setActiveDocViewer({ title: `RC Book - ${v.vehicleNo}`, url: v.rcBookUrl })}
                            >
                              <FileText size={13} />
                              <span>RC Book</span>
                            </button>
                          ) : (
                            <span className="doc-chip missing">RC -</span>
                          )}

                          {v.fcBookUrl ? (
                            <button 
                              type="button" 
                              className="doc-chip fc"
                              onClick={() => setActiveDocViewer({ title: `FC Book - ${v.vehicleNo}`, url: v.fcBookUrl })}
                            >
                              <CheckCircle2 size={13} />
                              <span>FC Book</span>
                            </button>
                          ) : (
                            <span className="doc-chip missing">FC -</span>
                          )}

                          {v.insuranceBookUrl ? (
                            <button 
                              type="button" 
                              className="doc-chip ins"
                              onClick={() => setActiveDocViewer({ title: `Insurance Book - ${v.vehicleNo}`, url: v.insuranceBookUrl })}
                            >
                              <ImageIcon size={13} />
                              <span>Insurance</span>
                            </button>
                          ) : (
                            <span className="doc-chip missing">INS -</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-group">
                          <button 
                            type="button" 
                            className="action-btn edit" 
                            title="Edit Vehicle"
                            onClick={() => openEditModal(v)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="action-btn delete" 
                            title="Delete Vehicle"
                            onClick={() => v.id && handleDelete(v.id, v.vehicleNo)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle Details' : 'Add New Vehicle'}</h3>
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
                {/* Vehicle No */}
                <div className="form-field">
                  <label htmlFor="vNo">VEHICLE NO *</label>
                  <input
                    id="vNo"
                    type="text"
                    placeholder="e.g. TN38AB1234"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    required
                  />
                </div>

                {/* Type of Vehicle Dropdown */}
                <div className="form-field">
                  <label htmlFor="tVehicle">TYPE OF VEHICLE *</label>
                  <select
                    id="tVehicle"
                    value={typeOfVehicle}
                    onChange={(e) => setTypeOfVehicle(e.target.value)}
                    required
                    className="form-select"
                  >
                    {VEHICLE_TYPES.map((typeOption) => (
                      <option key={typeOption} value={typeOption}>
                        {typeOption}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model / Make */}
                <div className="form-field">
                  <label htmlFor="mMake">MODEL / MAKE *</label>
                  <input
                    id="mMake"
                    type="text"
                    placeholder="e.g. Ashok Leyland 3518"
                    value={modelMake}
                    onChange={(e) => setModelMake(e.target.value)}
                    required
                  />
                </div>

                {/* Purchase Year */}
                <div className="form-field">
                  <label htmlFor="pYear">YEAR OF PURCHASE</label>
                  <select
                    id="pYear"
                    value={purchaseYear}
                    onChange={(e) => setPurchaseYear(e.target.value)}
                    className="form-select"
                  >
                    {yearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FC Due Date */}
                <div className="form-field">
                  <label htmlFor="fcDate">FC DUE DATE</label>
                  <input
                    id="fcDate"
                    type="date"
                    value={fcDueDate}
                    onChange={(e) => setFcDueDate(e.target.value)}
                  />
                </div>

                {/* Insurance Due Date */}
                <div className="form-field">
                  <label htmlFor="insDate">INS. DUE DATE</label>
                  <input
                    id="insDate"
                    type="date"
                    value={insDueDate}
                    onChange={(e) => setInsDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Document Image Upload Dropzones */}
              <div className="doc-uploads-section">
                <h4 className="section-label">Vehicle Document Images (Cloudinary Uploads)</h4>

                <div className="uploads-grid">
                  {/* RC Book */}
                  <div className="upload-dropzone">
                    <span className="dropzone-title">RC BOOK</span>
                    {rcPreview ? (
                      <div className="preview-box">
                        <img src={rcPreview} alt="RC Book Preview" />
                        <button type="button" className="remove-img" onClick={() => { setRcFile(null); setRcPreview(''); }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="dropzone-label">
                        <Upload size={20} className="text-slate-400" />
                        <span>Upload RC Image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(e, setRcFile, setRcPreview)} 
                        />
                      </label>
                    )}
                  </div>

                  {/* FC Book */}
                  <div className="upload-dropzone">
                    <span className="dropzone-title">FC BOOK</span>
                    {fcPreview ? (
                      <div className="preview-box">
                        <img src={fcPreview} alt="FC Book Preview" />
                        <button type="button" className="remove-img" onClick={() => { setFcFile(null); setFcPreview(''); }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="dropzone-label">
                        <Upload size={20} className="text-slate-400" />
                        <span>Upload FC Image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(e, setFcFile, setFcPreview)} 
                        />
                      </label>
                    )}
                  </div>

                  {/* Insurance Book */}
                  <div className="upload-dropzone">
                    <span className="dropzone-title">INSURANCE BOOK</span>
                    {insPreview ? (
                      <div className="preview-box">
                        <img src={insPreview} alt="Insurance Book Preview" />
                        <button type="button" className="remove-img" onClick={() => { setInsFile(null); setInsPreview(''); }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="dropzone-label">
                        <Upload size={20} className="text-slate-400" />
                        <span>Upload Ins. Image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(e, setInsFile, setInsPreview)} 
                        />
                      </label>
                    )}
                  </div>
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
                      Uploading & Saving...
                    </>
                  ) : (
                    'Save Vehicle Details'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Lightbox Modal */}
      {activeDocViewer && (
        <div className="lightbox-overlay" onClick={() => setActiveDocViewer(null)}>
          <div className="lightbox-card" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <h4>{activeDocViewer.title}</h4>
              <div className="lightbox-actions">
                <a href={activeDocViewer.url} target="_blank" rel="noopener noreferrer" className="icon-link-btn" title="Open Full Image in New Tab">
                  <ExternalLink size={18} />
                </a>
                <button type="button" className="close-btn" onClick={() => setActiveDocViewer(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="lightbox-body">
              <img src={activeDocViewer.url} alt={activeDocViewer.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
