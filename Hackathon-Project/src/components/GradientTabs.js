/**
 * GradientTabs Component
 * Beautiful gradient animated tabs navigation
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./GradientTabs.css";

const GradientTabs = ({ tabs, className, onChange, activeTabId }) => {
  const [activeTab, setActiveTab] = useState(activeTabId || tabs[0]?.id);

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    if (onChange) onChange(tab);
  };

  return (
    <div className={`gradient-tabs-container ${className || ""}`}>
      <div className="gradient-tabs-wrapper">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`gradient-tab-button ${isActive ? "active" : ""}`}
            >
              {isActive && (
                <motion.div
                  layoutId="gradientTabBackground"
                  className="gradient-tab-background"
                  style={{ background: tab.gradient }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}

              <div className="gradient-tab-content">
                <Icon className="tab-icon" />
                <span className="tab-title">{tab.title}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GradientTabs;
