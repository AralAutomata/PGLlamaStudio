export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }[];
}

export type MessageHandler = (data: ServerMessage) => void;

export interface ServerMessage {
  type: string;
  connectionId?: string;
  success?: boolean;
  message?: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  tables?: TableInfo[];
}

class DatabaseClient {
  private ws: WebSocket | null = null;
  private connectionId: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor() {
    this.connectionId = crypto.randomUUID();
  }

  connect(config: ConnectionConfig, wsUrl: string = "ws://localhost:3001"): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.send({
            type: "connect",
            connectionId: this.connectionId,
            config,
          });

          const handler = (data: ServerMessage) => {
            if (data.type === "connected" && data.connectionId === this.connectionId) {
              if (data.success) {
                resolve();
              } else {
                reject(new Error(data.message || "Connection failed"));
              }
              this.offMessage(handler);
            } else if (data.type === "error" && data.connectionId === this.connectionId) {
              reject(new Error(data.message || "Connection failed"));
              this.offMessage(handler);
            }
          };
          this.onMessage(handler);
        };

        this.ws.onerror = (error) => {
          reject(error);
        };

        this.ws.onclose = () => {
          this.cleanup();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.send({ type: "disconnect", connectionId: this.connectionId });
      this.ws.close();
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.ws = null;
    this.handlers.clear();
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error("Not connected"));
        return;
      }

      const handler = (data: ServerMessage) => {
        if (data.connectionId === this.connectionId) {
          if (data.type === "result") {
            resolve({
              columns: data.columns || [],
              rows: data.rows || [],
              rowCount: data.rowCount || 0,
            });
          } else if (data.type === "error") {
            reject(new Error(data.message || "Query failed"));
          }
          this.offMessage(handler);
        }
      };

      this.onMessage(handler);
      this.send({
        type: "query",
        connectionId: this.connectionId,
        sql,
        params,
      });
    });
  }

  async getSchema(): Promise<TableInfo[]> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error("Not connected"));
        return;
      }

      const handler = (data: ServerMessage) => {
        if (data.connectionId === this.connectionId) {
          if (data.type === "schema") {
            resolve(data.tables || []);
          } else if (data.type === "error") {
            reject(new Error(data.message || "Failed to fetch schema"));
          }
          this.offMessage(handler);
        }
      };

      this.onMessage(handler);
      this.send({
        type: "schema",
        connectionId: this.connectionId,
      });
    });
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: MessageHandler): void {
    if (!this.ws) return;

    const wrappedHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;
        handler(data);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    this.ws.addEventListener("message", wrappedHandler);
    this.handlers.add(wrappedHandler as MessageHandler);
  }

  offMessage(handler: MessageHandler): void {
    this.handlers.delete(handler);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionId(): string {
    return this.connectionId;
  }
}

export const db = new DatabaseClient();