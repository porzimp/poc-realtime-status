// src/components/UserList.tsx
import React, { useEffect, useState } from 'react';
import { subscribeToUsers } from '../services/firebase';

interface UserStatus {
  isOnline: boolean;
  lastSeen: number;
}

interface User {
  id: string;
  status: UserStatus;
}

interface UserListProps {
  currentUserId: string;
}

const UserList: React.FC<UserListProps> = ({ currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((usersData) => {
      const usersList = Object.keys(usersData).map(userId => ({
        id: userId,
        status: usersData[userId]
      }));
      
      // Sort by online status first, then by ID
      usersList.sort((a, b) => {
        // Current user always at the top
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        
        // Then sort by online status
        if (a.status.isOnline !== b.status.isOnline) {
          return a.status.isOnline ? -1 : 1;
        }
        
        // If both have same online status, sort by last seen (for offline users)
        if (!a.status.isOnline && !b.status.isOnline) {
          return b.status.lastSeen - a.status.lastSeen;
        }
        
        // Fallback to sorting by ID
        return a.id.localeCompare(b.id);
      });
      
      setUsers(usersList);
    });
    
    return () => unsubscribe();
  }, [currentUserId]);

  const formatLastSeen = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} วินาทีที่แล้ว`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  };

  return (
    <div className="users-list">
      <h2>ผู้ใช้ทั้งหมด ({users.length})</h2>
      {users.length > 0 ? (
        users.map(user => (
          <div key={user.id} className={`user-item ${user.id === currentUserId ? 'current-user-item' : ''}`}>
            <div className="user-info">
              <span className="user-id">{user.id}</span>
              {user.status.isOnline ? (
                <>
                  <span className="status-indicator online"></span>
                  <span className="status-text">ออนไลน์</span>
                </>
              ) : (
                <>
                  <span className="status-indicator offline"></span>
                  <span className="status-text">
                    ออฟไลน์ - {formatLastSeen(user.status.lastSeen)}
                  </span>
                </>
              )}
              {user.id === currentUserId && (
                <span className="current-label">(คุณ)</span>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="no-users">ไม่มีผู้ใช้ออนไลน์</p>
      )}
    </div>
  );
};

export default UserList;