# API Documentation 📊

Welcome to the Tech Xplore API documentation! The backend API provides comprehensive financial and sustainability advisory services through a modern REST API built with Cloudflare Workers and the Hono framework.

## Overview

The Tech Xplore API is a mock API template designed for financial advisor and sustainability advisor features. It provides realistic South African financial data and scenarios to help users understand their financial health and environmental impact.

## Getting Started

### Local Development

```bash
# Navigate to the API directory
cd Tech-Xplore-API-2025

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the API

- **Base URL (Local)**: `http://localhost:8787`
- **Base URL (Production)**: `https://your-worker-url.workers.dev`

## Interactive Documentation

The API includes comprehensive Swagger/OpenAPI documentation with interactive testing capabilities:

### Accessing the Swagger UI

To access the interactive Swagger documentation, append `/ui` to your base URL:

#### Local Development
```
http://localhost:8787/ui
```

#### Production (After Deployment)
```
https://your-actual-worker-url.workers.dev/ui
```

**Examples:**
- Local development: `http://localhost:8787/ui`
- Production: `https://tech-xplore-api.my-subdomain.workers.dev/ui`

**Note**: Make sure your Worker is running before trying to access the Swagger UI.

### Documentation Features

- **📋 Comprehensive Schemas**: All request/response structures are fully documented
- **🏷️ Tag-based Organization**: APIs are grouped by functionality
- **🔒 Type Safety**: Zod schemas ensure runtime validation and TypeScript type inference
- **📝 Examples**: All responses include realistic mock data examples
- **🧪 Interactive Testing**: Test all endpoints directly from the Swagger UI

## Available APIs

### Core APIs

#### Transactions API
- **Endpoint**: `/api/transactions`
- **Purpose**: Enhanced transaction insights with carbon impact analysis
- **Features**:
  - Transaction categorization
  - Carbon footprint calculation
  - Spending pattern analysis
  - Merchant information

#### Investments API
- **Endpoint**: `/api/investments`
- **Purpose**: Investment suggestions with ESG scoring
- **Features**:
  - Portfolio recommendations
  - ESG ratings and analysis
  - Risk assessment
  - Performance projections

#### Carbon Tracking API
- **Endpoint**: `/api/carbon`
- **Purpose**: Carbon footprint tracking and reduction tips
- **Features**:
  - Personal carbon footprint calculation
  - Environmental impact insights
  - Sustainability recommendations
  - Carbon offset suggestions

### Financial Advisor APIs

#### Financial Health Analysis
- **Endpoint**: `/api/financial-advice`
- **Purpose**: Personalized financial health analysis
- **Features**:
  - Financial health scoring
  - Goal tracking and recommendations
  - Debt analysis and payoff strategies
  - Emergency fund recommendations

#### Spending Insights
- **Endpoint**: `/api/spending-insights`
- **Purpose**: Detailed spending analysis and insights
- **Features**:
  - Category-wise spending breakdown
  - Trend analysis over time
  - Budget recommendations
  - Spending optimization tips

#### Recommendations Engine
- **Endpoint**: `/api/recommendations`
- **Purpose**: Combined financial and sustainability recommendations
- **Features**:
  - Personalized advice based on user profile
  - Goal-oriented recommendations
  - Sustainability-focused suggestions
  - Action items and next steps

### Sustainability Advisor APIs

#### ESG Investments
- **Endpoint**: `/api/esg-investments`
- **Purpose**: ESG-focused investment recommendations
- **Features**:
  - Environmental impact scoring
  - Social responsibility metrics
  - Governance quality assessment
  - Sustainable fund recommendations

#### Sustainability Tips
- **Endpoint**: `/api/sustainability-tips`
- **Purpose**: Weekly sustainability tips and challenges
- **Features**:
  - Personalized eco-friendly tips
  - Weekly challenges
  - Progress tracking
  - Impact measurements

### Documentation Endpoints

- **`/`**: API health check and endpoint listing
- **`/ui`**: Swagger UI for interactive API exploration
- **`/doc`**: OpenAPI specification (JSON format)

## Deployment

### Deploy to Cloudflare

```bash
npm run deploy
```

### Post-Deployment Configuration

After deployment, update the production server URL in your OpenAPI configuration:

1. **Find your deployed Worker URL**: Cloudflare provides a URL like `https://your-project-name.your-subdomain.workers.dev`

2. **Update the production server URL** in `src/index.ts`:
   ```typescript
   servers: [
     {
       url: 'https://your-actual-worker-url.workers.dev', // Replace with your deployed URL
       description: 'Production server',
     },
     // ... other servers
   ],
   ```

