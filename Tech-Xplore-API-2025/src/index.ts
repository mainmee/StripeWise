import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";

const app = new OpenAPIHono();

// Enable CORS for all domains
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// OpenAPI configuration
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Investec AI-Driven Financial & Sustainability Advisor API',
    description: 'Mock APIs for financial advisor and sustainability advisor features to demonstrate AI-driven services integration into banking activities.',
  },
  servers: [
    {
      url: 'https://your-worker-domain.workers.dev',
      description: 'Production server',
    },
    {
      url: 'http://localhost:8787',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Core APIs',
      description: 'Basic transaction, investment, and carbon tracking APIs',
    },
    {
      name: 'Financial Advisor',
      description: 'AI-driven financial advice and insights',
    },
    {
      name: 'Sustainability Advisor',
      description: 'ESG investments and sustainability guidance',
    },
  ],
});

// Swagger UI
app.get('/ui', swaggerUI({ url: '/doc' }));

// Schema definitions
const TransactionSchema = z.object({
  date: z.string().describe('Transaction date in ISO format'),
  merchant: z.string().describe('Merchant name'),
  category: z.string().describe('Transaction category'),
  amount: z.number().describe('Transaction amount in ZAR'),
  carbonImpact: z.number().describe('Carbon impact in kg CO2'),
  isRecurring: z.boolean().describe('Whether transaction is recurring'),
  merchantType: z.string().describe('Type of merchant'),
});

const TransactionSummarySchema = z.object({
  totalSpent: z.number().describe('Total amount spent'),
  totalCarbonKg: z.number().describe('Total carbon impact in kg'),
  recurringTransactions: z.number().describe('Number of recurring transactions'),
  topCategory: z.string().describe('Highest spending category'),
});

const InvestmentSchema = z.object({
  name: z.string().describe('Investment fund name'),
  riskLevel: z.string().describe('Risk level (Low, Medium, High)'),
  recommendedAmount: z.number().describe('Recommended investment amount in ZAR'),
  expectedReturn: z.string().describe('Expected return percentage range'),
  esgScore: z.number().describe('ESG score out of 100'),
  category: z.string().describe('Investment category'),
});

const AdviceSchema = z.object({
  category: z.string().describe('Advice category'),
  priority: z.string().describe('Priority level (Low, Medium, High)'),
  recommendation: z.string().describe('Specific recommendation'),
  potentialSaving: z.number().describe('Potential savings in ZAR'),
});

const GoalSchema = z.object({
  name: z.string().describe('Goal name'),
  target: z.number().describe('Target amount in ZAR'),
  current: z.number().describe('Current amount in ZAR'),
  progress: z.number().describe('Progress percentage'),
  timeToGoal: z.string().describe('Estimated time to reach goal'),
});

// Enhanced Transaction Insights API
const transactionsRoute = createRoute({
  method: 'get',
  path: '/api/transactions',
  tags: ['Core APIs'],
  summary: 'Get transaction insights',
  description: 'Retrieve enhanced transaction data with carbon impact and merchant categorization',
  responses: {
    200: {
      description: 'Transaction insights with carbon impact tracking',
      content: {
        'application/json': {
          schema: z.object({
            transactions: z.array(TransactionSchema),
            summary: TransactionSummarySchema,
          }),
        },
      },
    },
  },
});

