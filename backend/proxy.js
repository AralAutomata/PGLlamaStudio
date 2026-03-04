const WebSocket = require('ws');
const http = require('http');
const { Client } = require('pg');

const connections = new Map();

// LLM Configuration
let llmConfig = {
  provider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  lmstudioUrl: 'http://localhost:1234',
  model: '',
  systemPrompt: ''
};

function buildConnectionString(config) {
  const { host, port, database, user, password } = config;
  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

async function connectToDatabase(config) {
  const client = new Client({
    connectionString: buildConnectionString(config),
  });
  await client.connect();
  return client;
}

async function handleConnect(connectionId, config, ws) {
  try {
    if (connections.has(connectionId)) {
      const existing = connections.get(connectionId);
      await existing.client.end();
    }

    const client = await connectToDatabase(config);
    connections.set(connectionId, { id: connectionId, client, config });

    ws.send(JSON.stringify({
      type: 'connected',
      connectionId,
      success: true,
    }));
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      connectionId,
      message: error.message || 'Connection failed',
    }));
  }
}

async function handleQuery(connectionId, sqlQuery, params, ws) {
  const connection = connections.get(connectionId);
  if (!connection) {
    ws.send(JSON.stringify({
      type: 'error',
      connectionId,
      message: 'Not connected. Please connect first.',
    }));
    return;
  }

  try {
    const result = await connection.client.query(sqlQuery, params);
    const rows = result.rows || [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    ws.send(JSON.stringify({
      type: 'result',
      connectionId,
      columns,
      rows,
      rowCount: rows.length,
    }));
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      connectionId,
      message: error.message || 'Query failed',
    }));
  }
}

async function handleSchema(connectionId, ws, dbConnection) {
  const connection = dbConnection || connections.get(connectionId);
  if (!connection) {
    ws.send(JSON.stringify({
      type: 'error',
      connectionId,
      message: 'Not connected',
    }));
    return;
  }

  try {
    const tablesResult = await connection.client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = [];

    for (const row of tablesResult.rows) {
      const columnsResult = await connection.client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [row.table_schema, row.table_name]);

      tables.push({
        name: row.table_name,
        schema: row.table_schema,
        columns: columnsResult.rows,
      });
    }

    ws.send(JSON.stringify({
      type: 'schema',
      connectionId,
      tables,
    }));
    
    return tables;
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      connectionId,
      message: error.message || 'Failed to fetch schema',
    }));
    return [];
  }
}

async function handleDisconnect(connectionId, ws) {
  const connection = connections.get(connectionId);
  if (connection) {
    await connection.client.end();
    connections.delete(connectionId);
  }

  ws.send(JSON.stringify({
    type: 'disconnected',
    connectionId,
  }));
}

async function handleMessage(message, ws) {
  try {
    const msg = JSON.parse(message);
    const connectionId = msg.connectionId;

    if (!connectionId) {
      throw new Error('connectionId is required');
    }

    switch (msg.type) {
      case 'connect': {
        await handleConnect(connectionId, msg.config, ws);
        break;
      }
      case 'query': {
        await handleQuery(connectionId, msg.sql, msg.params, ws);
        break;
      }
      case 'schema': {
        await handleSchema(connectionId, ws);
        break;
      }
      case 'disconnect': {
        await handleDisconnect(connectionId, ws);
        break;
      }
      default:
        ws.send(JSON.stringify({
          type: 'error',
          connectionId,
          message: `Unknown message type: ${msg.type}`,
        }));
    }
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message || 'Failed to process message',
    }));
  }
}

