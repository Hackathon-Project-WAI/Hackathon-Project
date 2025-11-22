/**
 * Sensors Page - Trang hiển thị dữ liệu sensors từ Firebase
 */
import React from 'react';
import SensorsDashboard from '../components/SensorsDashboard';
import './SensorsPage.css';

const SensorsPage = () => {
  return (
    <div className="sensors-page">
      <SensorsDashboard />
    </div>
  );
};

export default SensorsPage;


