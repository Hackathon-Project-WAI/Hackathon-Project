/**
 * ExpandedTabs Navigation Component
 * Beautiful animated tabs with framer-motion
 */

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./ExpandedTabs.css";

// Icons
const MapIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const WeatherIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LoginIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);

const LogoutIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const spanVariants = {
  initial: {
    width: 0,
    opacity: 0,
  },
  animate: {
    width: "auto",
    opacity: 1,
    transition: {
      delay: 0.05,
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: {
      duration: 0.1,
      ease: "easeIn",
    },
  },
};

function ExpandedTabs({ tabs, className, onChange, selectedIndex = 0 }) {
  const [selected, setSelected] = useState(selectedIndex);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelected(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Don't deselect on outside click for navigation
        // setSelected(null);
        // if (onChange) onChange(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onChange]);

  const handleSelect = (index, tab) => {
    setSelected(index);
    if (onChange) onChange(index, tab);
  };

  const SeparatorComponent = () => (
    <div className="expanded-tabs-separator" aria-hidden="true" />
  );

  return (
    <div ref={containerRef} className={`expanded-tabs-container ${className || ""}`}>
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <SeparatorComponent key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = selected === index;

        return (
          <button
            key={tab.title}
            onClick={() => handleSelect(index, tab)}
            className={`expanded-tab-button ${isSelected ? "selected" : ""}`}
            disabled={tab.disabled}
          >
            {isSelected && (
              <motion.div
                layoutId="pill"
                className="expanded-tab-pill"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 40,
                }}
              />
            )}

            <span className="expanded-tab-content">
              <Icon className="expanded-tab-icon" />
              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.span
                    variants={spanVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="expanded-tab-text"
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default ExpandedTabs;
export { MapIcon, WeatherIcon, UserIcon, LoginIcon, LogoutIcon };





