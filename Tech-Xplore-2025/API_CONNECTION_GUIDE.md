# API Connection Guide 🔌

This guide explains how the Chat Agent connects to your backend API and how to test the integration.

## Architecture Overview

```
User → React Frontend → ChatAgent → McpAgent → Backend API
```

### Components:
1. **ChatAgent** (`src/chat.ts`) - Main conversational AI
2. **McpAgent** (`src/mcp.ts`) - Bridge to backend APIs via MCP tools
3. **Backend API** (`Tech-Xplore-API-2025/`) - RESTful API endpoints

## How It Works

The connection flow is:
1. User sends message in chat interface
2. ChatAgent processes the message and determines which tools to use
3. McpAgent exposes tools that make HTTP calls to your backend API
4. Backend API returns data which flows back to the user

## Updated MCP Tools with API Integration

The following tools now connect to your backend API:

### 1. `analyzeSpendingPatterns`
- **API Endpoint**: `POST /api/spending-insights`
- **Purpose**: Analyze spending patterns and provide insights
- **Parameters**: `userId`, `monthlyIncome`, `expenses`

### 2. `getFinancialAdvice`
- **API Endpoint**: `GET /api/financial-advice`
- **Purpose**: Get comprehensive financial health analysis
- **Parameters**: `userId`, `timeframe`

### 3. `getTransactions`
- **API Endpoint**: `POST /api/transactions`
- **Purpose**: Retrieve user transaction history
- **Parameters**: `userId`, `timeframe`

### 4. `getESGInvestments`
- **API Endpoint**: `GET /api/esg-investments`
- **Purpose**: Get ESG investment recommendations
- **Parameters**: `investmentAmount`, `riskProfile`

### 5. `getCarbonFootprint`
- **API Endpoint**: `POST /api/carbon`
- **Purpose**: Analyze carbon footprint from transactions
- **Parameters**: `userId`, `timeframe`

### 6. `getSustainabilityTips`
- **API Endpoint**: `GET /api/sustainability-tips`
- **Purpose**: Get personalized sustainability recommendations
- **Parameters**: `userProfile`

## Environment Configuration

### Development (.dev.vars)
```bash
API_BASE_URL=http://localhost:8787
IS_LOCAL=true
```

### Production
Set the following environment variables in Cloudflare Workers:
```bash
API_BASE_URL=https://your-api-worker.workers.dev
IS_LOCAL=false
```

## Testing the Connection

### Step 1: Start the Backend API
```bash
cd Tech-Xplore-API-2025
npm install
npm run dev
```

The API will be available at `http://localhost:8787` with Swagger UI at `http://localhost:8787/ui`

### Step 2: Start the MCP Agent
```bash
cd Tech-Xplore-2025
npm install
npm start
```

The chat interface will be available at `http://localhost:8788`

### Step 3: Test API Integration

Try these chat prompts to test the API connection:

1. **Test Financial Advice**:
   ```
   Can you give me some financial advice based on my profile?
   ```

2. **Test Spending Analysis**:
   ```
   Can you analyze my spending patterns? My monthly income is R25000 and I spend about R3000 on groceries.
   ```

3. **Test Transactions**:
   ```
   Show me my recent transactions for user123
   ```

4. **Test ESG Investments**:
   ```
   What ESG investment options do you recommend for R10000?
   ```

5. **Test Carbon Footprint**:
   ```
   Calculate my carbon footprint for user123 this month
   ```

6. **Test Sustainability Tips**:
   ```
   Give me some sustainability tips for urban living
   ```

## Error Handling

The tools include robust error handling:
- **API Available**: Returns real data from backend
- **API Unavailable**: Falls back to mock data or error messages
- **Network Issues**: Graceful degradation with user-friendly messages

## Debugging

### Check API Connection
```bash
# Test API directly
curl http://localhost:8787/api/financial-advice

# Test with data
curl -X POST http://localhost:8787/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123"}'
```

### Check MCP Agent Logs
Look for these messages in the console:
- `Error calling [API_NAME] API:` - API connection issues
- `API unavailable, using mock data:` - Fallback to mock data

### Common Issues

1. **Port Conflicts**: Make sure both services run on different ports (8787 for API, 8788 for MCP Agent)
2. **CORS Issues**: The API has CORS enabled for all domains
3. **Environment Variables**: Ensure `API_BASE_URL` is set correctly

## Production Deployment

### Deploy Backend API
```bash
cd Tech-Xplore-API-2025
npm run deploy
```

### Deploy MCP Agent
```bash
cd Tech-Xplore-2025
# Update API_BASE_URL in wrangler.toml or dashboard
npm run deploy
```

### Update Environment Variables
In Cloudflare Dashboard or via Wrangler:
```bash
wrangler secret put API_BASE_URL
# Enter your deployed API URL: https://your-api-worker.workers.dev
```

## Adding New API Endpoints

To add new API endpoints to the chat agent:

1. **Add endpoint to backend API** (`Tech-Xplore-API-2025/src/index.ts`)
2. **Create new MCP tool** in `src/mcp.ts`:
   ```typescript
   this.server.tool(
     "toolName",
     "Tool description",
     { /* parameters */ },
     async (params) => {
       try {
         const data = await callBackendAPI('/api/new-endpoint', 'POST', params);
         return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
       } catch (error) {
         return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
       }
     }
   );
   ```

## Next Steps

1. **Customize API endpoints** in the backend to match your specific needs
2. **Add authentication** if required for production use
3. **Implement data persistence** using Cloudflare KV or D1 database
4. **Add monitoring and logging** for production usage
5. **Optimize API responses** for better chat experience

The connection is now live! Your chat agent can communicate with your backend API through the MCP tools. 🚀
