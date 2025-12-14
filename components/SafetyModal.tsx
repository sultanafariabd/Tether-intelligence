import React, { useEffect, useState } from 'react';
import { ComputerAction } from '../types';

interface SafetyModalProps {
  action: ComputerAction;
  screenshot?: string;
  reasoning: string;
  timeout: number;
  onApprove: () => void;
  onDeny: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({
  action,
  screenshot,
  reasoning,
  timeout,
  onApprove,
  onDeny
}) => {
  const [timeLeft, setTimeLeft] = useState(timeout);
  const [showDetails, setShowDetails] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDeny(); // Auto-deny on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onDeny]);

  // Prevent backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Format action details
  const getActionDescription = () => {
    switch (action.name) {
      case 'click_at':
        return `Click at position (${action.args.x}, ${action.args.y})`;
      case 'type_text_at':
        return `Type text "${action.args.text}" at position (${action.args.x}, ${action.args.y})`;
      case 'navigate':
        return `Navigate to ${action.args.url}`;
      case 'key_combination':
        return `Press keys: ${action.args.keys}`;
      case 'scroll_at':
      case 'scroll_document':
        return `Scroll ${action.args.direction}`;
      case 'drag_and_drop':
        return `Drag from (${action.args.x}, ${action.args.y}) to (${action.args.destination_x}, ${action.args.destination_y})`;
      default:
        return `Execute: ${action.name}`;
    }
  };

  // Get risk level based on action type
  const getRiskLevel = () => {
    const highRiskActions = [
      'delete', 'remove', 'format', 'wipe', 'shutdown', 'restart',
      'payment', 'transfer', 'send', 'delete_file', 'delete_folder'
    ];
    
    const actionStr = `${action.name} ${JSON.stringify(action.args)}`.toLowerCase();
    const isHighRisk = highRiskActions.some(risk => actionStr.includes(risk));
    
    return isHighRisk ? 'high' : 'medium';
  };

  const riskLevel = getRiskLevel();
  const progressPercentage = (timeLeft / timeout) * 100;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-100 border border-surface-200 rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              riskLevel === 'high' ? 'bg-red-500' : 'bg-amber-500'
            } animate-pulse`} />
            <h2 className={`text-lg font-semibold ${
              riskLevel === 'high' ? 'text-red-400' : 'text-amber-400'
            }`}>
              Authorization Required
            </h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-text-main">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-text-muted">seconds remaining</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-surface-200">
          <div 
            className={`h-full transition-all duration-1000 ${
              riskLevel === 'high' ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Warning */}
          <div className={`p-4 rounded-lg border ${
            riskLevel === 'high' 
              ? 'bg-red-900/20 border-red-600/30' 
              : 'bg-amber-900/20 border-amber-600/30'
          }`}>
            <div className="flex items-start space-x-3">
              <svg className={`w-5 h-5 mt-0.5 ${
                riskLevel === 'high' ? 'text-red-400' : 'text-amber-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className={`font-medium ${
                  riskLevel === 'high' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {riskLevel === 'high' ? 'High Risk Operation' : 'Confirmation Required'}
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  {riskLevel === 'high' 
                    ? 'This action may have significant consequences. Please review carefully.'
                    : 'Please confirm this action before the agent proceeds.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-text-main mb-2">Agent Intends To:</h4>
              <div className="bg-surface-050 rounded-lg p-3 border border-surface-200">
                <p className="text-text-main">{getActionDescription()}</p>
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-medium text-text-main mb-2">Agent Reasoning:</h4>
              <div className="bg-surface-050 rounded-lg p-3 border border-surface-200">
                <p className="text-text-muted">{reasoning}</p>
              </div>
            </div>

            {/* Screenshot Preview */}
            {screenshot && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-text-main">Target Interface:</h4>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                <div className="bg-surface-050 rounded-lg p-3 border border-surface-200">
                  <img 
                    src={screenshot} 
                    alt="Target interface" 
                    className="w-full h-auto rounded border border-surface-300"
                  />
                  {showDetails && (
                    <div className="mt-3 text-xs text-text-muted">
                      <p>Timestamp: {new Date().toLocaleString()}</p>
                      <p>Action Coordinates: {JSON.stringify(action.args, null, 2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-text-muted hover:text-text-main transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </button>
              {showDetails && (
                <div className="mt-2 bg-surface-050 rounded-lg p-3 border border-surface-200">
                  <pre className="text-xs text-text-muted overflow-x-auto">
                    {JSON.stringify(action, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-surface-200 bg-surface-050">
          <div className="text-xs text-text-muted">
            Auto-deny in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onDeny}
              className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              Deny
            </button>
            <button
              onClick={onApprove}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                riskLevel === 'high'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Approve & Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};