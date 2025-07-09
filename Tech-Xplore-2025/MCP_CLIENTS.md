# MCP Clients

There are multiple ways to connect to your MCP Server/Agent.

## Option 1: Custom Chat Interface

This project starter comes with a React web frontend that uses the `ChatAgent` to decide what tools to invoke from your `McpAgent`. You are welcome to customize this as you wish to give it a personal look and feel. This is deifnitely the recommended approach, as you will have the most control and flexibility.

## Option 2: Claude Desktop

Claude Desktop is an application you can download to use LLMs produced by Anthropic (feels very similar to ChatGPT, but a desktop app and uses different models). An awesome functionality of it is the ability to connect to your custom MCP server in your chats, allow you to use the powerful Claude models as your Chat Agent, in the desktop UI. WARNING: You might lose some of the functionality of your agent such as specifying the list of tools requiring confirmation.

[Guide on how to connect to an MCP server from Claude Desktop](https://developers.cloudflare.com/agents/guides/remote-mcp-server/#connect-your-remote-mcp-server-to-claude-and-other-mcp-clients-via-a-local-proxy)

## Option 3: Github Copilot

If you have access to Github copilot, you can connect to your MCP server via 'agent mode'. WARNING: You might lose some of the functionality of your agent such as specifying the list of tools requiring confirmation.

[Guide on how to connect to an MCP server via Github Copilot Agent Mode](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)

## Option 4: Cloudflare AI Playground

You can also use the Cloudflare AI Playground at https://playground.ai.cloudflare.com/ to connect to your MCP server. This provides a web-based interface for testing and interacting with your MCP agent using various AI models available on the Cloudflare platform.