app.openapi(transactionsRoute, (c) => {
  const response = {
    "transactions": [
      {
        "date": "2025-06-24",
        "merchant": "Coffee Shop",
        "category": "Food & Drink",
        "amount": 4.50,
        "carbonImpact": 0.2,
        "isRecurring": true,
        "merchantType": "local_business"
      },
      {
        "date": "2025-06-23",
        "merchant": "Uber",
        "category": "Transport",
        "amount": 12.00,
        "carbonImpact": 2.5,
        "isRecurring": false,
        "merchantType": "ride_sharing"
      },
      {
        "date": "2025-06-23",
        "merchant": "Woolworths",
        "category": "Groceries",
        "amount": 85.30,
        "carbonImpact": 3.2,
        "isRecurring": true,
        "merchantType": "supermarket"
      },
      {
        "date": "2025-06-22",
        "merchant": "Netflix",
        "category": "Entertainment",
        "amount": 199.00,
        "carbonImpact": 0.1,
        "isRecurring": true,
        "merchantType": "subscription"
      },
      {
        "date": "2025-06-21",
        "merchant": "Shell",
        "category": "Fuel",
        "amount": 450.00,
        "carbonImpact": 15.8,
        "isRecurring": false,
        "merchantType": "fuel_station"
      }
    ],
    "summary": {
      "totalSpent": 750.80,
      "totalCarbonKg": 21.8,
      "recurringTransactions": 3,
      "topCategory": "Fuel"
    }
  };
  return c.json(response);
});

// Enhanced Investment Suggestions API
const investmentsRoute = createRoute({
  method: 'get',
  path: '/api/investments',
  tags: ['Core APIs'],
  summary: 'Get investment suggestions',
  description: 'Retrieve personalized investment recommendations with ESG scoring',
  responses: {
    200: {
      description: 'Investment suggestions with ESG scores and expected returns',
      content: {
        'application/json': {
          schema: z.object({
            investments: z.array(InvestmentSchema),
          }),
        },
      },
    },
  },
});

app.openapi(investmentsRoute, (c) => {
  const response = {
    "investments": [
      {
        "name": "Investec ESG Fund",
        "riskLevel": "Medium",
        "recommendedAmount": 2500,
        "expectedReturn": "8-12%",
        "esgScore": 85,
        "category": "ESG Mixed Assets"
      },
      {
        "name": "Renewable Energy ETF",
        "riskLevel": "Low",
        "recommendedAmount": 1500,
        "expectedReturn": "6-9%",
        "esgScore": 92,
        "category": "Clean Energy"
      },
      {
        "name": "Investec Money Market Fund",
        "riskLevel": "Very Low",
        "recommendedAmount": 5000,
        "expectedReturn": "4-6%",
        "esgScore": 70,
        "category": "Cash Management"
      },
      {
        "name": "Global Technology Fund",
        "riskLevel": "High",
        "recommendedAmount": 1000,
        "expectedReturn": "12-18%",
        "esgScore": 65,
        "category": "Technology Growth"
      }
    ]
  };
  return c.json(response);
});

// Enhanced Carbon Footprint API
const carbonRoute = createRoute({
  method: 'get',
  path: '/api/carbon',
  tags: ['Core APIs'],
  summary: 'Get carbon footprint data',
  description: 'Retrieve carbon footprint analysis with trends and actionable tips',
  responses: {
    200: {
      description: 'Carbon footprint data with monthly trends and sustainability tips',
      content: {
        'application/json': {
          schema: z.object({
            carbonFootprintKg: z.number().describe('Current carbon footprint in kg'),
            monthlyTrend: z.array(z.object({
              month: z.string(),
              carbonKg: z.number(),
            })),
            breakdown: z.object({
              transport: z.number(),
              food: z.number(),
              utilities: z.number(),
              shopping: z.number(),
            }),
            tips: z.array(z.string()),
          }),
        },
      },
    },
  },
});

app.openapi(carbonRoute, (c) => {
  const response = {
    "carbonFootprintKg": 75,
    "monthlyTrend": [
      {"month": "Jan", "carbonKg": 82},
      {"month": "Feb", "carbonKg": 78},
      {"month": "Mar", "carbonKg": 85},
      {"month": "Apr", "carbonKg": 75},
      {"month": "May", "carbonKg": 72},
      {"month": "Jun", "carbonKg": 75}
    ],
    "breakdown": {
      "transport": 45,
      "food": 18,
      "utilities": 8,
      "shopping": 4
    },
    "tips": [
      "Use public transportation twice per week",
      "Limit fast-fashion purchases to once per month",
      "Choose local, seasonal produce when grocery shopping",
      "Consider carpooling or using electric scooters for short trips"
    ]
  };
  return c.json(response);
});

