import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { CallContext } from '../context/CallContext';

const CallButton = ({ user, callType = 'audio' }) => {
  const { startCall, activeCall, incomingCall } = useContext(CallContext);
  const [isLoading, setIsLoading] = useState(false);

  const isDisabled = activeCall || incomingCall || !user || isLoading;

  const handleStartCall = async () => {
    if (isDisabled) return;

    try {
      setIsLoading(true);
      await startCall(user._id || user.id, callType);
    } catch (error) {
      console.error(`Error starting ${callType} call:`, error);
      alert(`Failed to start ${callType} call`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.1 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={handleStartCall}
      disabled={isDisabled}
      className={`p-2 rounded-full transition ${
        isDisabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      title={`Start ${callType} call`}
    >
      {callType === 'video' ? '📹' : '☎️'}
      {isLoading && (
        <motion.div
          className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

export default CallButton;
