import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = ({ users = [] }) => {
  if (!users || users.length === 0) return null;

  const containerVariants = {
    start: { opacity: 0 },
    end: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const dotVariants = {
    start: { y: 0 },
    end: { y: -10 },
    transition: { duration: 0.4, repeat: Infinity, repeatType: 'reverse' },
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <motion.div
        variants={containerVariants}
        initial="start"
        animate="end"
        className="flex gap-1"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            variants={dotVariants}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
          />
        ))}
      </motion.div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {users.length === 1
          ? `${users[0]} is typing...`
          : `${users.join(', ')} are typing...`}
      </span>
    </div>
  );
};

export default TypingIndicator;
