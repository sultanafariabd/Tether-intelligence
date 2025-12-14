import { useState, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiConfig, ComputerAction, AIAction, SafetyDecision } from '../types';

interface UseGeminiReturn {
  isThinking: boolean;
  lastResponse: any;
  sendRequest: (prompt: string, screenshot?: string) => Promise<ComputerAction[]>;
  sendFunctionResponse: (actionName: string, response: any, screenshot?: string) => Promise<ComputerAction[]>;
}

export const useGemini = (config: GeminiConfig): UseGeminiReturn => {
  const [isThinking, setIsThinking] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const genAI = useRef<GoogleGenerativeAI | null>(null);

  // Initialize Gemini AI
  const initializeGemini = useCallback(() => {
    if (!genAI.current) {
      genAI.current = new GoogleGenerativeAI(config.apiKey);
    }
    return genAI.current;
  }, [config.apiKey]);

  // Convert coordinate from normalized (0-999) to actual pixel
  const denormalizeCoordinates = useCallback((x: number, y: number, screenWidth: number, screenHeight: number) => {
    return {
      x: Math.round((x / 1000) * screenWidth),
      y: Math.round((y / 1000) * screenHeight)
    };
  }, []);

  // Parse function call from Gemini response
  const parseFunctionCall = useCallback((functionCall: any): ComputerAction => {
    return {
      name: functionCall.name,
      args: functionCall.args || {},
      safetyDecision: functionCall.safety_decision ? {
        explanation: functionCall.safety_decision.explanation,
        decision: functionCall.safety_decision.decision
      } : undefined
    };
  }, []);

  // Create Computer Use tool configuration
  const getComputerUseTool = useCallback(() => {
    const tools = {
      computer_use: {
        environment: 'browser',
        // Define supported actions
        excluded_predefined_functions: [],
        // Custom functions for additional actions
        function_declarations: [
          {
            name: 'open_web_browser',
            description: 'Opens the web browser',
            parameters: {}
          },
          {
            name: 'wait_5_seconds', 
            description: 'Pauses execution for 5 seconds',
            parameters: {}
          },
          {
            name: 'go_back',
            description: 'Navigates to the previous page',
            parameters: {}
          },
          {
            name: 'go_forward',
            description: 'Navigates to the next page',
            parameters: {}
          },
          {
            name: 'search',
            description: 'Navigates to the default search engine homepage',
            parameters: {}
          },
          {
            name: 'navigate',
            description: 'Navigates the browser directly to the specified URL',
            parameters: {
              url: { type: 'string' }
            }
          },
          {
            name: 'click_at',
            description: 'Clicks at a specific coordinate on the webpage',
            parameters: {
              x: { type: 'number' },
              y: { type: 'number' }
            }
          },
          {
            name: 'hover_at',
            description: 'Hovers the mouse at a specific coordinate',
            parameters: {
              x: { type: 'number' },
              y: { type: 'number' }
            }
          },
          {
            name: 'type_text_at',
            description: 'Types text at a specific coordinate',
            parameters: {
              x: { type: 'number' },
              y: { type: 'number' },
              text: { type: 'string' },
              press_enter: { type: 'boolean', default: true },
              clear_before_typing: { type: 'boolean', default: true }
            }
          },
          {
            name: 'key_combination',
            description: 'Press keyboard keys or combinations',
            parameters: {
              keys: { type: 'string' }
            }
          },
          {
            name: 'scroll_document',
            description: 'Scrolls the entire webpage',
            parameters: {
              direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] }
            }
          },
          {
            name: 'scroll_at',
            description: 'Scrolls a specific element at coordinate',
            parameters: {
              x: { type: 'number' },
              y: { type: 'number' },
              direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] },
              magnitude: { type: 'number', default: 800 }
            }
          },
          {
            name: 'drag_and_drop',
            description: 'Drags an element from one coordinate to another',
            parameters: {
              x: { type: 'number' },
              y: { type: 'number' },
              destination_x: { type: 'number' },
              destination_y: { type: 'number' }
            }
          }
        ]
      }
    };

    return tools;
  }, []);

  const sendRequest = useCallback(async (prompt: string, screenshot?: string): Promise<ComputerAction[]> => {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    setIsThinking(true);
    try {
      const genAI = initializeGemini();
      const model = genAI.getGenerativeModel({ 
        model: config.modelId,
        tools: getComputerUseTool(),
        systemInstruction: config.systemInstructions
      });

      const parts: any[] = [
        {
          text: prompt
        }
      ];

      // Add screenshot if provided
      if (screenshot) {
        // Convert base64 to binary data
        const base64Data = screenshot.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: bytes
          }
        });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      
      setLastResponse(response);
      
      // Extract function calls from response
      const functionCalls = response.functionCalls || [];
      const actions: ComputerAction[] = functionCalls.map(parseFunctionCall);
      
      return actions;
    } catch (error) {
      console.error('Error sending request to Gemini:', error);
      throw error;
    } finally {
      setIsThinking(false);
    }
  }, [config, initializeGemini, getComputerUseTool, parseFunctionCall]);

  const sendFunctionResponse = useCallback(async (
    actionName: string, 
    response: any, 
    screenshot?: string
  ): Promise<ComputerAction[]> => {
    // This would be used to respond to function calls with their execution results
    // and continue the conversation loop
    setIsThinking(true);
    try {
      const genAI = initializeGemini();
      const model = genAI.getGenerativeModel({ 
        model: config.modelId,
        tools: getComputerUseTool(),
        systemInstruction: config.systemInstructions
      });

      const parts: any[] = [
        {
          functionResponse: {
            name: actionName,
            response: response
          }
        }
      ];

      if (screenshot) {
        const base64Data = screenshot.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: bytes
          }
        });
      }

      const result = await model.generateContent(parts);
      const response_1 = await result.response;
      
      setLastResponse(response_1);
      
      const functionCalls = response_1.functionCalls || [];
      const actions: ComputerAction[] = functionCalls.map(parseFunctionCall);
      
      return actions;
    } catch (error) {
      console.error('Error sending function response to Gemini:', error);
      throw error;
    } finally {
      setIsThinking(false);
    }
  }, [config, initializeGemini, getComputerUseTool, parseFunctionCall]);

  return {
    isThinking,
    lastResponse,
    sendRequest,
    sendFunctionResponse
  };
};