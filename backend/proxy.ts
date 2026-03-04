/// <reference lib="deno.ns" />

import postgres, { type Sql } from "npm:postgres";
import { assert } from "@std/assert";

type PostgresClient = Sql;

interface Connection {
  id: string;
  client: PostgresClient;
  config: ConnectionConfig;
}

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface Message {
  type: string;
  [key: string]: unknown;
}

const connections = new Map<string, Connection>();

function buildConnectionString(config: ConnectionConfig): string {
  const { host, port, database, user, password } = config;
  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

async function connectToDatabase(config: ConnectionConfig): Promise<PostgresClient> {
  const client = postgres(buildConnectionString(config));
  await client`SELECT 1`;
  return client;
}

async function handleConnect(
  connectionId: string,
  config: ConnectionConfig,
  ws: WebSocket,
): Promise<void> {
  try {
    if (connections.has(connectionId)) {
      const existing = connections.get(connectionId)!;
      await existing.client.end();
    }

    const client = await connectToDatabase(config);
    connections.set(connectionId, { id: connectionId, client, config });

    ws.send(
      JSON.stringify({
        type: "connected",
        connectionId,
        success: true,
      }),
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        connectionId,
        message: error instanceof Error ? error.message : "Connection failed",
      }),
    );
  }
}

async function handleQuery(
  connectionId: string,
  sqlQuery: string,
  params: unknown[] | undefined,
  ws: WebSocket,
): Promise<void> {
  const connection = connections.get(connectionId);
  if (!connection) {
    ws.send(
      JSON.stringify({
        type: "error",
        connectionId,
        message: "Not connected. Please connect first.",
      }),
    );
    return;
  }

  try {
    const result = await connection.client.unsafe(sqlQuery, params as (string | number | boolean | null)[]);

    const rows = Array.isArray(result) ? result : [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    ws.send(
      JSON.stringify({
        type: "result",
        connectionId,
        columns,
        rows,
        rowCount: rows.length,
      }),
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        connectionId,
        message: error instanceof Error ? error.message : "Query failed",
      }),
    );
  }
}

async function handleSchema(
  connectionId: string,
  ws: WebSocket,
): Promise<void> {
  const connection = connections.get(connectionId);
  if (!connection) {
    ws.send(
      JSON.stringify({
        type: "error",
        connectionId,
        message: "Not connected",
      }),
    );
    return;
  }

  try {
    const tablesResult = await connection.client<{ table_name: string; table_schema: string }[]>`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const tables: { name: string; schema: string; columns: unknown[] }[] = [];

    for (const row of tablesResult) {
      const columnsResult = await connection.client.unsafe(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [row.table_schema, row.table_name]);

      tables.push({
        name: row.table_name,
        schema: row.table_schema,
        columns: columnsResult,
      });
    }

    ws.send(
      JSON.stringify({
        type: "schema",
        connectionId,
        tables,
      }),
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        connectionId,
        message: error instanceof Error ? error.message : "Failed to fetch schema",
      }),
    );
  }
}

async function handleDisconnect(
  connectionId: string,
  ws: WebSocket,
): Promise<void> {
  const connection = connections.get(connectionId);
  if (connection) {
    await connection.client.end();
    connections.delete(connectionId);
  }

  ws.send(
    JSON.stringify({
      type: "disconnected",
      connectionId,
    }),
  );
}

async function handleMessage(
  message: string,
  ws: WebSocket,
): Promise<void> {
  try {
    const msg: Message = JSON.parse(message);
    const connectionId = msg.connectionId as string;

    assert(connectionId, "connectionId is required");

    switch (msg.type) {
      case "connect": {
        const config = msg.config as ConnectionConfig;
        await handleConnect(connectionId, config, ws);
        break;
      }
      case "query": {
        const sqlQuery = msg.sql as string;
        const params = msg.params as unknown[] | undefined;
        await handleQuery(connectionId, sqlQuery, params, ws);
        break;
      }
      case "schema": {
        await handleSchema(connectionId, ws);
        break;
      }
      case "disconnect": {
        await handleDisconnect(connectionId, ws);
        break;
      }
      default:
        ws.send(
          JSON.stringify({
            type: "error",
            connectionId,
            message: `Unknown message type: ${msg.type}`,
          }),
        );
    }
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to process message",
      }),
    );
  }
}

const handler = (req: Request): Response => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response(null, { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener("open", () => {
    console.log("Client connected");
  });

  socket.addEventListener("message", async (event: MessageEvent) => {
    await handleMessage(event.data as string, socket);
  });

  socket.addEventListener("close", async () => {
    console.log("Client disconnected");
    for (const [id, conn] of connections) {
      await conn.client.end();
      connections.delete(id);
    }
  });

  socket.addEventListener("error", (error: Event) => {
    console.error("WebSocket error:", error);
  });

  return response;
};

const port = Deno.env.get("PORT") ? parseInt(Deno.env.get("PORT")!) : 3001;

console.log(`Starting WebSocket proxy server on port ${port}...`);
Deno.serve({ port }, handler);