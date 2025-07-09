// Heads up: This is the entrypoint to your app. If you want to build a REST API endpoint for example, you will configure routing here.

import { routeAgentRequest } from "agents";
import { MyMCP } from "./mcp";
import { Chat } from "./chat"


// Exporting Durable Objects (Agents) - Required by Cloudflare
export {MyMCP};
export {Chat};

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {

    const url = new URL(request.url);
    
    // MCP server endpoints
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }
    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;


