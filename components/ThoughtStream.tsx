import React, { useEffect, useRef } from 'react';
import { AIAction } from '../types';

interface ThoughtStreamProps {
  actions: AIAction[];
  isThinking: boolean;
  className?: string;
}

const ActionIcon: React.FC<{ type: AIAction['type'] }> = ({ type }) => {
  const iconClasses = "w-4 h-4";
  
  switch (type) {
    case 'observation':
      return (
        <svg className={`${iconClasses} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case 'reasoning':
      return (
        <svg className={`${iconClasses} text-purple-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'action':
      return (
        <svg className={`${iconClasses} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'safety_check':
      return (
        <svg className={`${iconClasses} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${iconClasses} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const ActionContent: React.FC<{ action: AIAction }> = ({ action }) => {
  const formatAction = (action: AIAction) => {
    switch (action.type) {
      case 'action':
        try {
          const args = JSON.stringify(action.args, null, 2);
          return (
            <div className="bg-surface-200 rounded p-2 font-mono text-xs">
              <code className="text-primary-400">{action.content}</code>
              {args && args !== '{}' && (
                <pre className="text-text-muted mt-1 whitespace-pre-wrap">{args}</pre>
              )}
            </div>
          );
        } catch {
          return <code className="text-primary-400">{action.content}</code>;
        }
      case 'safety_check':
        return (
          <div className="bg-amber-900/20 border border-amber-600/30 rounded p-2">
            <p className="text-amber-400 text-sm">{action.content}</p>
            {action.args && (
              <div className="mt-1 text-xs text-amber-300 font-mono">
                {JSON.stringify(action.args, null, 2)}
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-text-main">{action.content}</p>;
    }
  };

  return formatAction(action);
};

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({
  actions,
  isThinking,
  className = ''
}) => {
  const streamRef = useRef<HTMLDivElement>(null);
  const lastActionRef = useRef<string>('');

  // Auto-scroll to bottom when new actions arrive
  useEffect(() => {
    if (streamRef.current && actions.length > 0) {
      const latestAction = actions[actions.length - 1];
      if (lastActionRef.current !== latestAction.id) {
        streamRef.current.scrollTop = streamRef.current.scrollHeight;
        lastActionRef.current = latestAction.id;
      }
    }
  }, [actions]);

  // Group actions by timestamp for better readability
  const groupedActions = actions.reduce((groups, action) => {
    const timeKey = new Date(action.timestamp).toLocaleTimeString();
    if (!groups[timeKey]) {
      groups[timeKey] = [];
    }
    groups[timeKey].push(action);
    return groups;
  }, {} as Record<string, AIAction[]>);

  return (
    <div className={`bg-surface-100 border border-surface-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-200">
        <h3 className="text-sm font-medium text-text-main uppercase tracking-wider">
          Agent Thought Stream
        </h3>
        <div className="flex items-center space-x-2">
          {isThinking && (
            <div className="flex items-center space-x-2 text-xs text-primary-400">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <span>Thinking...</span>
            </div>
          )}
          <span className="text-xs text-text-muted">
            {actions.length} actions
          </span>
        </div>
      </div>

      {/* Stream Content */}
      <div 
        ref={streamRef}
        className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-surface-300"
      >
        {Object.keys(groupedActions).length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm">No agent activity yet</p>
              <p className="text-xs mt-1">The thought stream will appear here when the agent starts working</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedActions).map(([time, timeActions]) => (
            <div key={time} className="space-y-2">
              {/* Timestamp */}
              <div className="text-xs text-text-muted font-mono">
                {time}
              </div>
              
              {/* Actions at this time */}
              {timeActions.map((action) => (
                <div
                  key={action.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    action.type === 'action' ? 'bg-surface-050' : 'bg-transparent'
                  } ${
                    timeActions[timeActions.length - 1] === action ? 'ring-1 ring-primary-500/20' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <ActionIcon type={action.type} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <ActionContent action={action} />
                  </div>
                  
                  {/* Live indicator for most recent action */}
                  {timeActions[timeActions.length - 1] === action && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-surface-200 bg-surface-050">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Real-time agent execution</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};