/**
 * Login Page
 * Trang đăng nhập
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error khi user nhập
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Attempting login with:', formData.email);
    const result = await authService.login(formData.email, formData.password);
    console.log('📊 Login result:', result);
    
    if (result.success) {
      console.log('✅ Login successful, redirecting...');
      navigate('/'); // Redirect về trang chủ
    } else {
      console.error('❌ Login failed:', result.error);
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    const result = await authService.loginWithGoogle();
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-page-left">
        <div className="login-container">
        <div className="page-top-nav">
          <Link to="/" className="back-to-home">
            <span className="back-arrow">←</span>
            Trang chủ
          </Link>
          <Link to="/register" className="switch-page-link">
            Đăng ký
          </Link>
        </div>
        
        <div className="login-header">
          <h1>🌦️ Hệ thống Cảnh báo Ngập</h1>
          <h2>Đăng nhập</h2>
          <p className="header-subtitle">Truy cập vào hệ thống để sử dụng đầy đủ tính năng</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            <span>{loading ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập'}</span>
          </button>
        </form>

        <div className="divider">
          <span>hoặc</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="btn-google"
          disabled={loading}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google"
          />
          Đăng nhập bằng Google
        </button>
        </div>
      </div>

      <div className="login-page-right">
        <div className="showcase-content">
          <div className="showcase-icon">🌦️</div>
          <h1 className="showcase-title">Hệ thống Cảnh báo Ngập Lụt</h1>
          <p className="showcase-description">
            Giám sát thời tiết thực tế và cảnh báo ngập lụt chính xác cho khu vực của bạn
          </p>
          
          <div className="showcase-features">
            <div className="feature-item">
              <div className="feature-icon">🗺️</div>
              <div className="feature-text">
                <div className="feature-title">Bản đồ tương tác</div>
                <p className="feature-desc">Xem các điểm ngập lụt trực quan trên bản đồ</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">⚠️</div>
              <div className="feature-text">
                <div className="feature-title">Cảnh báo thời gian thực</div>
                <p className="feature-desc">Nhận thông báo ngay khi có nguy cơ ngập</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <div className="feature-title">Dự báo thông minh</div>
                <p className="feature-desc">Phân tích dữ liệu mưa và dự đoán ngập lụt</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

