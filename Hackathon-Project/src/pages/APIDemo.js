/**
 * API Demo Page
 * Trang demo tất cả các tính năng API integration
 */
import React, { useState } from 'react';
import AIAlertDemo from '../components/AIAlertDemo';
import PersonalizedAlertDemo from '../components/PersonalizedAlertDemo';
import FirebaseSensorsMonitor from '../components/FirebaseSensorsMonitor';
import './APIDemo.css';

const APIDemo = () => {
  const [activeTab, setActiveTab] = useState('ai-alert');

  const tabs = [
    { id: 'ai-alert', label: '🤖 AI Alert', icon: '🤖' },
    { id: 'personalized', label: '🎯 Personalized Alert', icon: '🎯' },
    { id: 'sensors', label: '🌊 Firebase Sensors', icon: '🌊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'ai-alert':
        return <AIAlertDemo />;
      case 'personalized':
        return <PersonalizedAlertDemo />;
      case 'sensors':
        return <FirebaseSensorsMonitor />;
      default:
        return null;
    }
  };

  return (
    <div className="api-demo-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>🚀 Backend API Integration Demo</h1>
        <p>Demo tất cả các tính năng AI và API đã tích hợp</p>
      </div>

      {/* API Status */}
      <div className="api-status">
        <div className="status-item">
          <span className="status-dot"></span>
          Backend API: <strong>http://localhost:3001</strong>
        </div>
        <div className="status-item">
          <span className="status-dot success"></span>
          Frontend: <strong>http://localhost:3000</strong>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="content-area">{renderContent()}</div>

      {/* Info Footer */}
      <div className="info-footer">
        <div className="info-card">
          <h3>📚 API Documentation</h3>
          <p>Xem file <code>Backend/docs/PERSONALIZED_ALERT_API.md</code></p>
        </div>
        <div className="info-card">
          <h3>🧪 Postman Collection</h3>
          <p>Import <code>Backend/Flood_Alert_API_Complete.postman_collection.json</code></p>
        </div>
        <div className="info-card">
          <h3>🔧 Quick Start</h3>
          <p>Đọc <code>Backend/QUICK_START_PERSONALIZED_ALERTS.md</code></p>
        </div>
      </div>
    </div>
  );
};

export default APIDemo;

