import React, { useState, useEffect } from 'react';
import type { Driver } from '../../services/driverService';
import { 
  getDrivers, 
  addDriver, 
  updateDriver, 
  deleteDriver 
} from '../../services/driverService';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Search, 
  UserCheck, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  RotateCcw,
  UserX,
  Users,
  Phone,
  Lock
} from 'lucide-react';

export const DriverMastery: React.FC = () => {
  const { currentUser } = useAuth();
  const isEmployee = currentUser?.role === 'employee';
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [driverName, setDriverName] = useState<string>('');
  const [phoneNo, setPhoneNo] = useState<string>('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    fetchDriversList();
  }, []);

  const fetchDriversList = async () => {
    setLoading(true);
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingDriver(null);
    setDriverName('');
    setPhoneNo('');
    setStatus('Active');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverName(driver.driverName);
    setPhoneNo(driver.phoneNo || '');
    setStatus(driver.status);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) {
      setError('Please enter driver name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        driverName: driverName.trim(),
        phoneNo: phoneNo.trim(),
        status
      };

      if (editingDriver && editingDriver.id) {
        await updateDriver(editingDriver.id, payload);
      } else {
        await addDriver(payload);
      }

      await fetchDriversList();
      closeModal();
    } catch (err: any) {
      setError(err?.message || 'Failed to save driver details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isEmployee) {
      alert("Employees are not authorized to delete driver records.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete driver "${name}"?`)) {
      try {
        await deleteDriver(id);
        await fetchDriversList();
      } catch (err) {
        alert("Failed to delete driver.");
      }
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
  };

  // Filtered List
  const filteredDrivers = drivers.filter(driver => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      driver.driverName.toLowerCase().includes(q) || 
      (driver.phoneNo && driver.phoneNo.toLowerCase().includes(q));

    const matchesStatus = filterStatus === 'ALL' || driver.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate Statistics
  const totalCount = drivers.length;
  const activeCount = drivers.filter(d => d.status === 'Active').length;
  const inactiveCount = drivers.filter(d => d.status === 'Inactive').length;

  return (
    <div className="module-container">
      {/* Module Title & Action Bar */}
      <div className="module-header-row">
        <div>
          <h1 className="module-title">Driver Master</h1>
          <p className="module-subtitle">Manage driver names and profiles stored in Firebase</p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary btn-add-vehicle"
          onClick={openAddModal}
        >
          <Plus size={18} />
          <span>Add New Driver</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="master-stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue-50 text-blue-600">
            <Users size={22} />
          </div>
          <div>
            <span className="stat-label">Total Drivers</span>
            <div className="stat-value">{totalCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-green-50 text-green-600">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="stat-label">Active Drivers</span>
            <div className="stat-value text-green-700">{activeCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-slate-100 text-slate-600">
            <UserX size={22} />
          </div>
          <div>
            <span className="stat-label">Inactive Drivers</span>
            <div className="stat-value text-slate-600">{inactiveCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card mb-6">
        <div className="filter-row">
          {/* Search Box */}
          <div className="filter-group search-input-group flex-1">
            <label>Search</label>
            <div className="input-with-icon">
              <Search className="icon" size={18} />
              <input
                type="text"
                placeholder="Search driver name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-group width-160">
            <label>Status</label>
            <div className="input-with-icon">
              <Filter className="icon" size={16} />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="filter-actions-end">
            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drivers Data Table */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading-container">
            <Loader2 className="spin text-blue-600 mb-2" size={32} />
            <p>Loading drivers from Firebase...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="table-empty-container">
            <UserX size={48} className="text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No driver records found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting search query or add a new driver</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="master-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>S.NO</th>
                  <th>DRIVER NAME</th>
                  <th>PHONE NUMBER</th>
                  <th>STATUS</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver, index) => {
                  const isActive = driver.status === 'Active';
                  return (
                    <tr key={driver.id || index}>
                      <td className="font-medium text-slate-400">{index + 1}</td>
                      <td className="font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                            {driver.driverName.charAt(0).toUpperCase()}
                          </div>
                          <span>{driver.driverName}</span>
                        </div>
                      </td>
                      <td className="text-slate-600">
                        {driver.phoneNo ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone size={14} className="text-slate-400" />
                            <span>{driver.phoneNo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${isActive ? 'badge-green' : 'badge-slate'}`}>
                          {isActive ? <CheckCircle2 size={12} /> : <X size={12} />}
                          <span>{driver.status}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-cell justify-center">
                          <button
                            type="button"
                            className="icon-btn icon-btn-edit"
                            title="Edit Driver"
                            onClick={() => openEditModal(driver)}
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            type="button"
                            className={`icon-btn ${isEmployee ? 'icon-btn-disabled' : 'icon-btn-delete'}`}
                            title={isEmployee ? "Employees cannot delete" : "Delete Driver"}
                            onClick={() => driver.id && handleDelete(driver.id, driver.driverName)}
                            disabled={isEmployee}
                          >
                            {isEmployee ? <Lock size={15} /> : <Trash2 size={16} />}
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

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <div className="modal-header-icon bg-blue-50 text-blue-600">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingDriver ? 'Update driver name and details' : 'Feed driver name into Firebase'}
                  </p>
                </div>
              </div>
              <button type="button" className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-error mb-4">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Driver Name */}
                <div className="form-group mb-4">
                  <label htmlFor="driverName" className="required">DRIVER NAME</label>
                  <input
                    id="driverName"
                    type="text"
                    required
                    placeholder="Enter full driver name (e.g. Ramesh Kumar)"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>

                {/* Phone Number */}
                <div className="form-group mb-4">
                  <label htmlFor="phoneNo">PHONE NUMBER (OPTIONAL)</label>
                  <input
                    id="phoneNo"
                    type="text"
                    placeholder="Enter mobile number"
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                  />
                </div>

                {/* Status Selection */}
                <div className="form-group mb-2">
                  <label htmlFor="statusSelect">STATUS</label>
                  <select
                    id="statusSelect"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingDriver ? 'Save Changes' : 'Add Driver'}</span>
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
