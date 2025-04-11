// src/App.tsx
import React from 'react';
import Login from './components/Login';
import UserList from './components/UserList';
import useUserStatus from './hooks/useUserStatus';


function App() {
  const { userId, isLoggedIn, login, logout } = useUserStatus();
  
  const handleLogin = (customUserId: string) => {
    login(customUserId);
  };
  
  const handleRandomLogin = () => {
    login(); // No parameter will generate a random ID
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="App">
      <header>
        <h1>สถานะผู้ใช้ออนไลน์</h1>
        
        {isLoggedIn ? (
          <div className="current-user">
            <div className="user-status">
              <span className="user-id">รหัสของคุณ: {userId}</span>
              <span className="status-indicator online"></span>
              <span className="status-text">ออนไลน์</span>
            </div>
            <button 
              className="logout-button" 
              onClick={handleLogout}
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <Login 
            onLogin={handleLogin} 
            onRandomId={handleRandomLogin} 
          />
        )}
      </header>
      
      <UserList currentUserId={userId} />
    </div>
  );
}

export default App;