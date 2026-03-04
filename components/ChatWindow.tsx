"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, sendChatMessage, extractSQL, LLMConfig, LLMModel, getModels, checkLLMHealth, setLLMConfig } from "@/lib/llm";

interface ChatWindowProps {
  onOpenSettings: () => void;
  onClose: () => void;
}

export function ChatWindow({ onOpenSettings, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl: 'http://localhost:1234',
    model: '',
    systemPrompt: ''
  });
  const [health, setHealth] = useState<{ status: string; models?: LLMModel[] }>({ status: 'checking' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfig();
    checkHealth();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await setLLMConfig({});
      if (cfg && cfg.model) {
        setConfig(cfg);
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  };

  const checkHealth = async () => {
    const result = await checkLLMHealth();
    setHealth(result);
    if (result.models) {
      const models = await getModels();
      setHealth({ ...result, models });
      if (models.length > 0 && !config.model) {
        setConfig(prev => ({ ...prev, model: models[0].name }));
        await setLLMConfig({ model: models[0].name });
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !config.model) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      let fullResponse = '';
      
      const responseText = await sendChatMessage(
        userMessage,
        messages,
        config.model,
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: fullResponse }];
            }
            return [...prev, { role: 'assistant', content: fullResponse }];
          });
        }
      );

      if (!fullResponse && responseText) {
        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with Settings */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Model: <span className="text-foreground font-medium">{config.model || 'None'}</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            health.status === 'connected' 
              ? 'bg-emerald-500/10 text-emerald-600' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            {health.status === 'connected' ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Close Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => {
              checkHealth();
              onOpenSettings();
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="9" y1="10" x2="15" y2="10" />
                <line x1="12" y1="7" x2="12" y2="13" />
              </svg>
              <h3 className="text-lg font-medium mb-2">AI Chat</h3>
              <p className="text-sm mb-4">Ask me about your database in plain English. I'll help you write SQL queries, analyze data, and explore your schema.</p>
              {!config.model && health.status !== 'connected' && (
                <p className="text-xs text-destructive">Configure AI settings to start chatting</p>
              )}
              {health.status === 'connected' && !config.model && (
                <p className="text-xs text-destructive">Please select a model in settings</p>
              )}
              <div className="mt-4 space-y-2 text-left bg-muted/30 p-4 rounded-lg">
                <p className="text-xs font-medium">Try asking:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• "Show me all users"</li>
                  <li>• "How many orders do we have?"</li>
                  <li>• "What's the most expensive product?"</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="space-y-3">
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  {extractSQL(msg.content) && (
                    <div className="flex gap-2 pt-2 border-t border-border/30">
                      <button
                        onClick={() => copyToClipboard(extractSQL(msg.content)!)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy SQL
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={config.model ? "Type your message..." : "Select a model first"}
            disabled={isLoading || !config.model}
            className="flex-1 px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !config.model}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
