/**
 * Register Page
 * Trang đăng ký
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import './Login.css'; // Dùng chung CSS với Login

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    console.log('📝 Attempting register with:', formData.email, formData.displayName);
    const result = await authService.register(
      formData.email,
      formData.password,
      formData.displayName
    );
    console.log('📊 Register result:', result);
    
    if (result.success) {
      console.log('✅ Register successful, redirecting...');
      navigate('/'); // Redirect về trang chủ
    } else {
      console.error('❌ Register failed:', result.error);
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
        <div className="login-container register-container">
        <div className="page-top-nav">
          <Link to="/" className="back-to-home">
            <span className="back-arrow">←</span>
            Trang chủ
          </Link>
          <Link to="/login" className="switch-page-link">
            Đăng nhập
          </Link>
        </div>
        
        <div className="login-header">
          <h1>🌦️ Hệ thống Cảnh báo Ngập</h1>
          <h2>Đăng ký tài khoản</h2>
          <p className="header-subtitle">Tạo tài khoản mới để bắt đầu sử dụng</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="displayName">Tên hiển thị</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              required
              disabled={loading}
            />
          </div>

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
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength="6"
            />
          </div>

          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            <span>{loading ? '⏳ Đang đăng ký...' : '✨ Đăng ký'}</span>
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
          Đăng ký bằng Google
        </button>
        </div>
      </div>

      <div className="login-page-right">
        <div className="showcase-content">
          <div className="showcase-icon">✨</div>
          <h1 className="showcase-title">Bắt đầu bảo vệ bản thân</h1>
          <p className="showcase-description">
            Tạo tài khoản miễn phí để truy cập đầy đủ tính năng cảnh báo ngập lụt
          </p>
          
          <div className="showcase-features">
            <div className="feature-item">
              <div className="feature-icon">🔔</div>
              <div className="feature-text">
                <div className="feature-title">Thông báo cá nhân hóa</div>
                <p className="feature-desc">Cảnh báo cho địa điểm bạn quan tâm</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div className="feature-text">
                <div className="feature-title">Đa nền tảng</div>
                <p className="feature-desc">Truy cập mọi lúc mọi nơi trên mọi thiết bị</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <div className="feature-title">An toàn & Bảo mật</div>
                <p className="feature-desc">Dữ liệu của bạn được mã hóa và bảo vệ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

