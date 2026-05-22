import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          CRM System
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/clients" className="nav-link">
            Clients
          </Link>
          <Link to="/leads" className="nav-link">
            Leads
          </Link>
          <Link to="/tasks" className="nav-link">
            Tasks
          </Link>
          <Link to="/client-finder" className="nav-link">
            Client Finder
          </Link>
          <Link to="/ai-chat" className="nav-link">
            AI Chat
          </Link>

          <div className="nav-user">
            <span className="user-name">{user?.name}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
