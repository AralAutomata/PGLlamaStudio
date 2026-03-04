export interface LLMConfig {
  provider: 'ollama' | 'lmstudio';
  ollamaUrl: string;
  lmstudioUrl: string;
  model: string;
  systemPrompt: string;
}

export interface LLMModel {
  name: string;
  size?: number;
  modified?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMHealth {
  status: 'connected' | 'error' | 'checking';
  provider?: string;
  models?: LLMModel[];
  error?: string;
}

const API_BASE = 'http://localhost:3001';

export async function getLLMConfig(): Promise<LLMConfig> {
  const res = await fetch(`${API_BASE}/api/llm-config`);
  return res.json();
}

export async function setLLMConfig(config: Partial<LLMConfig>): Promise<LLMConfig> {
  const res = await fetch(`${API_BASE}/api/llm-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function checkLLMHealth(): Promise<LLMHealth> {
  try {
    const res = await fetch(`${API_BASE}/api/llm-health`);
    return res.json();
  } catch (error) {
    return { status: 'error', error: 'Cannot connect to server' };
  }
}

export async function getModels(): Promise<LLMModel[]> {
  const res = await fetch(`${API_BASE}/api/models`);
  const data = await res.json();
  return data.models || [];
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  model?: string,
  onChunk?: (content: string) => void
): Promise<string> {
  // Use non-streaming endpoint for now (more reliable)
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, model }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();
  
  if (data.message?.content) {
    const content = data.message.content;
    if (onChunk) {
      onChunk(content);
    }
    return content;
  }
  
  return data.message || '';
}

export async function getSchema(): Promise<{ schema: string; tables: { name: string; columns: string[] }[] }> {
  const res = await fetch(`${API_BASE}/api/schema`);
  return res.json();
}

export function extractSQL(text: string): string | null {
  // Match SQL code blocks
  const codeBlockMatch = text.match(/```sql\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Match plain SQL (simple heuristics)
  const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();
    for (const keyword of sqlKeywords) {
      if (trimmed.startsWith(keyword)) {
        return line.trim();
      }
    }
  }

  return null;
}