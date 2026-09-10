import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FileEdit, 
  Receipt, 
  Database,
  UserCheck,
  Building2,
  Users,
  LogOut,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { id: 'entry-module', label: 'Entry Module', icon: FileEdit },
    { id: 'billing-module', label: 'Billing Module', icon: Receipt },
    { id: 'mastery-module', label: 'Vehicle Mastery', icon: Database },
    { id: 'driver-mastery', label: 'Driver Master', icon: UserCheck },
    { id: 'freight-party-mastery', label: 'Freight Party Master', icon: Building2 },
    ...(currentUser?.role === 'admin' ? [{ id: 'user-module', label: 'User Module', icon: Users }] : []),
  ];

  const userName = currentUser?.name || 'User';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <Layers className="text-blue-600" size={24} />
        </div>
        <div className="brand-title">
          <h2>Lory Management</h2>
        </div>
      </div>

      {/* Navigation List */}
      <div className="sidebar-scrollable">
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="nav-icon" size={20} />
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer Area */}
      <div className="sidebar-footer">
        <div className="user-profile-summary">
          <span className="user-summary-name">{userName}</span>
        </div>

        <button type="button" className="logout-btn" onClick={logout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>

        <div className="copyright-text">
          <p>Copyrights © 2026 by Procomets Solutions · v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};