// Financial Advisor API
const financialAdviceRoute = createRoute({
  method: 'get',
  path: '/api/financial-advice',
  tags: ['Financial Advisor'],
  summary: 'Get personalized financial advice',
  description: 'AI-driven financial health analysis with personalized recommendations and goal tracking',
  responses: {
    200: {
      description: 'Comprehensive financial advice with health score and goal tracking',
      content: {
        'application/json': {
          schema: z.object({
            financialHealthScore: z.number().describe('Financial health score out of 100'),
            budgetAnalysis: z.object({
              monthlyIncome: z.number(),
              monthlyExpenses: z.number(),
              savingsRate: z.number(),
              emergencyFundMonths: z.number(),
            }),
            advice: z.array(AdviceSchema),
            goals: z.array(GoalSchema),
          }),
        },
      },
    },
  },
});

app.openapi(financialAdviceRoute, (c) => {
  const response = {
    "financialHealthScore": 72,
    "budgetAnalysis": {
      "monthlyIncome": 25000,
      "monthlyExpenses": 18500,
      "savingsRate": 26,
      "emergencyFundMonths": 3.2
    },
    "advice": [
      {
        "category": "Budgeting",
        "priority": "High",
        "recommendation": "Reduce dining out expenses by 20% to increase savings",
        "potentialSaving": 800
      },
      {
        "category": "Investment",
        "priority": "Medium",
        "recommendation": "Consider increasing retirement contributions by 2%",
        "potentialSaving": 500
      },
      {
        "category": "Debt",
        "priority": "Low",
        "recommendation": "Your debt-to-income ratio is healthy at 15%",
        "potentialSaving": 0
      }
    ],
    "goals": [
      {
        "name": "Emergency Fund",
        "target": 75000,
        "current": 45000,
        "progress": 60,
        "timeToGoal": "8 months"
      },
      {
        "name": "House Deposit",
        "target": 200000,
        "current": 85000,
        "progress": 42,
        "timeToGoal": "2.5 years"
      }
    ]
  };
  return c.json(response);
});

// Spending Insights API
const spendingInsightsRoute = createRoute({
  method: 'get',
  path: '/api/spending-insights',
  tags: ['Financial Advisor'],
  summary: 'Get spending insights',
  description: 'Detailed spending analysis with trends, insights, and upcoming bills',
  responses: {
    200: {
      description: 'Comprehensive spending analysis with proactive insights',
      content: {
        'application/json': {
          schema: z.object({
            monthlySpending: z.object({
              current: z.number(),
              previous: z.number(),
              change: z.number(),
            }),
            categoryBreakdown: z.array(z.object({
              category: z.string(),
              amount: z.number(),
              percentage: z.number(),
              trend: z.string(),
            })),
            insights: z.array(z.object({
              type: z.string(),
              message: z.string(),
              suggestion: z.string(),
            })),
            upcomingBills: z.array(z.object({
              merchant: z.string(),
              amount: z.number(),
              dueDate: z.string(),
            })),
          }),
        },
      },
    },
  },
});

app.openapi(spendingInsightsRoute, (c) => {
  const response = {
    "monthlySpending": {
      "current": 18500,
      "previous": 19200,
      "change": -3.6
    },
    "categoryBreakdown": [
      {"category": "Groceries", "amount": 3200, "percentage": 17.3, "trend": "up"},
      {"category": "Transport", "amount": 2800, "percentage": 15.1, "trend": "down"},
      {"category": "Entertainment", "amount": 2100, "percentage": 11.4, "trend": "stable"},
      {"category": "Utilities", "amount": 1800, "percentage": 9.7, "trend": "up"},
      {"category": "Dining Out", "amount": 1600, "percentage": 8.6, "trend": "up"}
    ],
    "insights": [
      {
        "type": "warning",
        "message": "Your dining out spending increased by 15% this month",
        "suggestion": "Consider meal planning to reduce restaurant visits"
      },
      {
        "type": "positive",
        "message": "Great job reducing transport costs by using public transport",
        "suggestion": "Keep up the sustainable commuting habits"
      }
    ],
    "upcomingBills": [
      {"merchant": "Insurance", "amount": 1200, "dueDate": "2025-07-01"},
      {"merchant": "Internet", "amount": 599, "dueDate": "2025-07-03"}
    ]
  };
  return c.json(response);
});

