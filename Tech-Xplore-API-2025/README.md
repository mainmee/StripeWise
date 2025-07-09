# Investec AI-Driven Financial & Sustainability Advisor API

Mock API template for financial advisor and sustainability advisor features using Cloudflare Workers and Hono framework.

## Setup

```txt
npm install
npm run dev
```

## API Documentation

The API includes comprehensive Swagger/OpenAPI documentation:

- **Swagger UI**: Visit `/ui` to interact with the API through a web interface
- **OpenAPI Spec**: Available at `/doc` for programmatic access
- **Interactive Testing**: Test all endpoints directly from the Swagger UI

### Accessing the Swagger UI

To access the interactive Swagger documentation, you need to append `/ui` to your base URL:

#### Local Development
```
http://localhost:8787/ui
```

#### Production (After Deployment)
```
https://your-actual-worker-url.workers.dev/ui
```

**Examples:**
- If your deployed Worker URL is `https://tech-xplore-api.my-subdomain.workers.dev`, then access Swagger at:
  ```
  https://tech-xplore-api.my-subdomain.workers.dev/ui
  ```
- For local development, always use:
  ```
  http://localhost:8787/ui
  ```

**Note**: Make sure your Worker is running (locally with `npm run dev` or deployed) before trying to access the Swagger UI.

### Documentation Features

- **Comprehensive Schemas**: All request/response structures are fully documented
- **Tag-based Organization**: APIs are grouped by functionality (Core APIs, Financial Advisor, Sustainability Advisor)
- **Type Safety**: Zod schemas ensure runtime validation and TypeScript type inference
- **Examples**: All responses include realistic mock data examples

## Deployment

```txt
npm run deploy
```

### Post-Deployment Configuration

After successfully deploying your Worker, you need to update the production server URL in your OpenAPI configuration:

1. **Find your deployed Worker URL**: After deployment, Cloudflare will provide you with a URL like `https://your-project-name.your-subdomain.workers.dev`

2. **Update the production server URL** in `src/index.ts`:
   ```ts
   servers: [
     {
       url: 'https://your-actual-worker-url.workers.dev', // Replace with your deployed URL
       description: 'Production server',
     },
     // ... other servers
   ],
   ```

3. **Why this is important**: 
   - The Swagger UI uses this URL to make actual API calls when users test endpoints
   - Without the correct URL, the "Try it out" functionality in `/ui` won't work
   - External API clients and integrations will need the correct base URL for API calls
   - This ensures your OpenAPI documentation accurately reflects your live API endpoints

## Type Generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

## Available APIs

### Core APIs
- `/api/transactions` - Enhanced transaction insights with carbon impact
- `/api/investments` - Investment suggestions with ESG scoring
- `/api/carbon` - Carbon footprint tracking and tips

### Financial Advisor APIs
- `/api/financial-advice` - Personalized financial health analysis
- `/api/spending-insights` - Detailed spending analysis and insights
- `/api/recommendations` - Combined financial and sustainability recommendations

### Sustainability Advisor APIs
- `/api/esg-investments` - ESG-focused investment recommendations
- `/api/sustainability-tips` - Weekly sustainability tips and challenges

### Documentation Endpoints
- `/` - API health check and endpoint listing
- `/ui` - Swagger UI for interactive API exploration
- `/doc` - OpenAPI specification (JSON)

## Adding New Mock Data and APIs

### 1. Adding New OpenAPI Endpoints

To add a new API endpoint with full OpenAPI documentation:

```ts
// 1. Define the route schema
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
            // Add more fields as needed
          }),
        },
      },
    },
  },
});

// 2. Implement the route handler
app.openapi(newRoute, (c) => {
  const response = {
    data: "your mock data"
  };
  return c.json(response);
});
```

### 2. Adding Zod Schemas

Define reusable schemas for complex data structures:

```ts
const YourSchema = z.object({
  id: z.string().describe('Unique identifier'),
  name: z.string().describe('Name field'),
  amount: z.number().describe('Amount in ZAR'),
  isActive: z.boolean().describe('Active status'),
});

// Use in route definitions
schema: z.object({
  items: z.array(YourSchema),
  total: z.number(),
})
```

### 3. Mock Data Best Practices

#### OpenAPI Documentation
- **Clear Descriptions**: Use `.describe()` for all schema fields
- **Proper Tags**: Group related endpoints with meaningful tags
- **Response Examples**: Provide comprehensive examples in responses
- **Type Safety**: Use Zod schemas for runtime validation

#### Realistic Data Generation
- Use actual South African merchant names (Woolworths, Pick n Pay, Uber, etc.)
- Include realistic amounts in South African Rand (R)
- Use proper date formats (ISO 8601: `2025-06-24`)
- Include variety in categories and types

