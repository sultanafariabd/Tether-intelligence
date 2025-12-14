// Agent Types
export interface AgentSession {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'acting' | 'error' | 'stopped';
  createdAt: Date;
  lastActivity: Date;
  geminiConfig?: GeminiConfig;
  vncConfig?: VNCConfig;
}

export interface GeminiConfig {
  apiKey: string;
  modelId: string;
  systemInstructions: string;
  safetySettings?: SafetySettings;
}

export interface VNCConfig {
  host: string;
  port: number;
  password?: string;
  quality: number;
  compression: number;
}

// AI Action Types
export interface AIAction {
  id: string;
  type: 'observation' | 'reasoning' | 'action' | 'safety_check' | 'error';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ComputerAction {
  name: string;
  args: Record<string, any>;
  safetyDecision?: SafetyDecision;
}

export interface SafetyDecision {
  explanation: string;
  decision: 'allowed' | 'require_confirmation' | 'blocked';
}

// Task Management
export interface AgentTask {
  id: string;
  sessionId: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
  actions: AIAction[];
  result?: any;
  error?: string;
}

// UI State
export interface UISession {
  currentSession: AgentSession | null;
  isVNCConnected: boolean;
  vncConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  agentThinking: boolean;
  safetyModal: SafetyModal | null;
  taskQueue: AgentTask[];
  actionStream: AIAction[];
}

export interface SafetyModal {
  action: ComputerAction;
  screenshot?: string;
  reasoning: string;
  timeout: number;
  onApprove: () => void;
  onDeny: () => void;
}

// VNC Client Types
export interface VNCScreen {
  width: number;
  height: number;
  depth: number;
  data: Uint8Array;
}

export interface VNCMouseEvent {
  x: number;
  y: number;
  buttonMask: number;
}

export interface VNCKeyboardEvent {
  keysym: number;
  pressed: boolean;
}

// WebSocket Types
export interface WSMessage {
  type: 'agent_action' | 'vnc_event' | 'task_update' | 'safety_request' | 'system';
  data: any;
  timestamp: Date;
}