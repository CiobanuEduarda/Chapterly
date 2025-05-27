import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Book } from './bookContext';

interface WebSocketMessage {
  type: string;
  data: Book[];
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
});

const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 30 seconds
const RETRY_BACKOFF_FACTOR = 1.5;

// WebSocket configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY);

  const connect = useCallback(() => {
    try {
      if (socket?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        setRetryDelay(INITIAL_RETRY_DELAY);
      };

      ws.onclose = (event) => {
        console.log('Disconnected from WebSocket:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);

        // Calculate next retry delay with exponential backoff
        const nextDelay = Math.min(retryDelay * RETRY_BACKOFF_FACTOR, MAX_RETRY_DELAY);
        setRetryDelay(nextDelay);

        // Schedule reconnection
        setTimeout(connect, nextDelay);
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setTimeout(connect, retryDelay);
    }
  }, [retryDelay, socket]);

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext); 