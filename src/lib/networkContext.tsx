"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

type ConnectionStatus = 'online' | 'offline' | 'server-down';

interface NetworkContextType {
    status: ConnectionStatus;
    isOnline: boolean;
    isServerReachable: boolean;
    lastChecked: Date | null;
    checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const PING_INTERVAL = 10000; // 10 seconds
const SERVER_TIMEOUT = 5000; // 5 seconds

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkServerAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT);
      
      await fetch(`${api.baseUrl}/books`, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.warn('Server availability check failed:', error);
      return false;
    }
  }, []);

  // Check both network and server status
  const checkConnection = useCallback(async () => {
    setLastChecked(new Date());
    
    // First check if browser is online
    const isNetworkOnline = navigator.onLine;
    
    if (!isNetworkOnline) {
      setStatus('offline');
      return;
    }
    
    // Then check server availability
    const isServerAvailable = await checkServerAvailability();
    
    if (!isServerAvailable) {
      setStatus('server-down');
    } else {
      setStatus('online');
    }
  }, [checkServerAvailability]);

  // Set up event listeners for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      // When coming back online, check if server is also available
      checkConnection();
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    // Check connection on mount
    checkConnection();
    
    // Set up periodic checking
    const intervalId = setInterval(checkConnection, PING_INTERVAL);
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  const value = {
    status,
    isOnline: status !== 'offline',
    isServerReachable: status === 'online',
    lastChecked,
    checkConnection
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
