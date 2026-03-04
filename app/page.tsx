"use client";

import { useState, useEffect, useCallback } from "react";
import { Editor } from "@/components/Editor";
import { ResultsTable } from "@/components/ResultsTable";
import { SchemaBrowser } from "@/components/SchemaBrowser";
import { ChatWindow } from "@/components/ChatWindow";
import { ChatSettings } from "@/components/ChatSettings";
import { db, ConnectionConfig, QueryResult, TableInfo } from "@/lib/db";
import { LLMConfig, LLMModel } from "@/lib/llm";

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'chat'>('editor');
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl: 'http://localhost:1234',
    model: '',
    systemPrompt: ''
  });
  const [llmHealth, setLlmHealth] = useState<{ status: string; models?: LLMModel[] }>({ status: 'checking' });
  
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const checkLlmHealth = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/llm-health');
        const data = await res.json();
        setLlmHealth(data);
      } catch (err) {
        setLlmHealth({ status: 'error', models: [] });
      }
    };
    checkLlmHealth();
  }, []);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<ConnectionConfig>({
    host: "localhost",
    port: 5432,
    database: "pgstudio",
    user: "keycloak",
    password: "change_me_in_local_env",
  });
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  const loadSchema = useCallback(async () => {
    setIsLoadingSchema(true);
    try {
      const schema = await db.getSchema();
      setTables(schema);
    } catch (error) {
      console.error("Failed to load schema:", error);
    } finally {
      setIsLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadSchema();
    }
  }, [isConnected, loadSchema]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await db.connect(config);
      setIsConnected(true);
      setShowConnectionForm(false);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    db.disconnect();
    setIsConnected(false);
    setShowConnectionForm(true);
    setQueryResult(null);
    setQueryError(null);
    setTables([]);
  };

  const handleExecuteQuery = async (sql: string) => {
    setIsQuerying(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const result = await db.query(sql);
      setQueryResult(result);
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : "Query failed");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleTableClick = (tableName: string) => {
    handleExecuteQuery(`SELECT * FROM ${tableName} LIMIT 100`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <h1 className="text-lg font-semibold tracking-tight">PG Studio</h1>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Connected
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {darkMode ? "Light" : "Dark"}
          </button>
          
          {isConnected && (
            <>
              <button
                onClick={loadSchema}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                Refresh
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Disconnect
              </button>
            </>
          )}
        </div>
      </header>

      {/* Connection Form Modal */}
      {showConnectionForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Connect to PostgreSQL</h2>
                <p className="text-sm text-muted-foreground">Enter your database credentials</p>
              </div>
            </div>

            {connectionError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{connectionError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Host</label>
                  <input
                    type="text"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Port</label>
                  <input
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5432 })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="5432"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Database</label>
                <input
                  type="text"
                  value={config.database}
                  onChange={(e) => setConfig({ ...config, database: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="postgres"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={config.user}
                  onChange={(e) => setConfig({ ...config, user: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="postgres"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setConfig({
                    host: "localhost",
                    port: 5432,
                    database: "postgres",
                    user: "postgres",
                    password: "",
                  });
                  setConnectionError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isConnecting && (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isConnected && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Schema Sidebar */}
          {sidebarOpen && (
            <aside className="w-64 border-r border-border bg-card flex-shrink-0">
              <SchemaBrowser
                tables={tables}
                isLoading={isLoadingSchema}
                onTableClick={handleTableClick}
              />
            </aside>
          )}

          {/* Main Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'editor' ? (
              <>
                {editorOpen && (
                  <div className="h-1/2 border-b border-border p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="4 17 10 11 4 5" />
                        <line x1="12" y1="19" x2="20" y2="19" />
                      </svg>
                      <span className="text-sm font-medium text-muted-foreground">Query Editor</span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <Editor
                        onExecute={handleExecuteQuery}
                        initialValue="-- Write your SQL query here\nSELECT * FROM "
                        disabled={isQuerying}
                      />
                    </div>
                  </div>
                )}

                {/* Results Panel */}
                <div className={editorOpen ? "h-1/2 p-4 overflow-hidden" : "h-full p-4 overflow-hidden"}>
                  <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span className="text-sm font-medium text-muted-foreground">Results</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ResultsTable
                        result={queryResult}
                        error={queryError || undefined}
                        isLoading={isQuerying}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChatWindow onOpenSettings={() => setChatSettingsOpen(true)} onClose={() => setActiveTab('editor')} />
              </div>
            )}
          </main>

          {/* Chat Settings Modal */}
          <ChatSettings
            isOpen={chatSettingsOpen}
            onClose={() => setChatSettingsOpen(false)}
            config={llmConfig}
            onConfigChange={setLlmConfig}
            health={llmHealth}
          />

          {/* Floating Menu Button */}
          <div className="absolute bottom-4 left-4 z-20">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 bg-card border border-border rounded-full hover:bg-muted transition-colors shadow-md flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Popup Menu */}
            {menuOpen && (
              <div className="absolute bottom-12 left-0 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => { setSidebarOpen(!sidebarOpen); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                    {sidebarOpen ? 'Hide Schema' : 'Show Schema'}
                  </button>

                  <button
                    onClick={() => { setEditorOpen(!editorOpen); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                    {editorOpen ? 'Hide Editor' : 'Show Editor'}
                  </button>
                  
                  <button
                    onClick={() => { setDarkMode(!darkMode); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    {darkMode ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="5"/>
                          <line x1="12" y1="1" x2="12" y2="3"/>
                          <line x1="12" y1="21" x2="12" y2="23"/>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                          <line x1="1" y1="12" x2="3" y2="12"/>
                          <line x1="21" y1="12" x2="23" y2="12"/>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                        Light Mode
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                        Dark Mode
                      </>
                    )}
                  </button>

                  <div className="border-t border-border my-1" />

                  <button
                    onClick={() => { handleExecuteQuery('SELECT * FROM users LIMIT 10'); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Browse Users
                  </button>

                  <button
                    onClick={() => { handleExecuteQuery('SELECT * FROM products LIMIT 10'); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M3 6h18" />
                    </svg>
                    Browse Products
                  </button>

                  <button
                    onClick={() => { handleExecuteQuery('SELECT * FROM orders LIMIT 10'); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Browse Orders
                  </button>

                  <div className="border-t border-border my-1" />

                  <button
                    onClick={() => { loadSchema(); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 21h5v-5" />
                    </svg>
                    Refresh Schema
                  </button>

                  <button
                    onClick={() => { setActiveTab('chat'); setMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Open AI Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
