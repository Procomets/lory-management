import React, { useState } from 'react';
import { 
  LayoutGrid, 
  RotateCw, 
  ChevronDown, 
  ArrowLeft, 
  TrendingDown
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 Days');
  const [activeSubTab, setActiveSubTab] = useState('Executive Overview');
  const [selectedRange, setSelectedRange] = useState('1M');
  const [lastUpdated] = useState('11:14:51 am');

  const periods = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'This Month',
    'Prev Month',
    'This Quarter',
    'This Year',
    'Custom'
  ];

  const dropdownFilters = [
    { id: 'alloy', label: 'Alloy Type' },
    { id: 'furnace', label: 'Furnace' },
    { id: 'shift', label: 'Shift' },
    { id: 'supervisor', label: 'Supervisor' },
    { id: 'customer', label: 'Customer' },
    { id: 'qc', label: 'QC Status' },
  ];

  const subNavTabs = [
    'Executive Overview',
    'Production Analytics',
    'Inventory Analytics',
    'Financial Analytics',
    'Dispatch Analytics',
    'Quality & Efficiency'
  ];

  const ranges = ['1W', '1M', '3M', '6M', '1Y', 'All'];

  return (
    <div className="dashboard-content">
      {/* Top Title Bar */}
      <div className="dashboard-header">
        <div className="header-title-wrapper">
          <div className="header-icon-box">
            <LayoutGrid size={22} className="text-white" />
          </div>
          <div>
            <h1 className="dashboard-title">Executive Dashboard</h1>
            <p className="dashboard-subtitle">Real-time overview of all foundry operations</p>
          </div>
        </div>
      </div>

      {/* Filter Card Container */}
      <div className="filter-card">
        {/* Period Row */}
        <div className="period-row">
          <div className="period-pills-group">
            <span className="period-label">PERIOD</span>
            {periods.map((period) => (
              <button
                key={period}
                type="button"
                className={`period-chip ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>

          <div className="update-status">
            <span>Updated {lastUpdated}</span>
            <button type="button" className="refresh-icon-btn" title="Refresh Data">
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="dropdowns-row">
          {dropdownFilters.map((filter) => (
            <button key={filter.id} type="button" className="dropdown-chip">
              <span>{filter.label}</span>
              <ChevronDown size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="sub-nav-tabs">
        {subNavTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`sub-tab-btn ${activeSubTab === tab ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Production Performance Card */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-group">
            <button type="button" className="icon-back-btn">
              <ArrowLeft size={16} />
            </button>
            <h3 className="chart-title">Production Performance</h3>
          </div>

          <div className="range-selector">
            {ranges.map((range) => (
              <button
                key={range}
                type="button"
                className={`range-btn ${selectedRange === range ? 'active' : ''}`}
                onClick={() => setSelectedRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Display */}
        <div className="metric-headline">
          <span className="metric-number">62.4 T</span>
          <span className="trend-badge negative">
            <TrendingDown size={14} />
            -25.3%
          </span>
        </div>

        {/* Chart Visualization */}
        <div className="chart-container">
          <svg
            className="chart-svg"
            viewBox="0 0 900 280"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Line Ticks */}
            <line x1="40" y1="40" x2="880" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="100" x2="880" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="160" x2="880" y2="160" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="220" x2="880" y2="220" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

            {/* Y Axis Labels */}
            <text x="10" y="44" className="chart-tick-text">1.0K</text>
            <text x="10" y="104" className="chart-tick-text">i.0K</text>
            <text x="10" y="164" className="chart-tick-text">1.0K</text>
            <text x="10" y="224" className="chart-tick-text">!.0K</text>

            {/* Gradient Area Fill */}
            <path
              d="M 60 220 
                 Q 90 200, 110 130
                 T 160 100
                 T 210 220
                 T 280 220
                 T 350 200
                 T 420 145
                 T 490 140
                 T 560 220
                 T 630 110
                 T 700 220
                 T 770 200
                 T 840 220
                 L 840 240
                 L 60 240 Z"
              fill="url(#chartGradient)"
            />

            {/* Smooth Curve Line */}
            <path
              d="M 60 220 
                 Q 90 200, 110 130
                 T 160 100
                 T 210 220
                 T 280 220
                 T 350 200
                 T 420 145
                 T 490 140
                 T 560 220
                 T 630 110
                 T 700 220
                 T 770 200
                 T 840 220"
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
