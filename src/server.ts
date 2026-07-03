import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { registerGarminTools } from "./tools.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "garmin-connect-mcp",
    version: "0.1.0",
  });

  registerGarminTools(server);

  return server;
}

// Bind for external tunnel access. Restrict network exposure separately if needed.
const app = createMcpExpressApp({ host: "0.0.0.0" });
const transports = new Map<string, StreamableHTTPServerTransport>();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.all("/mcp", async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    let transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport!);
        },
      });

      const server = createServer();
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.listen(config.port, () => {
  console.log(`Garmin MCP server listening at http://localhost:${config.port}/mcp`);
});
