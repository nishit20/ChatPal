import React from 'react';
import { motion } from 'framer-motion';

const OnlineIndicator = ({ isOnline = false }) => {
  return (
    <motion.div
      animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className={`w-3 h-3 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      }`}
    />
  );
};

export default OnlineIndicator;
