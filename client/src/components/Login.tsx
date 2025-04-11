// src/components/Login.tsx
import React, { useState, FormEvent } from 'react';

interface LoginProps {
  onLogin: (userId: string) => void;
  onRandomId: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRandomId }) => {
  const [userId, setUserId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate user ID
    if (!userId.trim()) {
      setError('กรุณาระบุรหัสผู้ใช้');
      return;
    }
    
    // Check if user ID is valid (only alphanumeric and underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      setError('รหัสผู้ใช้ต้องประกอบด้วยตัวอักษร ตัวเลข หรือ _ เท่านั้น');
      return;
    }
    
    // Login with the specified user ID
    onLogin(userId);
  };

  return (
    <div className="login-container">
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId">รหัสผู้ใช้:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ระบุรหัสผู้ใช้ของคุณ"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="button-group">
          <button type="submit" className="login-button">เข้าสู่ระบบ</button>
          <button 
            type="button" 
            className="random-button"
            onClick={onRandomId}
          >
            ใช้รหัสสุ่ม
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;