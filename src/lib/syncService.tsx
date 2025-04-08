"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { useNetwork } from './networkContext';
import { useToast } from './toastContext';
import { offlineStorage } from './offlineStorage';

interface SyncContextType {
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncAttempt: Date | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { status, isServerReachable } = useNetwork();
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);

  // Update pending operations count
  const updatePendingCount = useCallback(() => {
    setPendingOperations(offlineStorage.getOperationCount());
  }, []);

  // Sync function
  const syncNow = useCallback(async () => {
    if (!isServerReachable || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setLastSyncAttempt(new Date());
      
      const result = await api.syncOfflineOperations();
      updatePendingCount();
      
      if (result.synced > 0) {
        showToast(`Synced ${result.synced} operations`, 'success');
      }
      
      if (result.failed > 0) {
        showToast(`Failed to sync ${result.failed} operations`, 'error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      showToast('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isServerReachable, isSyncing, showToast, updatePendingCount]);

  // Check for pending operations on mount and when network status changes
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isServerReachable && pendingOperations > 0) {
      syncNow();
    }
  }, [isServerReachable, pendingOperations, syncNow]);

  // Set up periodic sync attempts if there are pending operations
  useEffect(() => {
    if (!pendingOperations) return;
    
    const intervalId = setInterval(() => {
      if (isServerReachable) {
        syncNow();
      }
    }, 60000); // Try every minute
    
    return () => clearInterval(intervalId);
  }, [isServerReachable, pendingOperations, syncNow]);

  const value = {
    isSyncing,
    pendingOperations,
    lastSyncAttempt,
    syncNow
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}