#### Data Relationships
- Ensure related data is consistent across endpoints
- Link transactions to carbon footprint calculations
- Connect spending categories to investment recommendations

#### Example Mock Data Structure
```ts
const mockTransactions = [
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
];
```

## Tips for Business Analysts and Developers

### 🎯 Business Case Enhancement

#### 1. **User Journey Mapping**
- **Consider**: How does each API fit into the user's daily financial routine?
- **Action**: Map APIs to specific user moments (morning coffee purchase → sustainability tip)
- **Example**: Link transaction categorization to personalized investment suggestions

#### 2. **Data Storytelling**
- **Consider**: What story does your data tell about the user's financial health?
- **Action**: Create narrative connections between different data points
- **Example**: High transport costs → ESG transport investments + cycling tips

#### 3. **Behavioral Insights**
- **Consider**: What behaviors can you encourage through your API responses?
- **Action**: Include actionable insights with quantified benefits
- **Example**: "Reducing dining out by 20% could save R800/month and fund your emergency goal"

### 💡 Technical Implementation

#### 1. **API Design Principles**
- **Consistency**: Use consistent naming conventions across all endpoints
- **Documentation**: Leverage OpenAPI for comprehensive API documentation
- **Type Safety**: Use Zod schemas for runtime validation and TypeScript inference
- **Extensibility**: Design data structures that can grow with business needs

```ts
// Good OpenAPI Response Structure
const ResponseSchema = z.object({
  data: z.object({
    // main response data
  }).describe('Main response data'),
  metadata: z.object({
    version: z.string().describe('API version'),
    timestamp: z.string().describe('Response timestamp'),
    source: z.string().describe('Data source'),
  }).describe('Response metadata'),
  links: z.object({
    related: z.array(z.string()).describe('Related endpoints'),
    actions: z.array(z.string()).describe('Available actions'),
  }).optional().describe('Related links'),
});
```

#### 2. **Data Relationships**
- **Financial Health Score**: Aggregate data from multiple endpoints
- **Cross-API Insights**: Use transaction data to inform investment suggestions
- **Temporal Patterns**: Show trends over time for better decision-making

#### 3. **South African Context**
- **Currency**: Always use South African Rand (R) in amounts
- **Merchants**: Include recognizable local businesses
- **Regulations**: Consider local financial regulations (tax-free savings limits)
- **Geography**: Include relevant location data (cities, transport systems)

### 📊 Data Quality Considerations

#### 1. **Realistic Scenarios**
- **Young Professional Profile**: R15,000 - R35,000 monthly income
- **Spending Patterns**: 30% housing, 20% transport, 15% food, 10% entertainment
- **Investment Capacity**: 10-20% of income for investments

#### 2. **Seasonal Variations**
- **Holiday Spending**: December/January increased spending
- **Tax Season**: February/March tax-related activities
- **Bonus Periods**: Mid-year and year-end bonus impacts

#### 3. **ESG Integration**
- **Carbon Tracking**: Link every transaction to carbon impact
- **ESG Scoring**: Rate investments and merchants on ESG criteria
- **Sustainability Goals**: Connect financial goals to environmental impact

### 🚀 Advanced Features to Consider

#### 1. **Personalization Engine**
- Risk tolerance assessment
- Life stage considerations (student, professional, family, retirement)
- Goal-based financial planning

#### 2. **Predictive Analytics**
- Spending forecasting
- Investment performance predictions
- Carbon footprint projections

#### 3. **Gamification Elements**
- Achievement systems
- Challenges and rewards
- Social comparison features

#### 4. **Integration Opportunities**
- Banking transaction feeds
- Investment platform connections
- Carbon offset marketplaces

### 📈 Business Impact Metrics

When adding new APIs, consider tracking:
- **User Engagement**: API usage frequency and patterns
- **Financial Health**: Changes in savings rates and investment adoption
- **Sustainability Impact**: Carbon footprint reduction trends
- **Goal Achievement**: Progress toward financial and environmental goals

### 🔄 Iteration and Improvement

1. **Start Simple**: Begin with basic mock data and gradually add complexity
2. **User Feedback**: Design APIs that can capture user preferences and feedback
3. **A/B Testing**: Structure responses to support different recommendation strategies
4. **Performance**: Keep response payloads reasonable for mobile usage
5. **Documentation**: Keep OpenAPI schemas updated as APIs evolve

Remember: The goal is to create compelling mock data that demonstrates the value proposition of AI-driven financial and sustainability advice, making it easy for stakeholders to envision the final product's impact on users' financial wellbeing and environmental consciousness.
