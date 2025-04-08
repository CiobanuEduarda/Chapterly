import React from 'react';
import { useNetwork } from '../lib/networkContext';
import { useSync } from '../lib/syncService';

export function NetworkStatus() {
  const { status, checkConnection } = useNetwork();
  const { pendingOperations, isSyncing, syncNow } = useSync();

  // Status icons and colors
  const statusConfig = {
    'online': {
      icon: '🟢',
      text: 'Online',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700'
    },
    'offline': {
      icon: '🔴',
      text: 'Offline',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700'
    },
    'server-down': {
      icon: '🟠',
      text: 'Server Down',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700'
    }
  };

  const { icon, text, bgColor, textColor } = statusConfig[status];

  return (
    <div className={`rounded-md py-1 px-3 ${bgColor} ${textColor} flex items-center justify-between mb-2 text-sm w-full sticky top-0 z-10 shadow-sm`}>
      <div className="flex items-center">
        <span className="mr-1">{icon}</span>
        <span className="font-medium">{text}</span>
        
        {pendingOperations > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/30">
            {pendingOperations} pending
          </span>
        )}
        
        {isSyncing && (
          <span className="ml-2 text-xs animate-pulse">Syncing...</span>
        )}
      </div>
      
      <div className="flex gap-1">
        {pendingOperations > 0 && status === 'online' && (
          <button 
            onClick={() => syncNow()}
            disabled={isSyncing}
            className="text-xs px-1.5 py-0.5 bg-white/50 rounded hover:bg-white/80 disabled:opacity-50"
          >
            Sync
          </button>
        )}
        
        <button 
          onClick={() => checkConnection()}
          className="text-xs px-1.5 py-0.5 bg-white/50 rounded hover:bg-white/80"
        >
          Check
        </button>
      </div>
    </div>
  );
}