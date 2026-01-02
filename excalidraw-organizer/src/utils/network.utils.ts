/**
 * Network status utilities for detecting online/offline state
 */

type NetworkStatusCallback = (isOnline: boolean) => void;

class NetworkStatusManager {
  private listeners: Set<NetworkStatusCallback> = new Set();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    this.notifyListeners(true);
    console.log('Network: Online');
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    this.notifyListeners(false);
    console.log('Network: Offline');
  };

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((callback) => callback(isOnline));
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  public cleanup(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

export const networkStatus = new NetworkStatusManager();

/**
 * React hook for network status
 */
export const useNetworkStatus = (): boolean => {
  const [isOnline, setIsOnline] = React.useState(networkStatus.getStatus());

  React.useEffect(() => {
    const unsubscribe = networkStatus.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
};

// For non-React usage
import React from 'react';
