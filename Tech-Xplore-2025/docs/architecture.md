# Project Architecture Overview 🏗️

This document provides a high-level overview of the MCP Agent Starter project architecture, including the main components, data flow, and how everything fits together.

---

## Components

### 1. Frontend (React) 💻
- **Location:** `src/app.tsx`, `src/components/`
- **Purpose:** Provides a chat UI for users to interact with the agent.
- **Tech:** React, Tailwind CSS, Vite
- **Customizable:** Yes! Add new UI components or change the look and feel easily.

### 2. MCP (Cloudflare Worker) 🛠️
- **Location:** `src/server.ts`, `src/chat.ts`, `src/mcp.ts`, `src/tools.ts`
- **Purpose:** Handles API requests, routes messages, and exposes tools via the MCP protocol.
- **Customizable:** Yes! Feel free to explore! Most of your work here will involve adding new tools in `src/chat.ts` and `src/mcp.ts`, and some comments have been left for you to help describe the logic.
- **Key Files:**
  - `server.ts`: Entry point, request routing
  - `chat.ts`: ChatAgent definition
  - `mcp.ts`: MCP Agent and tool definitions
  - `tools.ts`: Tool registration and confirmation logic

#### Backend API Integration 🔗
- **Repository:** Tech-Xplore-API-2025
- **Purpose:** Provides the backend infrastructure with comprehensive financial and sustainability advisor APIs
- **Features:** 
  - Financial advice and spending insights
  - ESG investment recommendations
  - Carbon footprint tracking and sustainability tips
  - Comprehensive Swagger/OpenAPI documentation
- **Integration:** The MCP tools can call these backend APIs to provide rich financial and sustainability data to users
- **Documentation:** Full API documentation available at `/ui` (Swagger UI) and `/doc` (OpenAPI spec) and the READ.ME in the repository

### 3. Secrets & Configuration 🔐
- **Local:** `.dev.vars` (not committed)
- **Production:** Cloudflare Worker secrets (set via CLI or dashboard)
- **See:** [Secrets & Env Guide](secrets-and-env.md)

### 4. Model Providers 🤖
- **Azure OpenAI** or **OpenAI API** (direct)
- **Configurable via secrets**

### 5. Agents 🤖
- There are 2 agents involved in this implementation, a `ChatAgent` and an `McpAgent`
- Behind the scenes, both of these are implemented as specialised types of Cloudflare [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- **ChatAgent**
    - File: `src/chat.ts`
    - Purpose: This is the Chatbot the user interacts with, each user (created on the frontend) is routed to the exact same instance of the ChatAgent (ie: the user's name is the ID). Each ChatAgent instance has its own state, allowing you to store personalised content for the user. This agent has access to 2 sets of tools: 1) The tools exposed 'remotely' by the McpAgent, and 2) the tools the ChatAgent has locally defined
    - Docs: [Cloudflare ChatAgent](https://developers.cloudflare.com/agents/api-reference/agents-api/#chat-agent)
- **McpAgent**
    - File: `src/mcp.ts`
    - Purpose: This object is simultaneously an MCP server, and an agent. It exposes tools to the ChatAgent via the MCP protocol, as well as has the ability to do AI completions, and any other functionality that Cloudflare agents have.
    - Docs: [Cloudflare McpAgent](https://developers.cloudflare.com/agents/model-context-protocol/mcp-agent-api/)

---

## Data Flow

1. **User interacts with the chat UI** in their browser.
2. **Frontend sends messages** to the Cloudflare Worker backend.
3. **Worker processes the message** in `server.ts`, the request is routed to either the ChatAgent, or returns the static frontend assets.
4. **ChatAgent handles request** each user on the frontend is routed to a unique instance of a ChatAgent, which uses the model provider to decide on what tools to invoke to answer the request, if required.
5. **McpAgent exposes tools** the McpAgent is effectively an MCP server that exposes tools that your chat agent can call, these are decoupled from the actual ChatAgent.
6. **Responses are sent back** to the frontend and displayed in the chat UI.

---

## Useful Links
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Agents Docs](https://developers.cloudflare.com/agents/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)

---

For more details on each part, see the main [DEVELOPMENT.md](../DEVELOPMENT.md) or dive into the code!
