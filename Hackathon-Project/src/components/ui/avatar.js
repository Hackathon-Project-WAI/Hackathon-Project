/**
 * Avatar Component
 * Simple, reusable avatar component
 */

import React from 'react';
import './avatar.css';

export const Avatar = ({ children, className = '' }) => {
  return (
    <div className={`avatar ${className}`}>
      {children}
    </div>
  );
};

export const AvatarFallback = ({ children, className = '' }) => {
  return (
    <div className={`avatar-fallback ${className}`}>
      {children}
    </div>
  );
};