3. **Why this is important**:
   - Swagger UI uses this URL to make actual API calls
   - "Try it out" functionality won't work without the correct URL
   - External API clients need the correct base URL
   - Ensures documentation accurately reflects live endpoints

## API Design Principles

### South African Context

The API is specifically designed for the South African market:

- **Currency**: All amounts in South African Rand (R)
- **Merchants**: Recognizable local businesses (Woolworths, Pick n Pay, Uber, etc.)
- **Regulations**: Local financial regulations (tax-free savings limits)
- **Geography**: Relevant location data (cities, transport systems)

### Data Quality

#### Realistic Scenarios
- **Young Professional Profile**: R15,000 - R35,000 monthly income
- **Spending Patterns**: 30% housing, 20% transport, 15% food, 10% entertainment
- **Investment Capacity**: 10-20% of income for investments

#### Seasonal Variations
- **Holiday Spending**: December/January increased spending
- **Tax Season**: February/March tax-related activities
- **Bonus Periods**: Mid-year and year-end bonus impacts

### ESG Integration

Every API endpoint considers environmental, social, and governance factors:

- **Carbon Tracking**: Link every transaction to carbon impact
- **ESG Scoring**: Rate investments and merchants on ESG criteria
- **Sustainability Goals**: Connect financial goals to environmental impact

## Example Responses

### Transaction Data
```json
{
  "id": "tx_001",
  "date": "2025-06-24",
  "merchant": "Woolworths",
  "category": "Groceries",
  "amount": 245.50,
  "carbonImpact": 2.8,
  "isRecurring": true,
  "merchantType": "supermarket",
  "location": {
    "city": "Cape Town",
    "coordinates": [-33.9249, 18.4241]
  }
}
```

### Financial Health Score
```json
{
  "overallScore": 7.2,
  "categories": {
    "savings": 8.5,
    "debt": 6.0,
    "spending": 7.8,
    "investments": 6.5
  },
  "recommendations": [
    "Consider increasing emergency fund to 6 months expenses",
    "Explore ESG investment options for better sustainability impact"
  ]
}
```

## Integration with MCP Agent

The API is designed to work seamlessly with the MCP Agent in Tech-Xplore-2025:

```typescript
// Example MCP tool calling the API
.tool('getFinancialHealth', 'Get user financial health analysis', {
  userId: z.string().describe('User identifier')
}, async ({ userId }) => {
  const response = await fetch(`${API_BASE_URL}/api/financial-advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  return await response.json();
})
```

## Adding New Endpoints

### 1. Define OpenAPI Route Schema

```typescript
const newRoute = createRoute({
  method: 'get',
  path: '/api/new-endpoint',
  tags: ['Your Tag'],
  summary: 'Brief description',
  description: 'Detailed description of what this endpoint does',
  responses: {
    200: {
      description: 'Success response description',
      content: {
        'application/json': {
          schema: z.object({
            data: z.string().describe('Your data description'),
          }),
        },
      },
    },
  },
});
```

### 2. Implement Route Handler

```typescript
app.openapi(newRoute, (c) => {
  const response = {
    data: "your mock data"
  };
  return c.json(response);
});
```

### 3. Best Practices

- **Clear Descriptions**: Use `.describe()` for all schema fields
- **Proper Tags**: Group related endpoints with meaningful tags
- **Type Safety**: Use Zod schemas for runtime validation
- **Realistic Data**: Include actual South African context

## Type Generation

Generate TypeScript types from your Worker configuration:

```bash
npm run cf-typegen
```

## Error Handling

The API implements comprehensive error handling:

- **400 Bad Request**: Invalid input parameters
- **404 Not Found**: Endpoint or resource not found
- **500 Internal Server Error**: Server-side errors
- **Detailed Messages**: Clear error descriptions for debugging

## Performance & Caching

- **Edge Computing**: Deployed on Cloudflare's global network
- **Automatic Scaling**: Handles traffic spikes automatically
- **Response Optimization**: Minimal payload sizes for mobile usage
- **Caching Headers**: Appropriate cache control for different endpoints

## Security

- **Input Validation**: All inputs validated with Zod schemas
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Rate Limiting**: Protection against abuse and excessive usage
- **Secure Headers**: Security best practices implemented

## Monitoring

- **Cloudflare Analytics**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error logging
- **Usage Metrics**: API endpoint usage statistics
- **Health Checks**: Endpoint availability monitoring

## Next Steps

- **[Getting Started](../getting-started)**: Set up your development environment
- **[Development Guide](../development)**: Learn how to modify and extend the API
- **[Architecture Overview](../architecture)**: Understand how the API fits into the larger system
- **[MCP Integration](../mcp-clients)**: Connect the API to various MCP clients

Ready to start building? Check out the [Development Guide](../development) for hands-on instructions! 🚀 