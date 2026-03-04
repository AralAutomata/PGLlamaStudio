"use client";

import { useState, useEffect } from "react";
import { LLMConfig, LLMModel, getModels, setLLMConfig, checkLLMHealth } from "@/lib/llm";

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onConfigChange: (config: LLMConfig) => void;
  health: { status: string; models?: LLMModel[] };
}

export function ChatSettings({ isOpen, onClose, config, onConfigChange, health }: ChatSettingsProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setLLMConfig(localConfig);
      onConfigChange(localConfig);
      onClose();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await checkLLMHealth();
      alert(result.status === 'connected' ? 'Connected!' : `Error: ${result.error}`);
    } catch (error) {
      alert('Connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">AI Chat Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${
          health.status === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            health.status === 'connected' ? 'bg-emerald-500' : 'bg-destructive'
          }`} />
          <span className="text-sm font-medium">
            {health.status === 'connected' ? `Connected to ${health.models?.length || 0} models` : 'Not connected'}
          </span>
        </div>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLocalConfig({ ...localConfig, provider: 'ollama' })}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  localConfig.provider === 'ollama' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                Ollama
              </button>
              <button
                onClick={() => setLocalConfig({ ...localConfig, provider: 'lmstudio' })}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  localConfig.provider === 'lmstudio' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                LM Studio
              </button>
            </div>
          </div>

          {/* URL Configuration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {localConfig.provider === 'ollama' ? 'Ollama URL' : 'LM Studio URL'}
            </label>
            <input
              type="text"
              value={localConfig.provider === 'ollama' ? localConfig.ollamaUrl : localConfig.lmstudioUrl}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                [localConfig.provider === 'ollama' ? 'ollamaUrl' : 'lmstudioUrl']: e.target.value
              })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={localConfig.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234'}
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <select
              value={localConfig.model}
              onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a model...</option>
              {health.models?.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">System Prompt</label>
            <textarea
              value={localConfig.systemPrompt}
              onChange={(e) => setLocalConfig({ ...localConfig, systemPrompt: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring h-24 resize-none"
              placeholder="Custom instructions for the AI..."
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}