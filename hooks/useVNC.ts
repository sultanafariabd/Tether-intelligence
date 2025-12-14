import { useEffect, useRef, useState, useCallback } from 'react';
import { VNCConfig, VNCScreen, VNCMouseEvent, VNCKeyboardEvent } from '../types';

declare global {
  interface Window {
    RFB?: any;
  }
}

interface UseVNCReturn {
  screen: VNCScreen | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  connect: (config: VNCConfig) => void;
  disconnect: () => void;
  sendMouseEvent: (event: VNCMouseEvent) => void;
  sendKeyboardEvent: (event: VNCKeyboardEvent) => void;
  takeScreenshot: () => string | null;
}

export const useVNC = (): UseVNCReturn => {
  const rfbRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<VNCScreen | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  // Load noVNC dynamically
  const loadNovnc = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.RFB) {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/vnc/novnc/core/rfb.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load noVNC'));
        document.head.appendChild(script);
      });
    }
  }, []);

  const connect = useCallback(async (config: VNCConfig) => {
    if (!canvasRef.current) return;

    try {
      setConnectionStatus('connecting');
      await loadNovnc();

      if (!window.RFB) {
        throw new Error('noVNC not loaded');
      }

      // Create RFB instance
      rfbRef.current = new window.RFB(canvasRef.current, `ws://${config.host}:${config.port}`, {
        // VNC connection parameters
        password: config.password,
        qualityLevel: config.quality,
        compressionLevel: config.compression,
        
        // Event handlers
        onConnect: () => {
          setConnectionStatus('connected');
          console.log('VNC connected successfully');
        },
        onDisconnect: () => {
          setConnectionStatus('disconnected');
          rfbRef.current = null;
        },
        onError: (err: any) => {
          setConnectionStatus('error');
          console.error('VNC connection error:', err);
        },
        onUpdateState: (rfb: any, oldstate: string, newstate: string) => {
          console.log('VNC state change:', oldstate, '->', newstate);
        }
      });

    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to connect VNC:', error);
    }
  }, [loadNovnc]);

  const disconnect = useCallback(() => {
    if (rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, []);

  const sendMouseEvent = useCallback((event: VNCMouseEvent) => {
    if (rfbRef.current) {
      rfbRef.current.sendMouse(event.x, event.y, event.buttonMask);
    }
  }, []);

  const sendKeyboardEvent = useCallback((event: VNCKeyboardEvent) => {
    if (rfbRef.current) {
      rfbRef.current.sendKey(event.keysym, event.pressed);
    }
  }, []);

  const takeScreenshot = useCallback((): string | null => {
    if (!canvasRef.current) return null;
    
    try {
      return canvasRef.current.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    screen,
    connectionStatus,
    connect,
    disconnect,
    sendMouseEvent,
    sendKeyboardEvent,
    takeScreenshot
  };
};