const express = require('express');
const cors = require('cors');

/**
 * Inicia el servidor MCP local en el puerto especificado.
 * Utiliza Server-Sent Events (SSE) como transporte.
 */
async function startMcpServer(port = 4040, ipcMain) {
  // Importaciones dinámicas obligatorias ya que el SDK de MCP usa ESM puro
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');

  const app = express();
  app.use(cors()); // Permitir CORS para clientes MCP externos si es necesario
  app.use(express.json()); // Habilita el parsing del body JSON para recibir POST requests en /messages

  const server = new McpServer({
    name: "Equipo Daneri - MCP Server",
    version: "1.0.0"
  });

  // Registramos una herramienta inicial de prueba
  server.tool(
    "get_app_info",
    "Obtiene información básica del estado de la aplicación",
    {},
    async (args) => {
      return {
        content: [{ type: "text", text: "App Equipo Daneri funcionando correctamente vía MCP." }]
      };
    }
  );

  let transport = null;

  app.get('/sse', async (req, res) => {
    console.log("[MCP] Cliente intentando conectar por SSE...");
    try {
      transport = new SSEServerTransport('/messages', res);
      await server.connect(transport);
      console.log("[MCP] Cliente conectado exitosamente por SSE.");
    } catch (e) {
      console.error("[MCP] Error al conectar cliente:", e);
    }
  });

  app.post('/messages', async (req, res) => {
    if (!transport) {
      return res.status(500).send("No active SSE connection");
    }
    try {
      await transport.handlePostMessage(req, res);
    } catch (e) {
      console.error("[MCP] Error manejando mensaje POST:", e);
      res.status(500).send("Internal Server Error");
    }
  });

  app.listen(port, () => {
    console.log(`[MCP Server] Servidor de contexto IA escuchando en http://localhost:${port}`);
    console.log(`[MCP Server] Endpoint SSE: http://localhost:${port}/sse`);
  });

  return server;
}

module.exports = { startMcpServer };
