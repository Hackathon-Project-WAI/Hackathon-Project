/**
 * Switch Component
 * Toggle switch button
 */

import React from 'react';
import './switch.css';

export const Switch = ({ id, checked, onCheckedChange, disabled = false }) => {
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };

  return (
    <label className={`switch-root ${disabled ? 'disabled' : ''}`} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="switch-input"
      />
      <span className="switch-thumb"></span>
    </label>
  );
};

export default Switch;





