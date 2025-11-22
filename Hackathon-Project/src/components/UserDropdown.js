/**
 * UserDropdown Component
 * Beautiful dropdown menu for logged-in users
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import "./UserDropdown.css";

// Icons
const User = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Settings = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6" />
    <path d="M1 12h6m6 0h6" />
  </svg>
);

const Map = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const Weather = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const LogOut = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const DropdownMenuItem = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="user-dropdown-item"
  >
    {children}
  </button>
);

const DropdownMenuSeparator = () => <div className="user-dropdown-separator" />;

const UserDropdown = ({ user, onLogout, compact = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="user-dropdown-container" ref={dropdownRef}>
      <button 
        onClick={handleTriggerClick} 
        className={`user-dropdown-trigger ${compact ? 'compact' : ''}`}
      >
        <Avatar className={compact ? 'compact' : ''}>
          <AvatarFallback>
            <UserRound size={20} className="opacity-60" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        {!compact && (
          <>
            <div className="user-info">
              <div className="user-name">
                {user.displayName || 'User'}
              </div>
              <div className="user-email">
                {user.email}
              </div>
            </div>
            <svg className={`chevron ${isOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          {/* Header */}
          <div className="user-dropdown-header">
            <Avatar className="large">
              <AvatarFallback>
                <UserRound size={24} className="opacity-60" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="user-name-large">
                {user.displayName || 'User'}
              </div>
              <div className="user-email-small">
                {user.email}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="user-dropdown-section">
            <DropdownMenuItem onClick={() => {
              navigate('/');
              setIsOpen(false);
            }}>
              <Map className="menu-icon" />
              Bản đồ
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              navigate('/weather-detail');
              setIsOpen(false);
            }}>
              <Weather className="menu-icon" />
              Thời tiết chi tiết
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          <div className="user-dropdown-section">
            <DropdownMenuItem onClick={() => {
              console.log('Profile');
              setIsOpen(false);
            }}>
              <User className="menu-icon" />
              Trang cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              console.log('Settings');
              setIsOpen(false);
            }}>
              <Settings className="menu-icon" />
              Cài đặt
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          <div className="user-dropdown-section">
            <DropdownMenuItem onClick={() => {
              onLogout();
              setIsOpen(false);
            }}>
              <LogOut className="menu-icon" />
              Đăng xuất
            </DropdownMenuItem>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;

