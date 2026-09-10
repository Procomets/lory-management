import React, { useState, useEffect } from 'react';
import type { FreightParty } from '../../services/freightPartyService';
import { 
  getFreightParties, 
  addFreightParty, 
  updateFreightParty, 
  deleteFreightParty 
} from '../../services/freightPartyService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  Building2, 
  Phone, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Filter,
  RotateCcw
} from 'lucide-react';

export const FreightPartyMastery: React.FC = () => {
  const [parties, setParties] = useState<FreightParty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingParty, setEditingParty] = useState<FreightParty | null>(null);
  
  const [partyName, setPartyName] = useState<string>('');
  const [phoneNo, setPhoneNo] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFreightParties();
      setParties(data);
    } catch (err: any) {
      console.error("Failed to load freight parties:", err);
      setError("Failed to fetch freight parties list.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingParty(null);
    setPartyName('');
    setPhoneNo('');
    setAddress('');
    setStatus('Active');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (party: FreightParty) => {
    setEditingParty(party);
    setPartyName(party.partyName);
    setPhoneNo(party.phoneNo || '');
    setAddress(party.address || '');
    setStatus(party.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partyName.trim()) {
      setError('Person / Company Name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const partyPayload = {
        partyName: partyName.trim(),
        phoneNo: phoneNo.trim(),
        address: address.trim(),
        status
      };

      if (editingParty && editingParty.id) {
        await updateFreightParty(editingParty.id, partyPayload);
      } else {
        await addFreightParty(partyPayload);
      }

      setIsModalOpen(false);
      await loadParties();
    } catch (err: any) {
      console.error("Save freight party error:", err);
      setError(err.message || 'Failed to save freight party details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete freight party "${name}"?`)) {
      try {
        await deleteFreightParty(id);
        await loadParties();
      } catch (err) {
        console.error("Delete freight party failed:", err);
      }
    }
  };

  const handleToggleStatus = async (party: FreightParty) => {
    if (!party.id) return;
    const newStatus = party.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateFreightParty(party.id, { status: newStatus });
      setParties(prev => prev.map(p => p.id === party.id ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const isFilterActive = searchTerm.trim() !== '' || statusFilter !== 'ALL';

  // Filtered List
  const filteredParties = parties.filter(party => {
    if (statusFilter !== 'ALL' && party.status !== statusFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchesName = party.partyName.toLowerCase().includes(q);
      const matchesPhone = party.phoneNo ? party.phoneNo.toLowerCase().includes(q) : false;
      const matchesAddress = party.address ? party.address.toLowerCase().includes(q) : false;
      return matchesName || matchesPhone || matchesAddress;
    }

    return true;
  });

  const activeCount = parties.filter(p => p.status === 'Active').length;

  return (
    <div className="daily-entry-container">
      {/* Top Header Card */}
      <div className="entry-header-card">
        <div className="entry-header-info">
          <div>
            <h1 className="entry-title">Freight Collected From Master</h1>
            <p className="entry-subtitle">Manage client names, contact details, company addresses & payment parties</p>
          </div>
        </div>

        <button 
          type="button" 
          className="btn-primary" 
          onClick={openAddModal}
        >
          <Plus size={18} />
          <span>Add Freight Party</span>
        </button>
      </div>

      {/* Filter Controls Panel */}
      <div className="filter-panel-card mb-6">
        <div className="filter-title">
          <Filter size={16} className="text-blue-600" />
          <span>Filter Freight Parties:</span>
        </div>

        <div className="filter-controls-grid">
          {/* Main Search Query */}
          <div className="filter-item search-filter">
            <label>Search Query</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Name, Phone, Address..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-item">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'Active' | 'Inactive')}
              className="filter-select"
            >
              <option value="ALL">All Statuses ({parties.length})</option>
              <option value="Active">Active Only ({activeCount})</option>
              <option value="Inactive">Inactive Only ({parties.length - activeCount})</option>
            </select>
          </div>

          {/* Remove Filters Button */}
          {isFilterActive && (
            <div className="filter-item flex-end">
              <button 
                type="button" 
                className="btn-reset-filter" 
                onClick={handleResetFilters}
                title="Clear active filters"
              >
                <RotateCcw size={14} />
                <span>Remove Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Master Data Table */}
      <div className="table-card">
        <div className="card-header-bar">
          <h3>Registered Freight Parties / Clients</h3>
          <span className="count-pill">{filteredParties.length} of {parties.length} Parties</span>
        </div>

        {loading ? (
          <div className="table-loading-container">
            <Loader2 className="spin text-blue-600 mb-2" size={32} />
            <p>Loading party records...</p>
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="table-empty-container">
            <Building2 size={48} className="text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No freight parties found</p>
            <p className="text-xs text-slate-500 mt-1">Clear active filters or click "+ Add Freight Party" to register one</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="master-table grid-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>S.NO</th>
                  <th>PERSON / COMPANY NAME</th>
                  <th>PHONE NO.</th>
                  <th>COMPANY ADDRESS</th>
                  <th style={{ width: '130px' }}>STATUS</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredParties.map((party, index) => {
                  const isActive = party.status === 'Active';

                  return (
                    <tr key={party.id || index}>
                      <td className="font-medium text-slate-500">{index + 1}</td>
                      <td className="font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-blue-600 flex-shrink-0" />
                          <span>{party.partyName}</span>
                        </div>
                      </td>
                      <td className="font-medium text-slate-700">
                        {party.phoneNo ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone size={14} className="text-slate-400" />
                            <span>{party.phoneNo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="text-slate-600 max-w-md">
                        {party.address ? (
                          <div className="flex items-start gap-1.5 text-slate-600">
                            <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>{party.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(party)}
                          title="Click to toggle Active / Inactive status"
                          className="billed-status-btn"
                        >
                          {isActive ? (
                            <span className="billed-badge badge-is-billed">
                              <CheckCircle size={13} />
                              Active
                            </span>
                          ) : (
                            <span className="billed-badge badge-not-billed">
                              <XCircle size={13} />
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-cell justify-center">
                          <button
                            type="button"
                            className="icon-btn icon-btn-edit"
                            title="Edit Details"
                            onClick={() => openEditModal(party)}
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            type="button"
                            className="icon-btn icon-btn-delete"
                            title="Delete Party"
                            onClick={() => party.id && handleDelete(party.id, party.partyName)}
                          >
                            <Trash2 size={15} />
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

      {/* Add / Edit Freight Party Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                <h3 className="modal-title">
                  {editingParty ? 'Edit Freight Party Details' : 'Add New Freight Party'}
                </h3>
              </div>
              <button 
                type="button" 
                className="icon-btn" 
                onClick={() => setIsModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {error && (
                <div className="alert-box alert-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Name of Person / Company */}
              <div className="form-group">
                <label htmlFor="partyName">Name of Person / Company *</label>
                <input
                  id="partyName"
                  type="text"
                  placeholder="e.g. Sri Lakshmi Logistics / Rajesh K"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="phoneNo">Phone Number</label>
                <input
                  id="phoneNo"
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                />
              </div>

              {/* Address of Company */}
              <div className="form-group">
                <label htmlFor="address">Company Address</label>
                <textarea
                  id="address"
                  rows={3}
                  placeholder="e.g. Door No, Street, Industrial Area, City, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingParty ? 'Update Details' : 'Add Party'}</span>
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
