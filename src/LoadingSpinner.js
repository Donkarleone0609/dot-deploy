// LoadingSpinner.js
import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#404040',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <motion.div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          border: '5px solid #4CAF50',
          borderTop: '5px solid transparent',
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      />
    </div>
  );
};

export default LoadingSpinner;