// ESG Investments API
const esgInvestmentsRoute = createRoute({
  method: 'get',
  path: '/api/esg-investments',
  tags: ['Sustainability Advisor'],
  summary: 'Get ESG investment recommendations',
  description: 'Sustainable investment suggestions with impact descriptions and ESG scoring',
  responses: {
    200: {
      description: 'ESG-focused investment recommendations with impact analysis',
      content: {
        'application/json': {
          schema: z.object({
            esgPortfolioScore: z.number().describe('Current ESG portfolio score'),
            recommendations: z.array(z.object({
              name: z.string(),
              esgScore: z.number(),
              impactArea: z.string(),
              riskLevel: z.string(),
              recommendedAmount: z.number(),
              expectedReturn: z.string(),
              impactDescription: z.string(),
            })),
            currentHoldings: z.array(z.object({
              name: z.string(),
              value: z.number(),
              esgScore: z.number(),
              performance: z.string(),
            })),
          }),
        },
      },
    },
  },
});

app.openapi(esgInvestmentsRoute, (c) => {
  const response = {
    "esgPortfolioScore": 78,
    "recommendations": [
      {
        "name": "African Infrastructure Bond",
        "esgScore": 88,
        "impactArea": "Infrastructure Development",
        "riskLevel": "Medium",
        "recommendedAmount": 3000,
        "expectedReturn": "7-10%",
        "impactDescription": "Supports sustainable infrastructure development across Africa"
      },
      {
        "name": "Water Sustainability Fund",
        "esgScore": 94,
        "impactArea": "Water Conservation",
        "riskLevel": "Low",
        "recommendedAmount": 2000,
        "expectedReturn": "5-8%",
        "impactDescription": "Invests in companies solving global water challenges"
      },
      {
        "name": "Green Building REIT",
        "esgScore": 86,
        "impactArea": "Sustainable Real Estate",
        "riskLevel": "Medium",
        "recommendedAmount": 2500,
        "expectedReturn": "6-9%",
        "impactDescription": "Focuses on energy-efficient and sustainable buildings"
      }
    ],
    "currentHoldings": [
      {
        "name": "Investec ESG Fund",
        "value": 8500,
        "esgScore": 85,
        "performance": "+12.3%"
      }
    ]
  };
  return c.json(response);
});

// Sustainability Tips API
const sustainabilityTipsRoute = createRoute({
  method: 'get',
  path: '/api/sustainability-tips',
  tags: ['Sustainability Advisor'],
  summary: 'Get sustainability tips',
  description: 'Weekly sustainability tips, green merchant recommendations, and achievements',
  responses: {
    200: {
      description: 'Personalized sustainability guidance with actionable tips',
      content: {
        'application/json': {
          schema: z.object({
            sustainabilityScore: z.number().describe('Current sustainability score'),
            weeklyTips: z.array(z.object({
              category: z.string(),
              tip: z.string(),
              carbonSaving: z.number(),
              moneySaving: z.number(),
            })),
            greenMerchants: z.array(z.object({
              name: z.string(),
              category: z.string(),
              discount: z.string(),
              carbonBenefit: z.string(),
            })),
            achievements: z.array(z.object({
              title: z.string(),
              description: z.string(),
              carbonSaved: z.number(),
              dateEarned: z.string(),
            })),
          }),
        },
      },
    },
  },
});

