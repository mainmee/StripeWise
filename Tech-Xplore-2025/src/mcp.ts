// Heads up: From a backend perspective, this is the file you will likely edit the most
// In this file there are tools that the MCP server will expose to the Chat Agent

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from "cloudflare:workers";
import { generateText, type LanguageModelV1 } from "ai";
import { createAzure } from "@ai-sdk/azure";
import { openai } from "@ai-sdk/openai";
import { getModel } from "./utils";

// To use Cloudflare Worker AI, uncomment the below
// import { createWorkersAI } from 'workers-ai-provider';
// const workersai = createWorkersAI({ binding: env.AI });
// const model = workersai("@cf/meta/llama-3-8b-instruct")

// Based on value of `env.MODEL_PROVIDER`, we will either use Azure or OpenAI as the model provider.
let model : LanguageModelV1 | undefined = undefined;
if (env.MODEL_PROVIDER == "azure") {
  const azure = createAzure({
    resourceName: env.AI_AZURE_RESOURCE_NAME, // Azure resource name
    apiKey: env.AI_AZURE_API_KEY, // Azure API key
  });
  model = azure(env.AI_AZURE_MODEL_DEPLOYMENT);
}
else
{
  // This uses the OPENAI_API_KEY environment variable/secret by default
  if (env.OPENAI_API_MODEL && env.OPENAI_API_KEY) {
    model = openai(env.OPENAI_API_MODEL);
  } else {
    console.warn('⚠️ OpenAI API key or model not configured properly');
  }
}

// Utility function for making API calls
const callBackendAPI = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
	// Use the correct API URL from Wrangler output
	const apiBaseUrl = env.IS_LOCAL ? 'http://127.0.0.1:8787' : env.API_BASE_URL || 'https://your-api-worker.workers.dev';
	
	console.log(`🔌 Making API call to: ${apiBaseUrl}${endpoint}`);
	console.log(`📤 Method: ${method}`, body ? `Body: ${JSON.stringify(body)}` : 'No body');
	
	const response = await fetch(`${apiBaseUrl}${endpoint}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
		},
		...(body && { body: JSON.stringify(body) })
	});

	console.log(`📥 API Response: ${response.status} ${response.statusText}`);

	if (!response.ok) {
		throw new Error(`API call failed: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	console.log(`✅ API Success:`, data);
	return data;
};

export class MyMCP extends McpAgent {
	// @ts-ignore
	server = new McpServer({
		name: "Starter",
		version: "1.0.0",
	});

