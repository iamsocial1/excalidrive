import React, { useState, useEffect } from 'react';
import { networkStatus } from '../utils/network.utils';
import './OfflineIndicator.css';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(networkStatus.getStatus());
  const [showIndicator, setShowIndicator] = useState(!networkStatus.getStatus());

  useEffect(() => {
    const unsubscribe = networkStatus.subscribe((online) => {
      setIsOnline(online);
      
      if (!online) {
        // Show immediately when going offline
        setShowIndicator(true);
      } else {
        // Hide after a delay when coming back online
        setTimeout(() => {
          setShowIndicator(false);
        }, 3000);
      }
    });

    return unsubscribe;
  }, []);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="offline-indicator-content">
        {isOnline ? (
          <>
            <span className="offline-indicator-icon">✓</span>
            <span className="offline-indicator-text">Back online</span>
          </>
        ) : (
          <>
            <span className="offline-indicator-icon">⚠</span>
            <span className="offline-indicator-text">No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
};