app.openapi(sustainabilityTipsRoute, (c) => {
  const response = {
    "sustainabilityScore": 68,
    "weeklyTips": [
      {
        "category": "Transport",
        "tip": "Try cycling to work twice this week",
        "carbonSaving": 4.2,
        "moneySaving": 45
      },
      {
        "category": "Shopping",
        "tip": "Buy organic produce from local farmers markets",
        "carbonSaving": 1.8,
        "moneySaving": 0
      },
      {
        "category": "Energy",
        "tip": "Switch to LED bulbs in your home",
        "carbonSaving": 2.5,
        "moneySaving": 150
      }
    ],
    "greenMerchants": [
      {
        "name": "Faithful to Nature",
        "category": "Eco-friendly Products",
        "discount": "10% off first order",
        "carbonBenefit": "Carbon-neutral shipping"
      },
      {
        "name": "Uber Green",
        "category": "Transport",
        "discount": "15% off hybrid rides",
        "carbonBenefit": "50% lower emissions"
      }
    ],
    "achievements": [
      {
        "title": "Green Commuter",
        "description": "Used public transport 5 times this week",
        "carbonSaved": 8.5,
        "dateEarned": "2025-06-20"
      }
    ]
  };
  return c.json(response);
});

// Personalized Recommendations API
const recommendationsRoute = createRoute({
  method: 'get',
  path: '/api/recommendations',
  tags: ['Financial Advisor', 'Sustainability Advisor'],
  summary: 'Get personalized recommendations',
  description: 'Combined financial and sustainability recommendations with priority levels',
  responses: {
    200: {
      description: 'Personalized recommendations across financial and sustainability domains',
      content: {
        'application/json': {
          schema: z.object({
            financial: z.array(z.object({
              type: z.string(),
              title: z.string(),
              description: z.string(),
              action: z.string(),
              potentialSaving: z.number(),
              priority: z.string(),
            })),
            sustainability: z.array(z.object({
              type: z.string(),
              title: z.string(),
              description: z.string(),
              action: z.string(),
              carbonSaving: z.number(),
              moneySaving: z.number(),
              priority: z.string(),
            })),
          }),
        },
      },
    },
  },
});

app.openapi(recommendationsRoute, (c) => {
  const response = {
    "financial": [
      {
        "type": "saving",
        "title": "Optimize Subscription Spending",
        "description": "You have 3 unused subscriptions costing R597/month",
        "action": "Cancel Netflix, Spotify Premium, and Adobe Creative",
        "potentialSaving": 597,
        "priority": "High"
      },
      {
        "type": "investment",
        "title": "Increase Tax-Free Savings",
        "description": "You've only used 45% of your annual tax-free allowance",
        "action": "Increase monthly contribution to R2,500",
        "potentialSaving": 1200,
        "priority": "Medium"
      }
    ],
    "sustainability": [
      {
        "type": "transport",
        "title": "Green Transport Challenge",
        "description": "Switch to public transport 3 days per week",
        "action": "Use MyCiTi or Gautrain for daily commute",
        "carbonSaving": 12.5,
        "moneySaving": 450,
        "priority": "High"
      },
      {
        "type": "shopping",
        "title": "Sustainable Shopping",
        "description": "Choose eco-friendly alternatives for household items",
        "action": "Shop at green retailers with carbon-neutral delivery",
        "carbonSaving": 3.2,
        "moneySaving": 0,
        "priority": "Medium"
      }
    ]
  };
  return c.json(response);
});

// Enhanced Health check endpoint
const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Core APIs'],
  summary: 'API Health Check',
  description: 'Get API information and available endpoints',
  responses: {
    200: {
      description: 'API health check with endpoint listing',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            description: z.string(),
            endpoints: z.object({
              core: z.array(z.string()),
              financial_advisor: z.array(z.string()),
              sustainability_advisor: z.array(z.string()),
            }),
          }),
        },
      },
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({
    "message": "Investec AI-Driven Financial & Sustainability Advisor API",
    "description": "Mock APIs for financial advisor and sustainability advisor features",
    "endpoints": {
      "core": [
        "/api/transactions",
        "/api/investments",
        "/api/carbon"
      ],
      "financial_advisor": [
        "/api/financial-advice",
        "/api/spending-insights",
        "/api/recommendations"
      ],
      "sustainability_advisor": [
        "/api/esg-investments",
        "/api/sustainability-tips",
        "/api/recommendations"
      ]
    }
  });
});

export default app;
