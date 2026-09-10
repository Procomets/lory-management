import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser } = useAuth();

  const displayName = currentUser?.name || 'User';
  const rawRole = currentUser?.role || 'employee';
  const displayRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar-right">
        {/* User Name and Role Element */}
        <div className="user-profile-badge">
          <div className="user-text-details">
            <span className="user-name-text">{displayName}</span>
            <span className="user-role-text">{displayRole}</span>
          </div>
          <div className="user-avatar-circle">
            <span>{initial}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
