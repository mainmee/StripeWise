# Development Guide 🚀

Welcome to the Tech Xplore development guide! This comprehensive guide will help you understand the development workflow, project structure, and best practices for contributing to the platform.

## Table of Contents 📚
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration & Secrets](#configuration--secrets)
- [Deploying to Cloudflare](#deploying-to-cloudflare)
- [Customization Guide](#customization-guide)
- [MCP Clients](#mcp-clients)

---

## Getting Started 🏁

### Prerequisites

Make sure you have completed the steps in the [Getting Started Guide](./getting-started) first.

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the MCP Agent worker locally**
   ```bash
   npm start
   ```
   > _Tip: If you are using Cloudflare Workers AI and see an error like `InferenceUpstreamError: 10000: Authentication error` when getting a model completion, just stop and restart with `npm start` a couple times_

3. **Set up local secrets**
   - Copy `sample.dev.vars` to `.dev.vars` and fill in your secrets
   - See [Secrets & Environment Variables](./secrets-and-env) for details

4. **Run the API Backend**
   ```bash
   cd Tech-Xplore-API-2025
   npm install
   npm run dev
   ```

---

## Project Structure 🗂️

### MCP Agent (Tech-Xplore-2025)

```
├── src/
│   ├── app.tsx           # Chat UI implementation (React)
│   ├── server.ts         # Worker entry point (API routing)
│   ├── chat.ts           # ChatAgent definition
│   ├── mcp.ts            # MCP Agent & tool definitions
│   ├── tools.ts          # Tool registration & confirmation logic
│   ├── styles.css        # Tailwind CSS styles
│   ├── components/       # Reusable UI components
│   │   ├── button/       # Button components
│   │   ├── card/         # Card components
│   │   ├── modal/        # Modal components
│   │   └── ...           # More UI components
│   ├── hooks/            # React hooks
│   ├── providers/        # Context providers
│   └── utils/            # Utility functions
├── docs/                 # Documentation files
├── public/               # Static assets
└── wrangler.jsonc        # Cloudflare Worker configuration
```

### API Backend (Tech-Xplore-API-2025)

```
├── src/
│   ├── index.ts          # Main API routes & OpenAPI configuration
│   └── endpoints/        # API endpoint implementations
├── public/               # Static assets
└── wrangler.jsonc        # Cloudflare Worker configuration
```

See [Architecture Overview](./architecture) for a detailed breakdown of the codebase and data flow.

---

## Configuration & Secrets 🔐

### Local Development

Use `.dev.vars` for local development secrets:

```bash
# Copy the sample file
cp .sample.dev.vars .dev.vars

# Edit with your values
MODEL_PROVIDER=azure_openai
AI_AZURE_RESOURCE_NAME=your-resource-name
AI_AZURE_API_KEY=your-api-key
AI_AZURE_MODEL_DEPLOYMENT=your-deployment-name
```

### Production Deployment

Set secrets in Cloudflare Workers:

```bash
# Model provider configuration
npx wrangler secret put MODEL_PROVIDER --env production
npx wrangler secret put MCP_TOOLS_URL --env production

# Azure OpenAI
npx wrangler secret put AI_AZURE_RESOURCE_NAME --env production
npx wrangler secret put AI_AZURE_API_KEY --env production
npx wrangler secret put AI_AZURE_MODEL_DEPLOYMENT --env production

# OpenAI (alternative)
npx wrangler secret put OPENAI_API_KEY --env production
npx wrangler secret put OPENAI_API_MODEL --env production
```

You can also add secrets via the Cloudflare dashboard UI.

For a full list of required secrets and their descriptions, see [Secrets & Environment Variables](./secrets-and-env).

---

## Deploying to Cloudflare ☁️

### Prerequisites

1. [Create a free Cloudflare account](https://developers.cloudflare.com/fundamentals/account/create-account/) if you don't have one
2. Install and authenticate Wrangler CLI (happens automatically on first deployment)

### Deploy MCP Agent

```bash
cd tech-xplore-2025
npm run deploy
```

### Deploy API Backend

```bash
cd Tech-Xplore-API-2025
npm run deploy
```

> **Note**: Each team member can deploy to their own account for redundancy, or you can break up into someone who works on the McpAgent component, and someone who works on the ChatAgent and frontend.

### Post-Deployment Steps

1. **Update API URLs**: Make sure your MCP Agent points to the deployed API backend
2. **Configure Secrets**: Set all production secrets via Wrangler or Cloudflare dashboard
3. **Test Integration**: Verify both components work together in production

---

## Customization Guide 🎨

### Adding New Tools

Tools are defined in `src/mcp.ts` using the tool builder pattern:

```typescript
// Example: Add a new financial analysis tool
.tool('analyzeSpending', 'Analyze spending patterns and provide insights', {
  category: z.string().describe('Spending category to analyze'),
  timeframe: z.string().describe('Time period (e.g., "last_month", "last_year")')
}, async ({ category, timeframe }) => {
  // Tool implementation
  return {
    analysis: "Spending analysis results...",
    recommendations: ["Tip 1", "Tip 2"]
  };
})
```

To require user confirmation for a tool, add it to `TOOLS_REQUIRING_CONFIRMATION` in `src/tools.ts`:

```typescript
export const TOOLS_REQUIRING_CONFIRMATION = [
  'analyzeSpending',
  // ... other tools
];
```

### Modifying the UI

- **Chat Interface**: Edit `src/app.tsx` for the main chat interface
- **Styling**: Modify `src/styles.css` (uses [Tailwind CSS](https://tailwindcss.com/))
- **Components**: Add new React components in `src/components/`
- **Themes**: Update theme colors and design tokens

### Backend Customization

- **New API Endpoints**: Add to `src/index.ts` with OpenAPI documentation
- **Mock Data**: Update realistic financial data in endpoint implementations
- **Business Logic**: Implement custom financial calculations and algorithms

---

## Backend Components 🛠️

### MCP Agent Worker

- **`server.ts`**: Main entry point for the worker. Handles routing and API endpoints
- **`chat.ts`**: Defines the ChatAgent (see [Cloudflare Agents API](https://developers.cloudflare.com/agents/api-reference/agents-api/#chat-agent))
- **`mcp.ts`**: Main place to add/modify tools (see [MCP Agent API](https://developers.cloudflare.com/agents/model-context-protocol/mcp-agent-api/))
- **`tools.ts`**: Manages which tools require user confirmation
- **`utils.ts`**: Helper functions (rarely needs editing)

### Frontend (React)

- **`app.tsx`**: Main chat UI implementation
- **`styles.css`**: Tailwind CSS for styling
- **`components/`**: Reusable UI components (buttons, cards, dropdowns, etc.)
- **`hooks/`**: Custom React hooks for state management
- **`providers/`**: Context providers for global state

---

## MCP Clients 🤖

The Model Context Protocol (MCP) is like a USB port for AI! You can connect various MCP clients to your agent:

- **Custom Web Interface**: The included React frontend (recommended)
- **Claude Desktop**: Connect to Anthropic's desktop application
- **GitHub Copilot**: Use with GitHub Copilot Agent Mode
- **Cloudflare AI Playground**: Test with Cloudflare's online playground

See [MCP Clients Guide](./mcp-clients) for detailed setup instructions for each client.

---

## Development Workflow 🔄

### Recommended Development Process

1. **Start Local Servers**:
   ```bash
   # Terminal 1: MCP Agent
   cd Tech-Xplore-2025
   npm start
   
   # Terminal 2: API Backend
   cd Tech-Xplore-API-2025
   npm run dev
   ```

2. **Make Changes**: Edit code with hot reload support
3. **Test Locally**: Use the web interface at http://localhost:8788
4. **Test API**: Use Swagger UI at http://localhost:8787/ui
5. **Deploy**: Push changes to production with `npm run deploy`

### Team Collaboration

- **Frontend Developer**: Focus on `src/app.tsx`, `src/components/`, and styling
- **Backend Developer**: Work on `src/mcp.ts`, `src/chat.ts`, and API endpoints
- **Data Scientist**: Implement financial algorithms and mock data generation
- **DevOps**: Handle deployment, secrets management, and infrastructure

---

## Adding Team Members 👥

To add new environment variables or secrets:

1. **Update Types**: Edit `worker-configuration.d.ts` for your `Env` interface
2. **Local Development**: Add new secrets to `.dev.vars`
3. **Production**: Set secrets via `npx wrangler secret put ...` or Cloudflare dashboard

---

## Best Practices 🌟

### Code Quality
- Use TypeScript for type safety
- Follow consistent naming conventions
- Write clear, documented code
- Test your changes thoroughly

### Performance
- Optimize API calls and reduce latency
- Use efficient data structures
- Implement proper caching strategies

### Security
- Never commit secrets to version control
- Use environment variables for configuration
- Validate all inputs and sanitize outputs

### User Experience
- Provide clear error messages
- Implement loading states
- Ensure responsive design
- Test on multiple devices

Check out [Development Tips](./tips) for more detailed best practices and tricks!

---

## Debugging & Troubleshooting 🐛

### Common Issues

- **Authentication Errors**: Restart the development server
- **Build Failures**: Clear node_modules and reinstall dependencies
- **Deployment Issues**: Check Cloudflare dashboard for error logs
- **API Connection**: Verify both servers are running on correct ports

For detailed troubleshooting steps, see the [Troubleshooting Guide](./troubleshooting).

---

## Useful Resources 📖

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Agents Documentation](https://developers.cloudflare.com/agents/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## Need Help? 🆘

- 🛠️ [Troubleshooting Guide](./troubleshooting)
- 🏗️ [Architecture Overview](./architecture)
- 💡 [Development Tips](./tips)
- 🔐 [Secrets Configuration](./secrets-and-env)
- 🐛 [Report Issues](https://github.com/your-org/tech-xplore/issues)

Happy coding! 🎉 