import React, { useRef, useEffect, useState } from 'react';
import { VNCConfig, ComputerAction, AIAction } from '../types';

interface VNCViewportProps {
  config: VNCConfig;
  agentActions: ComputerAction[];
  visionOverlay: boolean;
  onScreenshot: () => string | null;
  className?: string;
}

export const VNCViewport: React.FC<VNCViewportProps> = ({
  config,
  agentActions,
  visionOverlay,
  onScreenshot,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Vision overlay data
  const [visionBoxes, setVisionBoxes] = useState<Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence?: number;
  }>>([]);

  // Agent cursor position
  const [agentCursor, setAgentCursor] = useState<{ x: number; y: number } | null>(null);

  // Initialize VNC connection
  useEffect(() => {
    if (!canvasRef.current || !config) return;

    const connectVNC = async () => {
      try {
        // Dynamic import of noVNC
        const { default: RFB } = await import('novnc/core/rfb');
        
        const rfb = new RFB(canvasRef.current!, `ws://${config.host}:${config.port}`, {
          credentials: config.password ? { password: config.password } : undefined,
          connectTimeout: 10000,
          waitForDisconnect: false,
          onConnect: () => {
            setIsConnected(true);
            setConnectionError(null);
            console.log('VNC connected successfully');
          },
          onDisconnect: () => {
            setIsConnected(false);
            console.log('VNC disconnected');
          },
          onError: (err: any) => {
            setConnectionError(err.message || 'VNC connection error');
            setIsConnected(false);
            console.error('VNC error:', err);
          },
          onBell: () => {
            console.log('VNC bell');
          },
          onDesktopName: (name: string) => {
            console.log('Desktop name:', name);
          }
        });

        // Configure connection quality
        if (config.quality) {
          rfb.qualityLevel = config.quality;
        }
        if (config.compression) {
          rfb.compressionLevel = config.compression;
        }

        // Store RFB instance for cleanup
        (canvasRef.current as any).rfb = rfb;

      } catch (error) {
        setConnectionError('Failed to initialize VNC client');
        console.error('VNC initialization error:', error);
      }
    };

    connectVNC();

    return () => {
      if (canvasRef.current && (canvasRef.current as any).rfb) {
        (canvasRef.current as any).rfb.disconnect();
      }
    };
  }, [config]);

  // Update vision overlay when agent actions change
  useEffect(() => {
    if (!visionOverlay || agentActions.length === 0) {
      setVisionBoxes([]);
      setAgentCursor(null);
      return;
    }

    const latestAction = agentActions[agentActions.length - 1];
    if (latestAction.safetyDecision?.decision === 'blocked') {
      setVisionBoxes([]);
      return;
    }

    // Generate vision boxes based on action type
    switch (latestAction.name) {
      case 'click_at':
      case 'hover_at':
        const { x, y } = latestAction.args;
        if (typeof x === 'number' && typeof y === 'number') {
          setVisionBoxes([{
            x: x - 20,
            y: y - 20,
            width: 40,
            height: 40,
            label: 'Target',
            confidence: 0.9
          }]);
          setAgentCursor({ x, y });
        }
        break;
      case 'type_text_at':
        const { x: textX, y: textY } = latestAction.args;
        if (typeof textX === 'number' && typeof textY === 'number') {
          setVisionBoxes([{
            x: textX - 30,
            y: textY - 10,
            width: 60,
            height: 20,
            label: 'Input Field',
            confidence: 0.8
          }]);
        }
        break;
      case 'scroll_at':
      case 'scroll_document':
        // Show scroll direction indicator
        const direction = latestAction.args.direction;
        setVisionBoxes([{
          x: 0,
          y: direction === 'down' ? 800 : 0,
          width: 1000,
          height: 200,
          label: `Scroll ${direction}`,
          confidence: 0.7
        }]);
        break;
      default:
        setVisionBoxes([]);
        setAgentCursor(null);
    }
  }, [agentActions, visionOverlay]);

  // Auto-take screenshots periodically
  useEffect(() => {
    if (!isConnected || !onScreenshot) return;

    const interval = setInterval(() => {
      onScreenshot();
    }, 2000); // Take screenshot every 2 seconds

    return () => clearInterval(interval);
  }, [isConnected, onScreenshot]);

  return (
    <div className={`relative bg-surface-050 border border-surface-200 rounded-lg overflow-hidden ${className}`}>
      {/* VNC Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          aspectRatio: '16/10',
          imageRendering: 'pixelated'
        }}
      />

      {/* Connection Status */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-xs text-text-muted">
          {isConnected ? 'Connected' : connectionError || 'Disconnected'}
        </span>
      </div>

      {/* Agent Cursor */}
      {agentCursor && (
        <div 
          className="absolute pointer-events-none"
          style={{
            left: `${(agentCursor.x / 1000) * 100}%`,
            top: `${(agentCursor.y / 1000) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-4 h-4 border-2 border-primary-500 rounded-full animate-pulse">
            <div className="absolute inset-1 bg-primary-500 rounded-full opacity-50" />
          </div>
        </div>
      )}

      {/* Vision Overlay */}
      {visionOverlay && visionBoxes.map((box, index) => (
        <div
          key={index}
          className="absolute pointer-events-none"
          style={{
            left: `${(box.x / 1000) * 100}%`,
            top: `${(box.y / 1000) * 100}%`,
            width: `${(box.width / 1000) * 100}%`,
            height: `${(box.height / 1000) * 100}%`,
            border: '2px solid #EC4899',
            boxShadow: '0 0 8px rgba(236, 72, 153, 0.5)'
          }}
        >
          {/* Label */}
          <div className="absolute -top-6 left-0 bg-pink-500 text-white text-xs px-2 py-1 rounded">
            {box.label}
            {box.confidence && ` (${Math.round(box.confidence * 100)}%)`}
          </div>
        </div>
      ))}

      {/* Control Overlay */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button
          onClick={onScreenshot}
          disabled={!isConnected}
          className="px-3 py-1 bg-surface-100 border border-surface-200 rounded text-xs text-text-main hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Capture
        </button>
        <button
          onClick={() => {
            if (canvasRef.current && (canvasRef.current as any).rfb) {
              (canvasRef.current as any).rfb.disconnect();
              setTimeout(() => {
                const event = new Event('reconnect');
                window.dispatchEvent(event);
              }, 1000);
            }
          }}
          disabled={!isConnected}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reconnect
        </button>
      </div>

      {/* Scanning Effect */}
      {visionOverlay && isConnected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-30 animate-pulse" 
               style={{
                 animation: 'scan 2s linear infinite',
                 top: '50%'
               }} />
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};