// HTTP Server for LLM API
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // LLM Configuration endpoints
  if (pathname === '/api/llm-config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(llmConfig));
    return;
  }

  if (pathname === '/api/llm-config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        llmConfig = { ...llmConfig, ...config };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, config: llmConfig }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Health check for Ollama
  if (pathname === '/api/llm-health' && req.method === 'GET') {
    try {
      const baseUrl = llmConfig.provider === 'ollama' ? llmConfig.ollamaUrl : llmConfig.lmstudioUrl;
      const response = await fetch(`${baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'connected', 
          provider: llmConfig.provider,
          models: data.models || []
        }));
      } else {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: 'LLM not responding' }));
      }
    } catch (error) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', error: error.message }));
    }
    return;
  }

  // List available models
  if (pathname === '/api/models' && req.method === 'GET') {
    try {
      const baseUrl = llmConfig.provider === 'ollama' ? llmConfig.ollamaUrl : llmConfig.lmstudioUrl;
      const response = await fetch(`${baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map(m => ({
          name: m.name,
          size: m.size,
          modified: m.modified_at
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ models }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch models' }));
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Get schema for context
  if (pathname === '/api/schema' && req.method === 'GET') {
    // Use first available connection
    const conn = connections.values().next().value;
    if (!conn) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ schema: '', tables: [] }));
      return;
    }

    try {
      const tablesResult = await conn.client.query(`
        SELECT table_name, table_schema 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const tables = [];

      for (const row of tablesResult.rows) {
        const columnsResult = await conn.client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [row.table_schema, row.table_name]);

        tables.push({
          name: row.table_name,
          columns: columnsResult.rows.map(c => `${c.column_name} (${c.data_type})`)
        });
      }

      const schema = tables.map(t => 
        `${t.name}: ${t.columns.join(', ')}`
      ).join('\n');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ schema, tables }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Chat endpoint (streaming)
  if (pathname === '/api/chat/stream' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { message, history, model } = JSON.parse(body);
        const useModel = model || llmConfig.model;
        
        if (!useModel) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No model selected' }));
          return;
        }

        const baseUrl = llmConfig.provider === 'ollama' ? llmConfig.ollamaUrl : llmConfig.lmstudioUrl;
        
        // Build messages with schema context
        const schemaInfo = await getSchemaContext(connections.values().next().value);
        
        const systemMessage = llmConfig.systemPrompt || `You are a PostgreSQL expert. The user wants to query their database.

Available tables and columns:
${schemaInfo}

Instructions:
- Generate SQL queries for the user's requests
- Only output SQL code in markdown blocks
- If the user asks something unrelated to the database, answer helpfully
- Always include LIMIT when appropriate
- For dangerous operations (DROP, DELETE without WHERE, TRUNCATE), warn the user`;

        const messages = [
          { role: 'system', content: systemMessage },
          ...(history || []),
          { role: 'user', content: message }
        ];

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: useModel,
            messages,
            stream: true
          })
        });

        if (!response.ok) {
          res.end(`data: ${JSON.stringify({ error: 'LLM request failed' })}\n\n`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const msg = data.message;
                if (msg?.content) {
                  res.write(`data: ${JSON.stringify({ content: msg.content })}\n\n`);
                } else if (msg?.thinking) {
                  res.write(`data: ${JSON.stringify({ content: msg.thinking })}\n\n`);
                }
                if (data.done) {
                  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                }
              } catch (e) {
                // Skip parse errors
              }
            }
          }
        }

        res.end();
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Non-streaming chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { message, history, model } = JSON.parse(body);
        const useModel = model || llmConfig.model;
        
        if (!useModel) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No model selected' }));
          return;
        }

        const baseUrl = llmConfig.provider === 'ollama' ? llmConfig.ollamaUrl : llmConfig.lmstudioUrl;
        
        const schemaInfo = await getSchemaContext(connections.values().next().value);
        
        const systemMessage = llmConfig.systemPrompt || `You are a PostgreSQL expert. The user wants to query their database.

Available tables and columns:
${schemaInfo}

Instructions:
- Generate SQL queries for the user's requests
- Only output SQL code in markdown blocks
- If the user asks something unrelated to the database, answer helpfully`;

        const messages = [
          { role: 'system', content: systemMessage },
          ...(history || []),
          { role: 'user', content: message }
        ];

        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: useModel,
            messages,
            stream: false
          })
        });

        if (!response.ok) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'LLM request failed' }));
          return;
        }

        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: data.message?.content || '',
          done: true
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

async function getSchemaContext(connection) {
  if (!connection) {
    return 'No database connected';
  }

  try {
    const tablesResult = await connection.client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 20
    `);

    const tables = [];

    for (const row of tablesResult.rows) {
      const columnsResult = await connection.client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [row.table_name]);

      tables.push({
        name: row.table_name,
        columns: columnsResult.rows.map(c => `${c.column_name} (${c.data_type})`)
      });
    }

    return tables.map(t => `${t.name}: ${t.columns.join(', ')}`).join('\n');
  } catch (error) {
    return 'Error fetching schema';
  }
}

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    await handleMessage(message.toString(), ws);
  });

  ws.on('close', async () => {
    console.log('Client disconnected');
    for (const [id, conn] of connections) {
      try {
        await conn.client.end();
      } catch (e) {}
      connections.delete(id);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(3001, () => {
  console.log('Starting server on port 3001...');
  console.log('WebSocket: ws://localhost:3001');
  console.log('HTTP API: http://localhost:3001/api/*');
});