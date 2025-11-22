/**
 * Label Component
 * Simple label component for forms
 */

import React from "react";
import "./label.css";

export const Label = ({ htmlFor, children, className = "" }) => {
  return (
    <label htmlFor={htmlFor} className={`label ${className}`}>
      {children}
    </label>
  );
};

export default Label;

