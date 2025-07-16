import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TabSystem = ({ activeTab, setActiveTab, csvData }) => {
  const tabs = [
    { id: 'plotting', label: 'Data Plotting', icon: '📊' },
    { id: 'simulation', label: '3D Simulation', icon: '✈️' }
  ];

  return (
    <div className="bg-gray-900 border-b border-gray-700">
      <div className="flex space-x-1 p-1">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                layoutId="activeTab"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TabSystem;
