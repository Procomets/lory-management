import React, { useState, useEffect } from 'react';
import type { ManagedUser } from '../../services/userService';
import { 
  getUsers, 
  addUser, 
  updateUser, 
  changeUserPassword, 
  deleteUser 
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Key, 
  ShieldCheck, 
  User as UserIcon, 
  Mail, 
  X, 
  Loader2, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff,
  Filter,
  RotateCcw
} from 'lucide-react';

export const UserManagementModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Password Visibility Toggle State per user (default visible)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (uid: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [uid]: prev[uid] === false ? true : false
    }));
  };

  // Form Fields - Add / Edit User
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<UserRole>('employee');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Password Reset Fields
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Status & Error
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setRole('employee');
    setPassword('');
    setShowPassword(false);
    setError(null);
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setError(null);
    setIsAddEditModalOpen(true);
  };

  const openPasswordModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setError(null);
    setIsPasswordModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!selectedUser && !password.trim()) {
      setError('Password is required when creating a new user.');
      return;
    }
    if (!selectedUser && password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);

      if (selectedUser) {
        // Update existing user details
        await updateUser(selectedUser.uid, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role
        });
        showFeedback('User details updated successfully!');
      } else {
        // Add new user
        await addUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role,
          password: password
        });
        showFeedback('New user added successfully!');
      }

      setIsAddEditModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      console.error("Save user error:", err);
      setError(err.message || 'Failed to save user information.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await changeUserPassword(selectedUser.uid, selectedUser.email, newPassword);
      showFeedback(`Password changed successfully for ${selectedUser.name}!`);
      setIsPasswordModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      console.error("Change password error:", err);
      setError(err.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    if (currentUser?.uid === user.uid) {
      alert("You cannot delete your own currently logged-in account!");
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.name}" (${user.email})? This action cannot be undone.`)) {
      try {
        await deleteUser(user.uid);
        showFeedback(`User "${user.name}" has been deleted.`);
        await loadUsers();
      } catch (err) {
        console.error("Delete user error:", err);
        alert("Failed to delete user.");
      }
    }
  };

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const employeeCount = users.filter(u => u.role === 'employee').length;

  return (
    <div className="daily-entry-container">
      {/* Header Bar */}
      <div className="entry-header-card">
        <div className="entry-header-title">
          <h2>User Management Module</h2>
          <p>Control all user profiles, names, email credentials, passwords & assign system roles</p>
        </div>

        {/* Add User Button */}
        <button type="button" className="btn-primary" onClick={openAddModal}>
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="firebase-notice" style={{ background: '#dcfce7', borderColor: '#86efac', color: '#166534', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} />
          <span style={{ fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="entry-summary-cards">
        <div className="summary-card">
          <div className="summary-icon bg-blue-100 text-blue-600">
            <Users size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{totalUsers}</span>
            <span className="summary-label">Total System Users</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-indigo-100 text-indigo-600">
            <ShieldCheck size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{adminCount}</span>
            <span className="summary-label">Admins</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-emerald-100 text-emerald-600">
            <UserIcon size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{employeeCount}</span>
            <span className="summary-label">Employees</span>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel-card">
        <div className="filter-title">
          <Filter size={16} className="text-blue-600" />
          <span>Filter Users:</span>
        </div>

        <div className="filter-controls-grid">
          {/* Quick Search */}
          <div className="filter-item">
            <label>Quick Search</label>
            <div className="search-box width-full">
              <Search size={15} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search Name, Email, or Role..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input pl-8"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="filter-item">
            <label>System Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
              <option value="ALL">All Roles</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== 'ALL') && (
            <div className="filter-item flex-end">
              <button type="button" className="btn-reset-filter" onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); }}>
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card">
        <div className="card-header-bar">
          <h3>Registered Users List</h3>
          <span className="count-pill">{filteredUsers.length} of {totalUsers} Users Shown</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spin text-blue-600" />
            <p>Loading users list...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="text-slate-300" />
            <h3>No Users Found</h3>
            <p>No user accounts match your search or filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>S.NO</th>
                  <th>USER NAME</th>
                  <th>EMAIL ADDRESS</th>
                  <th>SYSTEM ROLE</th>
                  <th>PASSWORD</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const isCurrent = currentUser?.uid === u.uid;
                  return (
                    <tr key={u.uid || idx}>
                      <td className="text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            backgroundColor: u.role === 'admin' ? '#4f46e5' : '#2563eb', 
                            color: '#ffffff', 
                            fontWeight: 700, 
                            fontSize: 13, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800" style={{ display: 'block' }}>
                              {u.name} {isCurrent && <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginLeft: 4 }}>(You)</span>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-700 font-medium">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} className="text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '9999px', 
                          fontSize: '12px', 
                          fontWeight: 700,
                          backgroundColor: u.role === 'admin' ? '#e0e7ff' : '#e0f2fe',
                          color: u.role === 'admin' ? '#4338ca' : '#0369a1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {u.role === 'admin' ? <ShieldCheck size={13} /> : <UserIcon size={13} />}
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td className="text-slate-700 font-mono text-sm">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            {visiblePasswords[u.uid] === false ? '••••••••' : (u.password || '123456')}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => togglePasswordVisibility(u.uid)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#64748b', 
                              cursor: 'pointer', 
                              padding: '2px 4px',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title={visiblePasswords[u.uid] === false ? "Show Password" : "Hide Password"}
                          >
                            {visiblePasswords[u.uid] === false ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                          {/* Edit Details */}
                          <button 
                            type="button" 
                            className="action-btn edit" 
                            title="Edit User Details (Name, Email, Role)"
                            onClick={() => openEditModal(u)}
                          >
                            <Edit size={15} />
                          </button>

                          {/* Change Password */}
                          <button 
                            type="button" 
                            className="action-btn"
                            style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}
                            title="Change Password"
                            onClick={() => openPasswordModal(u)}
                          >
                            <Key size={15} />
                          </button>

                          {/* Delete User */}
                          <button 
                            type="button" 
                            className="action-btn delete" 
                            title="Delete User Account"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent}
                            style={{ opacity: isCurrent ? 0.4 : 1 }}
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

      {/* Modal 1: Add or Edit User */}
      {isAddEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{selectedUser ? 'Edit User Details' : 'Add New User'}</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="modal-alert error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="modal-form">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  placeholder="Enter full name..." 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Email Address *
                </label>
                <input 
                  type="email" 
                  placeholder="name@lory.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  System Role *
                </label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="filter-select"
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {!selectedUser && (
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Initial Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Minimum 6 characters" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="filter-input"
                      style={{ width: '100%', paddingRight: '40px' }}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsAddEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  <span>{selectedUser ? 'Update User' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Change Password */}
      {isPasswordModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Change Password for {selectedUser.name}</h3>
              <button type="button" className="close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="modal-alert error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="modal-form">
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Set a new password for account <strong>{selectedUser.email}</strong>.
              </p>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="Enter new password (min 6 chars)..." 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="filter-input"
                    style={{ width: '100%', paddingRight: '40px' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Confirm New Password *
                </label>
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  placeholder="Re-enter new password..." 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="filter-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="spin" /> : <Key size={16} />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
