import React from 'react';
import './LogoutButton.css';
import { LogOut } from 'lucide-react';

const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    // TODO: Integrate with your real auth/logout flow
    // Placeholder action so button works without breaking
    try {
      localStorage.removeItem('authToken');
    } catch (e) {
      // ignore if not available
    }
    console.log('Logout clicked');
  };

  return (
    <div className="logout-button-container">
      <button type="button" className="logout-button" onClick={handleLogout} aria-label="Logout">
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default LogoutButton;
