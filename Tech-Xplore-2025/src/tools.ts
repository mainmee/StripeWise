// Heads up: You will probably need to edit this file BUT ONLY the TOOLS_REQURING_CONFIRMATION

import type { MCPClientManager } from "agents/mcp/client";
import { tool } from "ai";
import { z } from "zod";

// Tools that require user confirmation before execution
export const TOOLS_REQURING_CONFIRMATION = [
  "getWeatherInformation",
];

// This function is used to register tools from the MCP server
// You will most probably NOT need to change this function
export async function registerToolsFromMcpServer(
  mcp: MCPClientManager, 
  serverUrl: string = "http://localhost:5173/sse"
) {
    const mcpConnection = await mcp.connect(
      serverUrl
    );
    
    const mcpConnectionId = mcpConnection.id;

    const mcptools = mcp.listTools();

    // Transform mcptools into a series of tool definitions
    const mcpAgentTools: Record<string, any> = {};
    
    for (const mcpTool of mcptools) {
      // Convert MCP tool parameters schema to Zod schema
      const zodSchema = z.object(
        Object.fromEntries(
          Object.entries(mcpTool.inputSchema?.properties || {}).map(([key, value]: [string, any]) => [
            key,
            value.type === 'string' ? z.string() : 
            value.type === 'number' ? z.number() :
            value.type === 'boolean' ? z.boolean() :
            z.any()
          ])
        )
      );

      // Create tool definition with execute function that calls MCP
      if (!TOOLS_REQURING_CONFIRMATION.includes(mcpTool.name)) {
        mcpAgentTools[mcpTool.name] = tool({
          description: mcpTool.description,
          parameters: zodSchema,
          execute: async (args) => {
            try {
              // Call the MCP tool through the connection
              const result = mcp.callTool({ 
                name: mcpTool.name, 
                arguments: args, 
                serverId: mcpConnection.id 
              });

              const response = await result;
              // Extract text content from the response
              if (response.content && Array.isArray(response.content)) {
                // Join all text content if there are multiple text items
                return response.content
                  .filter(item => item.type === 'text')
                  .map(item => item.text)
                  .join(' ');
              } else {
                // Return string representation of the response if not in expected format
                return String(response);
              }
            } catch (error) {
              console.error(`Error calling MCP tool ${mcpTool.name}:`, error);
              return `Error: ${error}`;
            }
          }
        });
      } else {
        // For tools that require confirmation, we create a tool definition
        // that will be processed by the AI model to request user confirmation
        mcpAgentTools[mcpTool.name] = tool({
          description: mcpTool.description,
          parameters: zodSchema
        });
      }
      
    }

    // for all tools that need confirmation, we add an execute function
    const executions = Object.fromEntries(
      Object.entries(mcpAgentTools)
        .filter(([name]) => TOOLS_REQURING_CONFIRMATION.includes(name))
        .map(([name, toolDef]) => [
          name,
          async (args: z.infer<typeof toolDef.parameters>, context: { messages: any[], toolCallId: string }) => {
            // Call the MCP tool through the connection
            const result = mcp.callTool({
              name,
              arguments: args,
              serverId: mcpConnection.id,
            });

            try {
              const response = await result;
              // Extract text content from the response
              if (response.content && Array.isArray(response.content)) {
                // Join all text content if there are multiple text items
                return response.content
                  .filter(item => item.type === 'text')
                  .map(item => item.text)
                  .join(' ');
              } else {
                // Return string representation of the response if not in expected format
                return String(response);
              }
            } catch (error) {
              console.error(`Error calling MCP tool ${name}:`, error);
              return `Error: ${error}`;
            }
          },
        ])
    );

    return { mcpAgentTools, executions, mcpConnectionId };
 
}