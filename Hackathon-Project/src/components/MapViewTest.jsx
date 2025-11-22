/**
 * MapViewTest - Simple Test Component
 */
import React from 'react';

const MapViewTest = ({ places, apiKey, floodZones = [] }) => {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* MAP AREA */}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            🗺️ MAP AREA (Bên Trái)
          </h1>
          <p style={{ color: '#64748b', fontSize: '18px' }}>
            Đây là khu vực map. API Key: {apiKey ? '✅ Có' : '❌ Không'}
          </p>
          <p style={{ color: '#64748b', fontSize: '18px' }}>
            Places: {places.length} địa điểm
          </p>
          <p style={{ color: '#64748b', fontSize: '18px' }}>
            Flood Zones: {floodZones.length} vùng ngập
          </p>
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{ 
        width: '420px',
        height: '100vh',
        borderLeft: '1px solid #e2e8f0',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h1 style={{ 
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            🧭 Flood-Aware Navigation
          </h1>
          <p style={{ 
            fontSize: '14px',
            color: '#64748b',
            margin: '4px 0 0 0'
          }}>
            Smart routing with flood detection
          </p>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1,
          padding: '24px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <p style={{ 
              margin: 0,
              color: '#1e40af',
              fontSize: '14px'
            }}>
              ℹ️ This is TEST COMPONENT - Split-Screen Layout Works!
            </p>
          </div>

          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #d1fae5',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <p style={{ 
              margin: 0,
              color: '#059669',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ✅ Layout split-screen hoạt động!
            </p>
          </div>

          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <p style={{ 
              margin: 0,
              color: '#d97706',
              fontSize: '14px'
            }}>
              ⚠️ MapViewModern có thể có vấn đề với Hooks/Dependencies
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 'auto',
          borderTop: '1px solid #e2e8f0',
          padding: '24px'
        }}>
          <button style={{
            width: '100%',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            🚀 Start Navigation (Test)
          </button>
          <div style={{ 
            height: '1px',
            backgroundColor: '#e2e8f0',
            margin: '16px 0'
          }} />
          <p style={{ 
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
            margin: 0
          }}>
            Test Component - Layout Split-Screen
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapViewTest;

