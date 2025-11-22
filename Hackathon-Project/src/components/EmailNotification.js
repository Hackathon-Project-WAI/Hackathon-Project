import React, { useState } from 'react';
import { sendFloodAlert, sendWeatherUpdate, sendEmail } from '../services/emailService';
import './EmailNotification.css';

function EmailNotification() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Gửi cảnh báo lũ lụt
  const handleSendFloodAlert = async () => {
    if (!email) {
      setMessage('Vui lòng nhập email!');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const alertData = {
        district: 'Hải Châu',
        level: 'Cao',
        rainfall: '150',
        time: new Date().toLocaleString('vi-VN')
      };

      const result = await sendFloodAlert(email, alertData);
      
      if (result.success) {
        setMessage('✅ Đã gửi cảnh báo lũ lụt thành công!');
        setMessageType('success');
        setEmail('');
      } else {
        setMessage('❌ Gửi email thất bại!');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ Lỗi: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Gửi cập nhật thời tiết
  const handleSendWeatherUpdate = async () => {
    if (!email) {
      setMessage('Vui lòng nhập email!');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const weatherData = {
        location: 'Đà Nẵng',
        temperature: '28',
        humidity: '75',
        rainChance: '60',
        windSpeed: '15',
        date: new Date().toLocaleDateString('vi-VN'),
        description: 'Có mưa rào và dông vài nơi. Nhiệt độ từ 25-30°C.'
      };

      const result = await sendWeatherUpdate(email, weatherData);
      
      if (result.success) {
        setMessage('✅ Đã gửi thông tin thời tiết thành công!');
        setMessageType('success');
        setEmail('');
      } else {
        setMessage('❌ Gửi email thất bại!');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ Lỗi: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Gửi email tùy chỉnh
  const handleSendCustomEmail = async () => {
    if (!email) {
      setMessage('Vui lòng nhập email!');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const emailData = {
        to: email,
        subject: 'Thông báo từ Hệ thống Cảnh báo Thời tiết',
        html: `
          <h1>Chào bạn!</h1>
          <p>Đây là email thử nghiệm từ hệ thống cảnh báo thời tiết.</p>
          <p>Email được gửi lúc: ${new Date().toLocaleString('vi-VN')}</p>
        `,
        text: 'Đây là email thử nghiệm từ hệ thống cảnh báo thời tiết.'
      };

      const result = await sendEmail(emailData);
      
      if (result.success) {
        setMessage('✅ Đã gửi email thành công!');
        setMessageType('success');
        setEmail('');
      } else {
        setMessage('❌ Gửi email thất bại!');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ Lỗi: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-notification">
      <div className="email-notification-container">
        <h2>📧 Gửi Email Thông Báo</h2>
        
        <div className="email-input-group">
          <label htmlFor="email">Email nhận thông báo:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            disabled={loading}
          />
        </div>

        <div className="button-group">
          <button
            className="btn btn-danger"
            onClick={handleSendFloodAlert}
            disabled={loading}
          >
            {loading ? '⏳ Đang gửi...' : '🌊 Gửi Cảnh Báo Lũ Lụt'}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSendWeatherUpdate}
            disabled={loading}
          >
            {loading ? '⏳ Đang gửi...' : '🌤️ Gửi Thông Tin Thời Tiết'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleSendCustomEmail}
            disabled={loading}
          >
            {loading ? '⏳ Đang gửi...' : '✉️ Gửi Email Thử Nghiệm'}
          </button>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="info-box">
          <h3>ℹ️ Hướng dẫn:</h3>
          <ol>
            <li>Nhập email nhận thông báo</li>
            <li>Chọn loại email muốn gửi</li>
            <li>Kiểm tra hộp thư đến (hoặc spam)</li>
          </ol>
          <p className="note">
            <strong>Lưu ý:</strong> Backend phải đang chạy tại http://localhost:3001
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailNotification;
