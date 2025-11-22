/**
 * AI Alert Demo Component
 * Component để demo tính năng AI-generated flood alerts
 */
import React, { useState } from 'react';
import { useAIAlert } from '../hooks/useAIAlert';
import './AIAlertDemo.css';

const AIAlertDemo = () => {
  const { loading, error, alert, generateAlert, reset } = useAIAlert();
  
  const [formData, setFormData] = useState({
    current_percent: 85,
    previous_percent: 50,
    location: 'Cống Phan Đình Phùng',
    to: '', // Optional email
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const alertData = {
      current_percent: parseFloat(formData.current_percent),
      previous_percent: parseFloat(formData.previous_percent),
      location: formData.location,
      timestamp: new Date().toISOString(),
    };

    if (formData.to) {
      alertData.to = formData.to;
    }

    try {
      await generateAlert(alertData);
    } catch (err) {
      console.error('Failed to generate alert:', err);
    }
  };

  const handleReset = () => {
    reset();
    setFormData({
      current_percent: 85,
      previous_percent: 50,
      location: 'Cống Phan Đình Phùng',
      to: '',
    });
  };

  return (
    <div className="ai-alert-demo">
      <div className="demo-header">
        <h2>🤖 AI Flood Alert Generator</h2>
        <p>Tạo cảnh báo ngập lụt tự động bằng Gemini AI</p>
      </div>

      <form onSubmit={handleSubmit} className="alert-form">
        <div className="form-group">
          <label>Mức ngập hiện tại (%):</label>
          <input
            type="number"
            name="current_percent"
            value={formData.current_percent}
            onChange={handleInputChange}
            min="0"
            max="100"
            required
          />
        </div>

        <div className="form-group">
          <label>Mức ngập trước đó (%):</label>
          <input
            type="number"
            name="previous_percent"
            value={formData.previous_percent}
            onChange={handleInputChange}
            min="0"
            max="100"
            required
          />
        </div>

        <div className="form-group">
          <label>Vị trí trạm:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email (tùy chọn):</label>
          <input
            type="email"
            name="to"
            value={formData.to}
            onChange={handleInputChange}
            placeholder="Để trống nếu không muốn gửi email"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '⏳ Đang tạo...' : '🚀 Tạo Cảnh Báo'}
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="alert-error">
          <strong>❌ Lỗi:</strong> {error}
        </div>
      )}

      {alert && (
        <div className="alert-result">
          <h3>✅ Cảnh báo đã được tạo thành công!</h3>
          
          <div className="alert-subject">
            <strong>Tiêu đề:</strong>
            <p>{alert.subject}</p>
          </div>

          <div className="alert-body">
            <strong>Nội dung:</strong>
            <div dangerouslySetInnerHTML={{ __html: alert.htmlBody }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAlertDemo;

