import React, { useState, useRef } from 'react';

interface TaskPlannerProps {
  onSubmit: (task: string, attachments?: File[]) => void;
  isLoading?: boolean;
  className?: string;
}

export const TaskPlanner: React.FC<TaskPlannerProps> = ({
  onSubmit,
  isLoading = false,
  className = ''
}) => {
  const [task, setTask] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || isLoading) return;
    
    onSubmit(task.trim(), attachments);
    setTask('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTask(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length > 0) {
      e.preventDefault();
      const files: File[] = [];
      
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
      
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const getAttachmentIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const exampleTasks = [
    "Search for the latest AI news and summarize the top 3 articles",
    "Log in to my email and check for unread messages",
    "Navigate to GitHub and create a new repository called 'ai-projects'",
    "Open calculator and solve 15 * 23",
    "Go to YouTube and find trending technology videos"
  ];

  return (
    <div className={`bg-surface-100 border border-surface-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-surface-200">
        <h3 className="text-sm font-medium text-text-main uppercase tracking-wider">
          Task Planner
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Describe what you want the AI agent to do
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Task Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={task}
              onChange={handleTextareaChange}
              onPaste={handlePaste}
              placeholder="Describe the task (e.g., 'Log in to AWS and restart the server')..."
              className="w-full min-h-[80px] max-h-[200px] p-3 bg-surface-050 border border-surface-200 rounded-lg text-text-main placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
            
            {/* Character count */}
            <div className="absolute bottom-2 right-2 text-xs text-text-muted">
              {task.length}/2000
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-text-main">Attachments:</h4>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-surface-050 border border-surface-200 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      {getAttachmentIcon(file)}
                      <div className="text-xs">
                        <p className="text-text-main">{file.name}</p>
                        <p className="text-text-muted">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 text-text-muted hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload files"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (textarea) {
                    textarea.focus();
                    // Simulate Ctrl+V for clipboard paste
                    const pasteEvent = new ClipboardEvent('paste');
                    textarea.dispatchEvent(pasteEvent);
                  }
                }}
                disabled={isLoading}
                className="p-2 text-text-muted hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Paste from clipboard"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </div>

            <button
              type="submit"
              disabled={!task.trim() || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Task</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Example Tasks */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted">Example tasks:</h4>
          <div className="space-y-1">
            {exampleTasks.slice(0, 3).map((example, index) => (
              <button
                key={index}
                onClick={() => setTask(example)}
                disabled={isLoading}
                className="w-full text-left p-2 text-xs text-text-muted hover:text-primary-400 hover:bg-surface-050 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt,.pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};