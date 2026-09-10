import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { VehicleMastery } from './components/mastery/VehicleMastery';
import { DriverMastery } from './components/mastery/DriverMastery';
import { FreightPartyMastery } from './components/mastery/FreightPartyMastery';
import { DailyEntryModule } from './components/entry/DailyEntryModule';
import { BillingModule } from './components/billing/BillingModule';
import { UserManagementModule } from './components/user/UserManagementModule';

const MainAppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('entry-module');

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div className="auth-logo-badge spin" style={{ width: 40, height: 40, margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>Loading Lory ERP...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="app-layout">
      {/* Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Area */}
      <div className="main-wrapper">
        {/* Top Navbar Header */}
        <Navbar />

        {/* Dynamic View Router */}
        <main className="content-area">
          {activeTab === 'billing-module' ? (
            <BillingModule />
          ) : activeTab === 'mastery-module' ? (
            <VehicleMastery />
          ) : activeTab === 'driver-mastery' ? (
            <DriverMastery />
          ) : activeTab === 'freight-party-mastery' ? (
            <FreightPartyMastery />
          ) : activeTab === 'user-module' && currentUser.role === 'admin' ? (
            <UserManagementModule />
          ) : (
            <DailyEntryModule />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