	async init() {
		// Financial Coaching Tools for Investec Challenge

		this.server.tool(
			"analyzeSpendingPatterns",
			"Analyze user's spending patterns and provide insights",
			{
				userId: z.string(),
				monthlyIncome: z.number().optional(),
				expenses: z.array(z.object({
					category: z.string(),
					amount: z.number(),
					description: z.string().optional()
				})).optional()
			},
			async ({ userId, monthlyIncome, expenses }) => {
				try {
					// Call the backend API for spending insights (GET request)
					// Convert parameters to query string for GET request
					const queryParams = new URLSearchParams();
					if (userId) queryParams.append('userId', userId);
					if (monthlyIncome) queryParams.append('monthlyIncome', monthlyIncome.toString());
					if (expenses) queryParams.append('expenses', JSON.stringify(expenses));
					
					const endpoint = `/api/spending-insights${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
					const response = await callBackendAPI(endpoint, 'GET');

					return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
				} catch (error) {
					console.error('Error calling spending insights API:', error);
					// Fallback to mock data if API fails
					const mockAnalysis = {
						totalSpending: 15000,
						topCategories: ["Groceries: R3,500", "Entertainment: R2,800", "Transport: R2,200"],
						savingsRate: monthlyIncome ? ((monthlyIncome - 15000) / monthlyIncome * 100).toFixed(1) : "25.0",
						recommendations: [
							"Consider reducing entertainment spending by 15%",
							"Look into bulk buying for groceries to save 10%",
							"Consider carpooling or public transport to reduce transport costs"
						]
					};
					return { content: [{ type: "text", text: `API unavailable, using mock data: ${JSON.stringify(mockAnalysis, null, 2)}` }] };
				}
			}
		);

		this.server.tool(
			"generateBudgetPlan",
			"Create a personalized Investec budget plan for young professionals based on income and goals",
			{
				monthlyIncome: z.number(),
				financialGoals: z.array(z.string()),
				currentAge: z.number().optional(),
				retirementAge: z.number().optional()
			},
			async ({ monthlyIncome, financialGoals, currentAge, retirementAge }) => {
				const isYoungProfessional = currentAge && currentAge < 30;
				const investecContext = isYoungProfessional ? 
					`This person qualifies for Investec's Young Professional benefits including: reduced R320 monthly account fee, innovative home loan with 2-year interest-only payments, vehicle finance at prime -1%, R25,000 complimentary life insurance, tax-free unit trusts with R1,000 monthly debit orders, and no-fee savings accounts.` :
					`This person should consider Investec's full Private Banking suite and wealth management services.`;
				
				const result = await generateText({
					model: getModel(model),
					system: `You are an expert Investec Private Banking financial advisor specializing in creating personalized budget plans for professionals in South Africa. ${investecContext} Provide practical, actionable advice that leverages Investec's specific products and benefits.`,
					messages: [
						{
							role: "user",
							content: `Create a detailed Investec-focused budget plan for someone with monthly income of R${monthlyIncome}. Their financial goals are: ${financialGoals.join(', ')}. ${currentAge ? `They are ${currentAge} years old` : ''} ${retirementAge ? `and want to retire at ${retirementAge}` : ''}. Include specific rand amounts, percentages, and recommend appropriate Investec products. ${isYoungProfessional ? 'Emphasize young professional benefits and how to maximize them.' : 'Focus on wealth optimization strategies.'}`
						}
					],
				});
				return { content: [{ type: "text", text: result.text }] };
			}
		);

		this.server.tool(
			"getInvestmentRecommendations",
			"Provide personalized Investec investment recommendations for young professionals based on risk profile and goals",
			{
				riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
				investmentAmount: z.number(),
				timeHorizon: z.number(), // years
				investmentGoals: z.array(z.string()),
				age: z.number().optional()
			},
			async ({ riskTolerance, investmentAmount, timeHorizon, investmentGoals, age }) => {
				const isYoungProfessional = age && age < 30;
				
				const investecRecommendations = {
					riskProfile: riskTolerance,
					youngProfessionalBenefits: isYoungProfessional ? {
						reducedAccountFee: "R320/month until age 30 (normally higher)",
						taxFreeInvestments: "R1,000 monthly debit order for tax-free unit trusts",
						noMinimumTrading: "No minimum requirement for online share trading",
						lifeInsurance: "R25,000 complimentary life insurance from Investec Life"
					} : null,
					recommendedInvestecProducts: {
						"Tax-Free Unit Trusts": {
							allocation: "R1,000/month recommended",
							benefit: "Tax-free growth - perfect for young professionals",
							localOffshore: "Both local and offshore options available"
						},
						"Online Share Trading": {
							allocation: riskTolerance === "aggressive" ? "30%" : riskTolerance === "moderate" ? "20%" : "10%",
							benefit: "No minimum requirements, start small and grow",
							products: ["JSE shares", "International shares", "ETFs"]
						},
						"Investec Savings Accounts": {
							allocation: "Emergency fund + short-term goals",
							types: ["Instant access", "Notice deposits", "Fixed deposits"],
							benefit: "No monthly fees, R1,000 minimum deposit"
						}
					},
					projectedReturns: `Expected annual return: ${riskTolerance === "aggressive" ? "12-15%" : riskTolerance === "moderate" ? "8-12%" : "6-9%"}`,
					youngProfessionalAdvice: isYoungProfessional ? [
						"Start with tax-free investments - R36,000 annual limit",
						"Use the reduced R320 account fee benefit while under 30",
						"Consider the innovative home loan with 2-year interest-only payments",
						"Take advantage of vehicle finance at prime -1%"
					] : [
						"Focus on long-term wealth building",
						"Consider upgrading to full private banking benefits",
						"Explore offshore investment opportunities"
					]
				};
				
				return { content: [{ type: "text", text: JSON.stringify(investecRecommendations, null, 2) }] };
			}
		);

		this.server.tool(
			"trackFinancialGoals",
			"Track progress towards financial goals and provide motivation",
			{
				goalType: z.enum(["emergency_fund", "house_deposit", "retirement", "vacation", "debt_payoff", "other"]),
				targetAmount: z.number(),
				currentAmount: z.number(),
				monthlyContribution: z.number()
			},
			async ({ goalType, targetAmount, currentAmount, monthlyContribution }) => {
				const remaining = targetAmount - currentAmount;
				const monthsToGoal = Math.ceil(remaining / monthlyContribution);
				const progressPercentage = ((currentAmount / targetAmount) * 100).toFixed(1);
				
				const result = await generateText({
					model: getModel(model),
					system: "You are a motivational financial coach. Provide encouraging and practical advice for reaching financial goals.",
					messages: [
						{
							role: "user",
							content: `A user is saving for ${goalType.replace('_', ' ')}. Target: R${targetAmount}, Current: R${currentAmount} (${progressPercentage}% complete), Monthly contribution: R${monthlyContribution}. They need R${remaining} more and will reach their goal in ${monthsToGoal} months. Provide encouraging feedback and tips to stay on track.`
						}
					],
				});
				return { content: [{ type: "text", text: result.text }] };
			}
		);

		this.server.tool(
			"getPersonalizedFinancialTips",
			"Get daily personalized Investec financial tips based on young professional profile",
			{
				userProfile: z.object({
					age: z.number(),
					profession: z.string().optional(),
					monthlyIncome: z.number(),
					mainFinancialChallenges: z.array(z.string())
				})
			},
			async ({ userProfile }) => {
				const isYoungProfessional = userProfile.age < 30;
				const investecContext = isYoungProfessional ? 
					`This client qualifies for Investec Young Professional benefits. Focus on how they can maximize: R320 reduced account fee, innovative home loans, prime -1% vehicle finance, R25,000 life insurance, tax-free investments, and no-fee savings accounts.` :
					`This client should explore Investec's full Private Banking suite for wealth optimization.`;
				
				const result = await generateText({
					model: getModel(model),
					system: `You are an Investec Private Banking financial wellness coach for South African professionals. ${investecContext} Provide practical, culturally relevant financial tips that specifically leverage Investec's products and services.`,
					messages: [
						{
							role: "user",
							content: `Provide 3 personalized Investec-focused financial tips for a ${userProfile.age}-year-old ${userProfile.profession || 'professional'} earning R${userProfile.monthlyIncome} per month. Their main challenges are: ${userProfile.mainFinancialChallenges.join(', ')}. Make tips specific and actionable for the South African context, highlighting relevant Investec products and benefits they should utilize.`
						}
					],
				});
				return { content: [{ type: "text", text: result.text }] };
			}
		);

		this.server.tool(
			"getFinancialAdvice",
			"Get comprehensive financial advice and health analysis from the backend API. Use timeframe: week, month, quarter, or year only.",
			{
				userId: z.string(),
				timeframe: z.enum(["week", "month", "quarter", "year"]).optional().default("month")
			},
			async ({ userId, timeframe }) => {
				try {
					// Call the backend API for financial advice
					const response = await callBackendAPI('/api/financial-advice', 'GET');

					// Format the response for better readability (using type assertion for API response)
					const apiData = response as {
						financialHealthScore: number;
						budgetAnalysis: any;
						advice: any[];
						goals: any[];
					};
					
					const formattedResponse = {
						financialHealthScore: apiData.financialHealthScore,
						budgetAnalysis: apiData.budgetAnalysis,
						personalizedAdvice: apiData.advice,
						goals: apiData.goals
					};
					
					return { content: [{ type: "text", text: JSON.stringify(formattedResponse, null, 2) }] };
				} catch (error) {
					console.error('Error calling financial advice API:', error);
					return { content: [{ type: "text", text: `Unable to fetch financial advice: ${(error as Error).message}` }] };
				}
			}
		);

		this.server.tool(
			"getTransactions",
			"Retrieve user's transaction history from the backend API",
			{
				userId: z.string(),
				timeframe: z.enum(["week", "month", "quarter", "year"]).optional().default("month")
			},
			async ({ userId, timeframe }) => {
				try {
					const transactions = await callBackendAPI('/api/transactions', 'POST', { userId, timeframe });
					return { content: [{ type: "text", text: JSON.stringify(transactions, null, 2) }] };
				} catch (error) {
					console.error('Error calling transactions API:', error);
					return { content: [{ type: "text", text: `Unable to fetch transactions: ${(error as Error).message}` }] };
				}
			}
		);

		this.server.tool(
			"getESGInvestments",
			"Get ESG (Environmental, Social, Governance) investment recommendations",
			{
				investmentAmount: z.number().optional(),
				riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional()
			},
			async ({ investmentAmount, riskProfile }) => {
				try {
					const esgData = await callBackendAPI('/api/esg-investments');
					return { content: [{ type: "text", text: JSON.stringify(esgData, null, 2) }] };
				} catch (error) {
					console.error('Error calling ESG investments API:', error);
					return { content: [{ type: "text", text: `Unable to fetch ESG investments: ${(error as Error).message}` }] };
				}
			}
		);

		this.server.tool(
			"getCarbonFootprint",
			"Analyze user's carbon footprint based on their transactions",
			{
				userId: z.string(),
				timeframe: z.enum(["week", "month", "quarter", "year"]).optional().default("month")
			},
			async ({ userId, timeframe }) => {
				try {
					const carbonData = await callBackendAPI('/api/carbon', 'POST', { userId, timeframe });
					return { content: [{ type: "text", text: JSON.stringify(carbonData, null, 2) }] };
				} catch (error) {
					console.error('Error calling carbon footprint API:', error);
					return { content: [{ type: "text", text: `Unable to fetch carbon footprint data: ${(error as Error).message}` }] };
				}
			}
		);

		this.server.tool(
			"getSustainabilityTips",
			"Get personalized sustainability tips and recommendations",
			{
				userProfile: z.object({
					location: z.string().optional(),
					lifestyle: z.enum(["urban", "suburban", "rural"]).optional(),
					interests: z.array(z.string()).optional()
				}).optional()
			},
			async ({ userProfile }) => {
				try {
					const sustainabilityTips = await callBackendAPI('/api/sustainability-tips');
					return { content: [{ type: "text", text: JSON.stringify(sustainabilityTips, null, 2) }] };
				} catch (error) {
					console.error('Error calling sustainability tips API:', error);
					return { content: [{ type: "text", text: `Unable to fetch sustainability tips: ${(error as Error).message}` }] };
				}
			}
		);

		// Health check tool to test API connection
		this.server.tool(
			"testAPIConnection",
			"Test if the backend API is connected and responding",
			{},
			async () => {
				try {
					console.log("🏥 Testing API connection...");
					// The health endpoint is at the root path, not /api/health
					const health = await callBackendAPI('/', 'GET');
					return { 
						content: [{ 
							type: "text", 
							text: `✅ API Connection Successful!\n\nResponse: ${JSON.stringify(health, null, 2)}` 
						}] 
					};
				} catch (error) {
					console.error('❌ API connection failed:', error);
					return { 
						content: [{ 
							type: "text", 
							text: `❌ API Connection Failed!\n\nError: ${(error as Error).message}\n\nPlease check:\n1. Is the API running on http://127.0.0.1:8787?\n2. Try visiting http://127.0.0.1:8787/ui in your browser\n3. Check the console logs for more details` 
						}] 
					};
				}
			}
		);

		// Investec Young Professional Specific Tools

		this.server.tool(
			"getInvestecAccountBenefits",
			"Get personalized Investec Private Banking benefits for young professionals",
			{
				age: z.number(),
				monthlyIncome: z.number().optional(),
				currentAccount: z.enum(["none", "basic", "standard", "premium", "private_banking", "other"]).optional()
			},
			async ({ age, monthlyIncome, currentAccount }) => {
				const isYoungProfessional = age < 30;
				const hasPrivateBanking = currentAccount === "private_banking";
				
				const benefits = {
					youngProfessionalStatus: isYoungProfessional,
					currentAccountStatus: currentAccount || "not_specified",
					accountBenefits: isYoungProfessional ? {
						monthlyFee: "R320 (reduced rate until age 30)",
						immediateOpening: "Open account immediately, pay fees when salary comes in",
						oneCard: "One Investec Visa card - credit + transactional functionality",
						privateBankingAccess: "Full Private Banking experience at reduced cost"
					} : {
						monthlyFee: "Standard Private Banking rates apply",
						premiumBenefits: "Full Private Banking suite available"
					},
					upgradeOpportunity: !hasPrivateBanking && isYoungProfessional ? {
						from: currentAccount || "current_account",
						to: "Investec Private Banking (Young Professional)",
						savings: "Significant savings compared to standard Private Banking rates",
						benefits: "Access to exclusive young professional benefits"
					} : null,
					eligibilityCheck: {
						age: age < 30 ? "✅ Qualifies for young professional rates" : "❌ Over 30 - standard rates apply",
						income: monthlyIncome ? (monthlyIncome >= 15000 ? "✅ Income sufficient for Private Banking" : "⚠️ Consider building income first") : "Income not specified",
						currentBanking: hasPrivateBanking ? "✅ Already has Private Banking" : "💡 Could benefit from upgrading to Private Banking"
					},
					nextSteps: isYoungProfessional ? [
						"Book consultation with dedicated financial adviser",
						"Apply for One Investec Visa card",
						"Set up R25,000 complimentary life insurance",
						"Consider vehicle finance at prime -1%"
					] : [
						"Explore standard Private Banking options",
						"Discuss wealth management strategies",
						"Review investment portfolio optimization"
					]
				};
				
				return { content: [{ type: "text", text: JSON.stringify(benefits, null, 2) }] };
			}
		);

		this.server.tool(
			"getInvestecLoanOptions",
			"Get Investec loan options for young professionals including innovative home loans and vehicle finance",
			{
				loanType: z.enum(["home", "vehicle", "both"]),
				age: z.number(),
				purchaseAmount: z.number().optional(),
				deposit: z.number().optional()
			},
			async ({ loanType, age, purchaseAmount, deposit }) => {
				const isYoungProfessional = age < 30;
				const loanOptions = {
					youngProfessionalStatus: isYoungProfessional,
					homeLoanOptions: (loanType === "home" || loanType === "both") ? {
						innovativeHomeLoan: {
							available: isYoungProfessional,
							feature: "Interest-only payments for first 2 years",
							terms: "Up to 30 years",
							benefit: "Lower initial payments while building career",
							earlySettlement: "No early settlement fees"
						},
						standardHomeLoan: {
							available: true,
							features: ["Flexible repayment terms", "No early settlement fees", "Competitive rates"],
							suitability: isYoungProfessional ? "Also available as alternative" : "Primary option"
						}
					} : null,
					vehicleFinanceOptions: (loanType === "vehicle" || loanType === "both") ? {
						preferentialRate: "Prime -1%",
						benefit: "Below prime lending rate exclusive to young professionals",
						availability: isYoungProfessional ? "Available" : "Standard rates apply",
						calculation: purchaseAmount && deposit ? {
							purchasePrice: purchaseAmount,
							deposit: deposit,
							financeAmount: purchaseAmount - deposit,
							estimatedRate: isYoungProfessional ? "Prime -1%" : "Standard rates"
						} : null
					} : null,
					recommendations: isYoungProfessional ? [
						"Take advantage of interest-only home loan in first 2 years",
						"Use vehicle finance at prime -1% for better cash flow",
						"Plan purchases while under 30 to access these rates",
						"Consult with dedicated financial adviser for optimal structuring"
					] : [
						"Explore standard Private Banking loan products",
						"Consider refinancing existing loans",
						"Discuss wealth optimization strategies"
					]
				};
				
				return { content: [{ type: "text", text: JSON.stringify(loanOptions, null, 2) }] };
			}
		);

		this.server.tool(
			"getInvestecInsuranceOptions",
			"Get Investec insurance and protection options for young professionals",
			{
				age: z.number(),
				dependents: z.number().optional(),
				travelFrequency: z.enum(["none", "occasional", "frequent"]).optional()
			},
			async ({ age, dependents, travelFrequency }) => {
				const isYoungProfessional = age < 30;
				const insuranceOptions = {
					youngProfessionalStatus: isYoungProfessional,
					complimentaryBenefits: {
						lifeInsurance: {
							amount: "R25,000",
							provider: "Investec Life",
							cost: "Complimentary",
							activation: "Easy online activation"
						},
						travelInsurance: {
							coverage: "Complimentary travel insurance",
							availability: "Included with account",
							suitability: travelFrequency === "frequent" ? "Excellent value" : "Good backup coverage"
						},
						funeralCover: {
							type: "Additional funeral cover available",
							benefit: "Peace of mind for family"
						}
					},
					additionalOptions: {
						enhancedLifeInsurance: {
							recommendation: dependents && dependents > 0 ? "Consider increasing coverage" : "Current coverage may be sufficient",
							consultation: "Discuss with dedicated financial adviser",
							tailored: "Options tailored to your specific needs"
						}
					},
					recommendations: [
						"Activate your R25,000 complimentary life insurance immediately",
						"Review travel insurance before any international trips",
						dependents && dependents > 0 ? "Consider additional life insurance for dependents" : "Monitor insurance needs as life changes",
						"Annual review with financial adviser recommended"
					],
					nextSteps: [
						"Book consultation with dedicated financial adviser",
						"Activate complimentary insurance benefits",
						"Review existing insurance policies for gaps",
						"Plan for future insurance needs as career progresses"
					]
				};
				
				return { content: [{ type: "text", text: JSON.stringify(insuranceOptions, null, 2) }] };
			}
		);

		this.server.tool(
			"getSavingsStrategy",
			"Get personalized Investec savings strategy for young professionals",
			{
				monthlyIncome: z.number(),
				age: z.number(),
				savingsGoals: z.array(z.string()),
				currentSavings: z.number().optional()
			},
			async ({ monthlyIncome, age, savingsGoals, currentSavings }) => {
				const isYoungProfessional = age < 30;
				const strategy = {
					youngProfessionalStatus: isYoungProfessional,
					investecSavingsProducts: {
						instantAccess: {
							feature: "Instant access savings account",
							minimumDeposit: "R1,000",
							monthlyFees: "None",
							suitability: "Emergency fund and short-term goals"
						},
						noticeDeposits: {
							feature: "Notice deposit accounts",
							benefit: "Higher interest rates for planned savings",
							minimumDeposit: "R1,000",
							monthlyFees: "None"
						},
						fixedDeposits: {
							feature: "Fixed deposit accounts",
							benefit: "Guaranteed returns for long-term goals",
							minimumDeposit: "R1,000",
							monthlyFees: "None"
						},
						taxFreeInvestments: {
							feature: "Tax-free unit trusts",
							monthlyOption: "R1,000 monthly debit order",
							annualLimit: "R36,000 per tax year",
							benefit: "Tax-free growth - ideal for young professionals"
						}
					},
					recommendedStrategy: {
						emergencyFund: {
							target: monthlyIncome * 3,
							account: "Instant access savings",
							priority: "High - build this first"
						},
						taxFreeInvestments: {
							monthly: Math.min(3000, Math.floor(monthlyIncome * 0.1)),
							annual: "R36,000 limit",
							priority: "High - start immediately for long-term growth"
						},
						goalBasedSaving: savingsGoals.map(goal => ({
							goal: goal,
							account: goal.toLowerCase().includes('short') ? "Notice deposit" : "Fixed deposit or investments",
							strategy: "Automate with debit orders"
						}))
					},
					youngProfessionalAdvice: isYoungProfessional ? [
						"Use the reduced R320 account fee to maximize savings",
						"Start tax-free investments immediately - compound growth is powerful",
						"Take advantage of no monthly fees on savings accounts",
						"Consider the innovative home loan when ready to buy property"
					] : [
						"Focus on maximizing investment returns",
						"Consider offshore investment options",
						"Review and optimize existing savings strategy"
					],
					actionPlan: [
						"Open instant access account for emergency fund",
						"Set up R1,000+ monthly tax-free investment",
						"Automate savings with debit orders",
						"Review and adjust strategy every 6 months"
					]
				};
				
				return { content: [{ type: "text", text: JSON.stringify(strategy, null, 2) }] };
			}
		);
	}
}