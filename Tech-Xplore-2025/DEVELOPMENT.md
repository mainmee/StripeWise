# Development Guide 🚀

Welcome to the MCP Agent Starter project! This guide will help you get up and running quickly, whether you're a new contributor or just exploring. If you get stuck, check out the [Troubleshooting Guide](docs/troubleshooting.md) and don't be afriad to reach out for help!

## Table of Contents 📚
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration & Secrets](#configuration--secrets)
- [Deploying to Cloudflare](#deploying-to-cloudflare)
- [Architecture Overview](docs/architecture.md)
- [Troubleshooting](docs/troubleshooting.md)

---

## Getting Started 🏁

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the worker locally**
   ```bash
   npm start
   ```
   > _Tip: If you are using Cloudflare Workers AI and see an error like `InferenceUpstreamError: 10000: Authentication error` when getting a model completion, just stop and restart with `npm start`. a couple times_

3. **Set up local secrets**
   - Copy `sample.dev.vars` to `.dev.vars` and fill in your secrets. See [Secrets & Environment Variables](docs/secrets-and-env.md) for details.

---

## Deploying to Cloudflare ☁️

1. [Create a free Cloudflare account](https://developers.cloudflare.com/fundamentals/account/create-account/) if you don't have one.
2. Deploy your app:
   ```bash
   npm run deploy
   ```
   - You'll be prompted to authenticate the first time.
   - Each team member can deploy to their own account for redundancy, or you can break up into someone who works on the McpAgent component, and someone who works on the ChatAgent and frontend - more on this in [Tips](docs/tips.md)

---

## Configuration & Secrets 🔐

- **Local development:**
  - Use `.dev.vars` (see [Secrets & Env Guide](docs/secrets-and-env.md)).
- **Production:**
  - Use Cloudflare Workers secrets. Example commands:
    ```bash
    npx wrangler secret put MCP_TOOLS_URL --env production
    npx wrangler secret put MODEL_PROVIDER --env production
    # Azure OpenAI
    npx wrangler secret put AI_AZURE_RESOURCE_NAME --env production
    npx wrangler secret put AI_AZURE_API_KEY --env production
    npx wrangler secret put AI_AZURE_MODEL_DEPLOYMENT --env production
    # OpenAI
    npx wrangler secret put OPENAI_API_KEY --env production
    npx wrangler secret put OPENAI_API_MODEL --env production
    ```
  - You can also add secrets via the Cloudflare dashboard UI.

For a full list of required secrets and their descriptions, see [Secrets & Env Guide](docs/secrets-and-env.md).

---

## Project Structure 🗂️

```
├── src/
│   ├── app.tsx        # Chat UI implementation (React)
│   ├── server.ts      # Worker entry point (API routing)
│   ├── chat.ts        # ChatAgent definition
│   ├── mcp.ts         # MCP Agent & tool definitions
│   ├── tools.ts       # Tool registration & confirmation logic
│   ├── styles.css     # Tailwind CSS styles
│   └── ...            # More components & utilities
```

See [Architecture Overview](docs/architecture.md) for a detailed breakdown of the codebase and data flow.

---

## Customization Guide 🎨

- **Add new tools:**
  - Define in `src/mcp.ts` using the tool builder. See examples in that file.
  - To require user confirmation, add the tool name to `TOOLS_REQURING_CONFIRMATION` in `src/tools.ts`.
- **Modify the UI:**
  - Edit `src/app.tsx` for the chat interface.
  - Change theme colors in `src/styles.css` (uses [Tailwind CSS](https://tailwindcss.com/)).
  - Add new React components in `src/components/`.

---

## Backend (Worker) 🛠️

- **`server.ts`**: Main entry point for the worker. Handles routing and API endpoints.
- **`chat.ts`**: Defines the ChatAgent (see [Cloudflare Agents API](https://developers.cloudflare.com/agents/api-reference/agents-api/#chat-agent)).
- **`mcp.ts`**: Main place to add/modify tools (see [MCP Agent API](https://developers.cloudflare.com/agents/model-context-protocol/mcp-agent-api/)).
- **`tools.ts`**: Manages which tools require user confirmation.
- **`utils.ts`**: Helper functions (rarely needs editing).

---

## Frontend (React) 💻

- **`app.tsx`**: Main chat UI.
- **`styles.css`**: Tailwind CSS for styling.
- **`components/`**: Reusable UI components (buttons, cards, dropdowns, etc).

---

## MCP Clients 🤖

MCP is like a USB port for AI! You can connect generic MCP clients to your agent. See [MCP_CLIENTS.md](MCP_CLIENTS.md) for options.

---

## Adding Members to Your Env 👥

- Edit types for your `Env` in [`worker-configuration.d.ts`](worker-configuration.d.ts).
- Add new secrets to `.dev.vars` and production via `npx wrangler secret put ...`.

---

## Friendly Tips & Best Practices 🌟

Check out [Tips](docs/tips.md) for some Tips and Tricks for success!


---

## Need Help? 🆘

- [Troubleshooting Guide](docs/troubleshooting.md)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Agents Docs](https://developers.cloudflare.com/agents/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)

Happy coding! 🎉