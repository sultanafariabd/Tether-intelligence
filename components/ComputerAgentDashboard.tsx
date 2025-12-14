import React, { useState, useEffect, useCallback } from 'react';
import { VNCViewport } from './VNCViewport';
import { ThoughtStream } from './ThoughtStream';
import { SafetyModal } from './SafetyModal';
import { TaskPlanner } from './TaskPlanner';
import { useVNC } from '../hooks/useVNC';
import { useGemini } from '../hooks/useGemini';
import { 
  AgentSession, 
  VNCConfig, 
  GeminiConfig, 
  ComputerAction, 
  AIAction, 
  AgentTask,
  SafetyModal as SafetyModalType,
  UISession 
} from '../types';

export const ComputerAgentDashboard: React.FC = () => {
  // State
  const [uiSession, setUISession] = useState<UISession>({
    currentSession: null,
    isVNCConnected: false,
    vncConnectionStatus: 'disconnected',
    agentThinking: false,
    safetyModal: null,
    taskQueue: [],
    actionStream: []
  });

  const [vncConfig, setVNCConfig] = useState<VNCConfig>({
    host: 'localhost',
    port: 5900,
    quality: 6,
    compression: 2
  });

  const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>({
    apiKey: '',
    modelId: 'gemini-2.5-computer-use-preview-10-2025',
    systemInstructions: `You are an AI agent that controls computers like a human. You can interact with web browsers, applications, and system interfaces through mouse clicks, keyboard input, and navigation. Always explain your reasoning before taking actions. If you need to perform potentially risky operations, ask for confirmation. Focus on completing the user's task efficiently and safely.`
  });

  const [visionOverlay, setVisionOverlay] = useState(true);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);

  // Hooks
  const vnc = useVNC();
  const gemini = useGemini(geminiConfig);

  // Add action to stream
  const addActionToStream = useCallback((action: AIAction) => {
    setUISession(prev => ({
      ...prev,
      actionStream: [...prev.actionStream, action]
    }));
  }, []);

  // Handle task submission
  const handleTaskSubmit = useCallback(async (taskDescription: string, attachments?: File[]) => {
    if (!uiSession.currentSession) {
      addActionToStream({
        id: `error-${Date.now()}`,
        type: 'error',
        content: 'No active session. Please start a session first.',
        timestamp: new Date()
      });
      return;
    }

    const task: AgentTask = {
      id: `task-${Date.now()}`,
      sessionId: uiSession.currentSession.id,
      description: taskDescription,
      status: 'in_progress',
      priority: 'medium',
      createdAt: new Date(),
      actions: []
    };

    // Add task to queue
    setUISession(prev => ({
      ...prev,
      taskQueue: [...prev.taskQueue, task]
    }));

    // Start task processing
    addActionToStream({
      id: `obs-${Date.now()}`,
      type: 'observation',
      content: `Received task: "${taskDescription}"`,
      timestamp: new Date()
    });

    try {
      // Get current screenshot if available
      const screenshot = currentScreenshot || vnc.takeScreenshot();
      if (screenshot) {
        setCurrentScreenshot(screenshot);
      }

      // Send request to Gemini
      const actions = await gemini.sendRequest(taskDescription, screenshot || undefined);
      
      // Process actions
      for (const action of actions) {
        await processAction(action, screenshot || undefined);
      }

      // Mark task as completed
      setUISession(prev => ({
        ...prev,
        taskQueue: prev.taskQueue.map(t => 
          t.id === task.id ? { ...t, status: 'completed', completedAt: new Date() } : t
        )
      }));

    } catch (error) {
      console.error('Task processing error:', error);
      addActionToStream({
        id: `error-${Date.now()}`,
        type: 'error',
        content: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });

      // Mark task as failed
      setUISession(prev => ({
        ...prev,
        taskQueue: prev.taskQueue.map(t => 
          t.id === task.id ? { ...t, status: 'failed', error: String(error) } : t
        )
      }));
    }
  }, [uiSession.currentSession, currentScreenshot, vnc, gemini, addActionToStream]);

  // Process individual actions
  const processAction = useCallback(async (action: ComputerAction, screenshot?: string) => {
    // Add action to stream
    addActionToStream({
      id: `action-${Date.now()}`,
      type: action.safetyDecision?.decision === 'require_confirmation' ? 'safety_check' : 'action',
      content: `Executing: ${action.name}`,
      args: action.args,
      timestamp: new Date()
    });

    // Check if safety confirmation is required
    if (action.safetyDecision?.decision === 'require_confirmation') {
      const modal: SafetyModalType = {
        action,
        screenshot,
        reasoning: action.safetyDecision.explanation,
        timeout: 30,
        onApprove: () => {
          executeAction(action);
          setUISession(prev => ({ ...prev, safetyModal: null }));
        },
        onDeny: () => {
          addActionToStream({
            id: `denied-${Date.now()}`,
            type: 'error',
            content: `Action denied by user: ${action.name}`,
            timestamp: new Date()
          });
          setUISession(prev => ({ ...prev, safetyModal: null }));
        }
      };

      setUISession(prev => ({ ...prev, safetyModal: modal }));
      return;
    }

    // Execute action directly if no safety check needed
    await executeAction(action);
  }, [addActionToStream]);

  // Execute action on the computer
  const executeAction = useCallback(async (action: ComputerAction) => {
    try {
      // Add reasoning
      addActionToStream({
        id: `reasoning-${Date.now()}`,
        type: 'reasoning',
        content: getActionReasoning(action),
        timestamp: new Date()
      });

      // Execute the action based on type
      switch (action.name) {
        case 'click_at':
        case 'hover_at':
          const { x, y } = action.args;
          vnc.sendMouseEvent({ x, y, buttonMask: action.name === 'click_at' ? 1 : 0 });
          break;
          
        case 'type_text_at':
          const { x: textX, y: textY, text, press_enter = true } = action.args;
          vnc.sendMouseEvent({ x: textX, y: textY, buttonMask: 1 }); // Click to focus
          await new Promise(resolve => setTimeout(resolve, 100));
          vnc.sendKeyboardEvent({ keysym: 0, pressed: false }); // Clear
          // Send text (simplified - would need proper key mapping)
          break;
          
        case 'key_combination':
          const { keys } = action.args;
          // Handle special key combinations
          if (keys.toLowerCase() === 'enter') {
            vnc.sendKeyboardEvent({ keysym: 13, pressed: true });
            vnc.sendKeyboardEvent({ keysym: 13, pressed: false });
          }
          break;
          
        case 'navigate':
          // Would need to handle in browser context
          break;
          
        case 'scroll_at':
        case 'scroll_document':
          // Would need to implement scroll simulation
          break;
      }

      // Take screenshot after action
      setTimeout(() => {
        const newScreenshot = vnc.takeScreenshot();
        if (newScreenshot) {
          setCurrentScreenshot(newScreenshot);
        }
      }, 500);

    } catch (error) {
      addActionToStream({
        id: `error-${Date.now()}`,
        type: 'error',
        content: `Failed to execute ${action.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
    }
  }, [vnc, addActionToStream]);

  // Get reasoning for actions
  const getActionReasoning = (action: ComputerAction): string => {
    switch (action.name) {
      case 'click_at':
        return `I need to click at position (${action.args.x}, ${action.args.y}) to interact with the UI element`;
      case 'type_text_at':
        return `I need to type "${action.args.text}" into the input field at position (${action.args.x}, ${action.args.y})`;
      case 'navigate':
        return `I need to navigate to ${action.args.url} to continue the task`;
      case 'key_combination':
        return `I need to press ${action.args.keys} to perform the required action`;
      case 'scroll_at':
      case 'scroll_document':
        return `I need to scroll ${action.args.direction} to find the target element`;
      default:
        return `Executing ${action.name} action`;
    }
  };

  // Start session
  const startSession = useCallback(() => {
    const session: AgentSession = {
      id: `session-${Date.now()}`,
      name: `Session ${new Date().toLocaleString()}`,
      status: 'idle',
      createdAt: new Date(),
      lastActivity: new Date(),
      geminiConfig,
      vncConfig
    };

    setUISession(prev => ({
      ...prev,
      currentSession: session
    }));

    // Connect VNC
    vnc.connect(vncConfig);
  }, [vnc, vncConfig, geminiConfig]);

  // Stop session
  const stopSession = useCallback(() => {
    vnc.disconnect();
    setUISession(prev => ({
      ...prev,
      currentSession: null,
      isVNCConnected: false,
      actionStream: []
    }));
  }, [vnc]);

  // Handle screenshot capture
  const handleScreenshot = useCallback(() => {
    const screenshot = vnc.takeScreenshot();
    if (screenshot) {
      setCurrentScreenshot(screenshot);
      addActionToStream({
        id: `screenshot-${Date.now()}`,
        type: 'observation',
        content: 'Captured screenshot for analysis',
        timestamp: new Date()
      });
    }
    return screenshot;
  }, [vnc, addActionToStream]);

  // Emergency stop
  const emergencyStop = useCallback(() => {
    vnc.disconnect();
    setUISession(prev => ({
      ...prev,
      currentSession: prev.currentSession ? 
        { ...prev.currentSession, status: 'stopped' } : null,
      safetyModal: null
    }));
    addActionToStream({
      id: `emergency-${Date.now()}`,
      type: 'error',
      content: 'Emergency stop activated by user',
      timestamp: new Date()
    });
  }, [vnc, addActionToStream]);

  return (
    <div className="min-h-screen bg-surface-050 text-text-main">
      {/* Top Status Bar */}
      <div className="h-12 bg-surface-100 border-b border-surface-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">AI Agent Command Center</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              uiSession.isVNCConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-text-muted">
              VNC: {uiSession.vncConnectionStatus}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              uiSession.agentThinking ? 'bg-primary-500 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className="text-xs text-text-muted">
              Agent: {uiSession.agentThinking ? 'Thinking' : 'Idle'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {uiSession.currentSession ? (
            <>
              <span className="text-xs text-text-muted">
                {uiSession.currentSession.name}
              </span>
              <button
                onClick={emergencyStop}
                className="px-3 py-1 text-xs text-red-400 border border-red-400 rounded hover:bg-red-900/20 transition-colors"
              >
                Emergency Stop
              </button>
            </>
          ) : (
            <button
              onClick={startSession}
              className="px-3 py-1 text-xs text-white bg-primary-500 rounded hover:bg-primary-600 transition-colors"
            >
              Start Session
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Left Sidebar */}
        <div className="w-60 bg-surface-100 border-r border-surface-200 p-4 space-y-4">
          <div>
            <h3 className="text-xs font-medium text-text-main uppercase tracking-wider mb-2">
              Session Control
            </h3>
            {uiSession.currentSession ? (
              <div className="space-y-2">
                <div className="text-xs text-text-muted">
                  Status: {uiSession.currentSession.status}
                </div>
                <div className="text-xs text-text-muted">
                  Tasks: {uiSession.taskQueue.length}
                </div>
                <button
                  onClick={stopSession}
                  className="w-full px-3 py-1 text-xs text-red-400 border border-red-400 rounded hover:bg-red-900/20 transition-colors"
                >
                  Stop Session
                </button>
              </div>
            ) : (
              <div className="text-xs text-text-muted">
                No active session
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-medium text-text-main uppercase tracking-wider mb-2">
              Vision Overlay
            </h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visionOverlay}
                onChange={(e) => setVisionOverlay(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-surface-050 border-surface-200 rounded focus:ring-primary-500"
              />
              <span className="text-xs text-text-muted">Show AI targeting</span>
            </label>
          </div>
        </div>

        {/* Center Stage - VNC Viewport */}
        <div className="flex-1 p-4">
          <VNCViewport
            config={vncConfig}
            agentActions={uiSession.actionStream.filter(a => a.type === 'action' || a.type === 'safety_check')}
            visionOverlay={visionOverlay}
            onScreenshot={handleScreenshot}
            className="h-full"
          />
        </div>

        {/* Right Panel */}
        <div className="w-96 bg-surface-100 border-l border-surface-200 flex flex-col">
          {/* Thought Stream */}
          <div className="flex-1 p-4">
            <ThoughtStream
              actions={uiSession.actionStream}
              isThinking={uiSession.agentThinking}
              className="h-full"
            />
          </div>

          {/* Task Planner */}
          <div className="p-4 border-t border-surface-200">
            <TaskPlanner
              onSubmit={handleTaskSubmit}
              isLoading={uiSession.agentThinking}
            />
          </div>
        </div>
      </div>

      {/* Safety Modal */}
      {uiSession.safetyModal && (
        <SafetyModal
          action={uiSession.safetyModal.action}
          screenshot={uiSession.safetyModal.screenshot}
          reasoning={uiSession.safetyModal.reasoning}
          timeout={uiSession.safetyModal.timeout}
          onApprove={uiSession.safetyModal.onApprove}
          onDeny={uiSession.safetyModal.onDeny}
        />
      )}
    </div>
  );
};