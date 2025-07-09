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
			"Get daily personalized Investec financial tips based on young professional profile and experience level",
			{
				userProfile: z.object({
					age: z.number(),
					profession: z.string().optional(),
					monthlyIncome: z.number(),
					mainFinancialChallenges: z.array(z.string()),
					persona: z.enum(["beginner", "intermediate", "advanced"]).optional()
				})
			},
			async ({ userProfile }) => {
				const isYoungProfessional = userProfile.age < 30;
				const persona = userProfile.persona || "intermediate"; // default to intermediate if not specified
				
				const personaContext = {
					beginner: "This client is new to financial planning. Focus on simple, practical tips with clear explanations and basic Investec products.",
					intermediate: "This client understands basics but wants optimization. Focus on improving their financial strategy with better Investec products.",
					advanced: "This client is financially sophisticated. Focus on advanced strategies and premium Investec offerings."
				}[persona];
				
				const investecContext = isYoungProfessional ? 
					`This client qualifies for Investec Young Professional benefits. Focus on how they can maximize: R320 reduced account fee, innovative home loans, prime -1% vehicle finance, R25,000 life insurance, tax-free investments, and no-fee savings accounts.` :
					`This client should explore Investec's full Private Banking suite for wealth optimization.`;
				
				const result = await generateText({
					model: getModel(model),
					system: `You are an Investec Private Banking financial wellness coach for South African professionals. ${personaContext} ${investecContext} Provide practical, culturally relevant financial tips that specifically leverage Investec's products and services appropriate for their experience level.`,
					messages: [
						{
							role: "user",
							content: `Provide 3 personalized Investec-focused financial tips for a ${persona} ${userProfile.age}-year-old ${userProfile.profession || 'professional'} earning R${userProfile.monthlyIncome} per month. Their main challenges are: ${userProfile.mainFinancialChallenges.join(', ')}. Make tips specific and actionable for the South African context, highlighting relevant Investec products and benefits they should utilize based on their ${persona} experience level.`
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

		// Persona-Based Financial Guidance System

		this.server.tool(
			"getPersonalizedGuidance",
			"Get personalized Investec financial guidance based on user's experience level and financial situation",
			{
				persona: z.enum(["beginner", "intermediate", "advanced"]),
				age: z.number(),
				monthlyIncome: z.number(),
				currentSavings: z.number().optional(),
				financialGoals: z.array(z.string()).optional(),
				currentBank: z.string().optional(),
				specificQuestion: z.string().optional()
			},
			async ({ persona, age, monthlyIncome, currentSavings, financialGoals, currentBank, specificQuestion }) => {
				const isYoungProfessional = age < 30;
				
				const personaGuidance = {
					userProfile: {
						persona: persona,
						age: age,
						youngProfessionalStatus: isYoungProfessional,
						monthlyIncome: monthlyIncome,
						currentSavings: currentSavings || 0,
						goals: financialGoals || []
					},
					
					...(persona === "beginner" && {
						beginnerGuidance: {
							welcomeMessage: "Welcome to your financial journey! As someone new to financial planning, I'll guide you through simple, practical steps to build wealth with Investec.",
							
							investecAdvantages: isYoungProfessional ? {
								reducedFees: "Start with just R320/month for full Private Banking (normally much higher)",
								learningSupport: "Dedicated financial adviser to teach you the basics",
								lowBarriers: "R1,000 minimum for savings accounts and investments",
								lifeInsurance: "R25,000 complimentary life insurance for protection",
								graduateSupport: "Pay fees only when your salary comes in"
							} : {
								guidance: "Professional financial advisory support",
								education: "Investment education and guidance",
								flexibility: "Start small and grow your portfolio"
							},
							
							simpleSteps: [
								{
									step: 1,
									action: "Emergency Fund",
									description: "Save 3 months of expenses in an instant access account",
									investecProduct: "Investec Instant Access Savings (no monthly fees)",
									amount: `Target: R${Math.floor(monthlyIncome * 1.5)}`
								},
								{
									step: 2,
									action: "Start Investing",
									description: "Begin with tax-free investments for growth without tax",
									investecProduct: "Tax-free unit trusts with R1,000 monthly debit order",
									amount: "Start with R1,000-R2,000/month"
								},
								{
									step: 3,
									action: "Protection",
									description: "Ensure you have basic life insurance coverage",
									investecProduct: "R25,000 complimentary life insurance (activate online)",
									amount: "Free benefit"
								},
								{
									step: 4,
									action: "Learn & Grow",
									description: "Meet with your financial adviser to plan next steps",
									investecProduct: "Dedicated financial adviser consultations",
									amount: "Included with account"
								}
							],
							
							basicExplanations: {
								taxFreeInvestments: "Money that grows without paying tax on profits - perfect for building long-term wealth",
								compoundGrowth: "Your money earns returns, then those returns earn more returns - like a snowball effect",
								riskAndReturn: "Generally, higher potential returns come with higher risk - we'll help you find the right balance",
								diversification: "Don't put all eggs in one basket - spread investments across different areas"
							}
						}
					}),
					
					...(persona === "intermediate" && {
						intermediateGuidance: {
							welcomeMessage: "You're ready to optimize your finances! Let's leverage Investec's tools to take your financial planning to the next level.",
							
							investecAdvantages: isYoungProfessional ? {
								enhancedBanking: "One Investec Visa card - credit and transactional in one",
								investmentAccess: "No minimum requirements for online share trading",
								taxOptimization: "Both local and offshore tax-free unit trusts",
								borrowingPower: "Prime -1% vehicle finance and interest-only home loans",
								wealthBuilding: "Access to premium investment products"
							} : {
								privateBanking: "Full Private Banking experience with dedicated support",
								investmentPlatform: "Comprehensive online trading and investment platform",
								wealthManagement: "Professional portfolio management services",
								creditSolutions: "Flexible lending solutions for wealth building"
							},
							
							optimizationAreas: [
								{
									area: "Investment Diversification",
									current: "Basic savings and maybe one investment",
									investecSolution: "Online share trading + unit trusts + offshore investments",
									benefit: "Better returns through diversification",
									action: "Allocate across JSE shares, international funds, and bonds"
								},
								{
									area: "Tax Efficiency",
									current: "Paying unnecessary tax on investment growth",
									investecSolution: "Tax-free unit trusts (R36,000 annual limit)",
									benefit: "Keep more of your investment returns",
									action: "Maximize your R3,000 monthly tax-free allowance"
								},
								{
									area: "Banking Efficiency",
									current: "Multiple cards and accounts",
									investecSolution: "One Investec Visa card with premium features",
									benefit: "Simplified banking with better rewards",
									action: isYoungProfessional ? "Switch to R320/month all-in-one solution" : "Upgrade to Private Banking benefits"
								},
								{
									area: "Borrowing Strategy",
									current: "Paying standard lending rates",
									investecSolution: isYoungProfessional ? "Prime -1% vehicle finance and interest-only home loans" : "Premium lending rates",
									benefit: "Lower borrowing costs = more money for investments",
									action: "Time major purchases to leverage preferential rates"
								}
							],
							
							nextLevelStrategies: [
								"Automate investments with monthly debit orders",
								"Build a diversified portfolio across asset classes",
								"Consider offshore investments for rand hedging",
								"Use credit strategically for wealth building",
								"Regular portfolio reviews with your financial adviser"
							]
						}
					}),
					
					...(persona === "advanced" && {
						advancedGuidance: {
							welcomeMessage: "As a sophisticated investor, let me show you Investec's competitive advantages and premium offerings that justify making the switch.",
							
							competitiveAdvantages: {
								privateBankingExperience: {
									advantage: "True Private Banking relationship",
									details: isYoungProfessional ? "Full experience at R320/month until 30" : "Comprehensive wealth management",
									competitors: "Most banks offer 'premium' accounts that are just glorified transactional accounts"
								},
								investmentPlatform: {
									advantage: "Institutional-grade investment platform",
									details: "Direct access to JSE, international markets, bonds, derivatives",
									competitors: "Limited investment options through traditional banks"
								},
								creditSolutions: {
									advantage: "Sophisticated lending solutions",
									details: isYoungProfessional ? "Prime -1% rates and innovative home loans" : "Tailored credit facilities for wealth building",
									competitors: "Standard rates with limited flexibility"
								},
								taxOptimization: {
									advantage: "Comprehensive tax-efficient products",
									details: "Local and offshore tax-free investments, structured products",
									competitors: "Basic tax-free offerings with limited choice"
								}
							},
							
							exclusiveOfferings: [
								{
									service: "Dedicated Financial Adviser",
									benefit: "Personal relationship with qualified CFP",
									value: "Ongoing portfolio optimization and tax planning"
								},
								{
									service: "International Banking",
									benefit: "Seamless offshore investment and banking",
									value: "Rand hedging and global diversification"
								},
								{
									service: "Structured Products",
									benefit: "Access to sophisticated investment vehicles",
									value: "Enhanced returns and risk management"
								},
								{
									service: "Credit Facilities",
									benefit: "Flexible lending for investment and business",
									value: "Use credit strategically for wealth creation"
								}
							],
							
							wealthOptimizationStrategies: [
								{
									strategy: "Asset Allocation Optimization",
									description: "Professional portfolio construction across global markets",
									investecAdvantage: "Access to institutional research and investment products"
								},
								{
									strategy: "Tax Efficiency Maximization",
									description: "Sophisticated tax planning across all investments",
									investecAdvantage: "Comprehensive tax-free and offshore investment options"
								},
								{
									strategy: "Credit Optimization",
									description: "Strategic use of leverage for wealth building",
									investecAdvantage: "Flexible lending solutions with competitive rates"
								},
								{
									strategy: "International Diversification",
									description: "Global investment exposure and currency hedging",
									investecAdvantage: "Seamless offshore investment platform"
								}
							],
							
							switchingBenefits: {
								immediate: [
									"Access to institutional-grade investment platform",
									"Dedicated financial adviser relationship",
									"Competitive lending rates and flexible terms",
									"Comprehensive insurance and protection products"
								],
								longTerm: [
									"Superior investment returns through better products",
									"Tax optimization saving thousands annually",
									"Wealth accumulation acceleration through leverage",
									"True private banking relationship that grows with you"
								]
							}
						}
					}),
					
					personalizedRecommendations: await this.generatePersonalizedRecommendations(persona, age, monthlyIncome, currentSavings, financialGoals, specificQuestion, isYoungProfessional),
					
					nextSteps: {
						immediate: [
							"Book consultation with Investec financial adviser",
							isYoungProfessional ? "Apply for Young Professional Private Banking account" : "Explore Private Banking options",
							"Review current financial products for optimization opportunities"
						],
						shortTerm: [
							"Implement recommended investment strategy",
							"Optimize banking and credit arrangements",
							"Set up automated savings and investments"
						],
						longTerm: [
							"Regular portfolio reviews and rebalancing",
							"Tax planning and optimization",
							"Wealth building milestone tracking"
						]
					}
				};
				
				return { content: [{ type: "text", text: JSON.stringify(personaGuidance, null, 2) }] };
			}
		);

		this.server.tool(
			"identifyFinancialPersona",
			"Help users identify their financial experience level and persona (beginner, intermediate, advanced)",
			{
				hasInvestments: z.boolean(),
				understandsRisk: z.boolean(),
				hasFinancialAdviser: z.boolean(),
				yearsWorking: z.number(),
				comfortableWithConcepts: z.array(z.string()).optional(),
				currentFinancialProducts: z.array(z.string()).optional()
			},
			async ({ hasInvestments, understandsRisk, hasFinancialAdviser, yearsWorking, comfortableWithConcepts, currentFinancialProducts }) => {
				
				// Calculate persona score
				let score = 0;
				
				// Investment experience
				if (hasInvestments) score += 2;
				
				// Risk understanding
				if (understandsRisk) score += 2;
				
				// Professional guidance
				if (hasFinancialAdviser) score += 1;
				
				// Work experience
				if (yearsWorking >= 5) score += 2;
				else if (yearsWorking >= 2) score += 1;
				
				// Financial concepts comfort
				const advancedConcepts = ['derivatives', 'hedge funds', 'offshore investing', 'tax optimization', 'asset allocation'];
				const intermediateConcepts = ['unit trusts', 'bonds', 'compound interest', 'diversification'];
				
				if (comfortableWithConcepts) {
					const advancedCount = comfortableWithConcepts.filter(concept => 
						advancedConcepts.some(advanced => concept.toLowerCase().includes(advanced.toLowerCase()))
					).length;
					const intermediateCount = comfortableWithConcepts.filter(concept => 
						intermediateConcepts.some(intermediate => concept.toLowerCase().includes(intermediate.toLowerCase()))
					).length;
					
					score += advancedCount * 1.5;
					score += intermediateCount * 1;
				}
				
				// Financial products sophistication
				if (currentFinancialProducts) {
					const sophisticatedProducts = ['private banking', 'portfolio management', 'offshore accounts', 'structured products'];
					const basicProducts = ['savings account', 'unit trusts', 'retirement annuity'];
					
					sophisticatedProducts.forEach(product => {
						if (currentFinancialProducts.some(userProduct => userProduct.toLowerCase().includes(product))) {
							score += 2;
						}
					});
					
					basicProducts.forEach(product => {
						if (currentFinancialProducts.some(userProduct => userProduct.toLowerCase().includes(product))) {
							score += 0.5;
						}
					});
				}
				
				// Determine persona
				let persona: "beginner" | "intermediate" | "advanced";
				let description: string;
				let keyCharacteristics: string[];
				
				if (score <= 3) {
					persona = "beginner";
					description = "You're new to financial planning and would benefit from simple, practical guidance with clear explanations.";
					keyCharacteristics = [
						"Limited investment experience",
						"Looking for basic financial education",
						"Want simple, low-risk starting options",
						"Need clear explanations of financial concepts"
					];
				} else if (score <= 7) {
					persona = "intermediate";
					description = "You understand financial basics but want to optimize your finances and access better products.";
					keyCharacteristics = [
						"Some investment experience",
						"Comfortable with basic financial concepts",
						"Ready for more sophisticated products",
						"Looking to optimize current financial arrangements"
					];
				} else {
					persona = "advanced";
					description = "You're financially sophisticated and want competitive advantages and premium offerings.";
					keyCharacteristics = [
						"Extensive financial knowledge",
						"Experience with complex financial products",
						"Looking for sophisticated investment strategies",
						"Want premium banking and wealth management services"
					];
				}
				
				const personaResult = {
					identifiedPersona: persona,
					confidenceScore: Math.min(score / 10, 1).toFixed(2),
					description: description,
					keyCharacteristics: keyCharacteristics,
					
					nextSteps: {
						beginner: [
							"Start with basic Investec savings products",
							"Book consultation to learn about investment basics",
							"Begin with tax-free unit trusts",
							"Activate complimentary life insurance"
						],
						intermediate: [
							"Explore Investec's online share trading platform",
							"Optimize your banking with One Investec Visa card",
							"Consider diversifying into offshore investments",
							"Review borrowing opportunities for wealth building"
						],
						advanced: [
							"Discuss portfolio management services",
							"Explore structured products and derivatives",
							"Consider sophisticated tax optimization strategies",
							"Evaluate Private Banking wealth management benefits"
						]
					}[persona],
					
					recommendedInvestecProducts: {
						beginner: [
							"Instant Access Savings Account",
							"Tax-Free Unit Trusts (R1,000/month)",
							"R25,000 Complimentary Life Insurance",
							"Financial Adviser Consultation"
						],
						intermediate: [
							"One Investec Visa Card",
							"Online Share Trading Platform",
							"Local and Offshore Unit Trusts",
							"Notice and Fixed Deposit Accounts"
						],
						advanced: [
							"Private Banking Suite",
							"Portfolio Management Services",
							"Structured Investment Products",
							"International Banking and Investments"
						]
					}[persona]
				};
				
				return { content: [{ type: "text", text: JSON.stringify(personaResult, null, 2) }] };
			}
		);

		// User Profile Management Tool

		this.server.tool(
			"updateUserProfile",
			"Update user profile information and provide immediate persona-based guidance",
			{
				age: z.number(),
				monthlyIncome: z.number().optional(),
				financialGoals: z.array(z.string()).optional(),
				riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).optional(),
				currentSavings: z.number().optional(),
				profession: z.string().optional(),
				currentBank: z.string().optional(),
				hasInvestments: z.boolean().optional(),
				yearsWorking: z.number().optional()
			},
			async ({ age, monthlyIncome, financialGoals, riskTolerance, currentSavings, profession, currentBank, hasInvestments, yearsWorking }) => {
				const isYoungProfessional = age < 30;
				
				// Determine persona based on available information
				let detectedPersona: "beginner" | "intermediate" | "advanced" = "beginner";
				
				if (hasInvestments && yearsWorking && yearsWorking >= 3) {
					detectedPersona = "intermediate";
				}
				if (hasInvestments && yearsWorking && yearsWorking >= 5) {
					detectedPersona = "advanced";
				}
				
				// If no income provided, assume this is a beginner asking for initial guidance
				if (!monthlyIncome && currentSavings && currentSavings > 0) {
					detectedPersona = "beginner";
				}
				
				const profileUpdate = {
					profileUpdated: true,
					userDetails: {
						age: age,
						monthlyIncome: monthlyIncome || "Not specified",
						currentSavings: currentSavings || "Not specified", 
						profession: profession || "Not specified",
						financialGoals: financialGoals || [],
						riskTolerance: riskTolerance || "Not specified",
						detectedPersona: detectedPersona,
						youngProfessionalStatus: isYoungProfessional
					},
					
					immediateGuidance: detectedPersona === "beginner" && currentSavings ? {
						welcomeMessage: `Great start! Having R${currentSavings} saved at ${age} shows you're already thinking about your financial future.`,
						
						investecAdvantages: isYoungProfessional ? {
							reducedFees: "As a young professional, you qualify for Investec Private Banking at just R320/month (normally much higher)",
							lowBarriers: "Start investing with just R1,000 - perfect for your current savings level", 
							protection: "Get R25,000 complimentary life insurance immediately",
							support: "Dedicated financial adviser to guide you through investing basics",
							noRisk: "Pay account fees only when your salary comes in - perfect for graduates"
						} : {
							guidance: "Professional support to help you start investing",
							flexibility: "Low minimums to begin your investment journey"
						},
						
						immediateSteps: [
							{
								step: "Emergency Buffer",
								description: "Keep R5,000-R10,000 in an instant access account for emergencies",
								investecProduct: "Investec Instant Access Savings (no monthly fees)",
								why: "Safety net while you learn about investing"
							},
							{
								step: "Start Small with Tax-Free",
								description: "Begin investing with R1,000/month in tax-free unit trusts",
								investecProduct: "Tax-free unit trusts with automatic debit order",
								why: "Your money grows without paying tax - perfect for long-term wealth building"
							},
							{
								step: "Get Protected", 
								description: "Activate your complimentary life insurance",
								investecProduct: "R25,000 life insurance from Investec Life",
								why: "Free protection while you build your wealth"
							},
							{
								step: "Learn & Plan",
								description: "Book a consultation to create your personalized investment plan",
								investecProduct: "Dedicated financial adviser consultation",
								why: "Professional guidance tailored to your goals and risk comfort level"
							}
						],
						
						simpleExplanations: {
							taxFreeInvestments: "Like a normal investment, but the government doesn't take tax from your profits - more money stays in your pocket!",
							unitTrusts: "Your money gets pooled with other investors to buy a mix of shares and bonds - spreading the risk",
							compoundGrowth: "Your profits earn more profits over time - like a snowball rolling downhill getting bigger",
							riskVsReturn: "Generally, taking some risk can lead to better long-term returns, but we start conservatively"
						}
					} : null,
					
					nextSteps: monthlyIncome ? [
						"You have enough information to get personalized guidance",
						"Consider using the 'getPersonalizedGuidance' tool for detailed recommendations",
						"Book consultation with Investec financial adviser",
						isYoungProfessional ? "Apply for Young Professional Private Banking account" : "Explore Private Banking options"
					] : [
						"To provide complete guidance, please share your monthly income",
						"Consider what your financial goals are (emergency fund, travel, car, etc.)",
						"Think about your comfort level with investment risk",
						"Ready to explore Investec's young professional benefits"
					],
					
					investecBenefitsHighlight: isYoungProfessional ? {
						accountFee: "R320/month until age 30 (vs standard rates)",
						lifeInsurance: "R25,000 complimentary life insurance",
						investments: "Tax-free unit trusts from R1,000/month",
						savings: "No monthly fees on savings accounts",
						loans: "Prime -1% vehicle finance when you're ready",
						homeLoans: "Interest-only payments for first 2 years on home loans",
						support: "Dedicated financial adviser included"
					} : {
						privateBanking: "Full Private Banking experience",
						investments: "Comprehensive investment platform",
						advice: "Professional financial advisory services"
					}
				};
				
				return { content: [{ type: "text", text: JSON.stringify(profileUpdate, null, 2) }] };
			}
		);

		this.server.tool(
			"getBeginnerGuidance",
			"Provide immediate guidance for someone new to investing with basic information",
			{
				age: z.number(),
				currentSavings: z.number(),
				monthlyIncome: z.number().optional(),
				specificConcern: z.string().optional()
			},
			async ({ age, currentSavings, monthlyIncome, specificConcern }) => {
				const isYoungProfessional = age < 30;
				
				const beginnerGuidance = {
					welcomeMessage: `Perfect timing to start your financial journey! At ${age} with R${currentSavings} saved, you're ahead of many people your age.`,
					
					situation: {
						strengths: [
							"You have savings already - great discipline!",
							"You're thinking about investing young - time is your biggest advantage",
							isYoungProfessional ? "You qualify for Investec Young Professional benefits" : "You can access professional financial guidance"
						],
						opportunities: [
							"Make your money work harder through investments",
							"Build wealth through tax-free growth",
							"Get professional guidance to avoid common mistakes"
						]
					},
					
					investecAdvantages: isYoungProfessional ? {
						costEffective: "R320/month for full Private Banking (perfect for graduates)",
						lowBarriers: "Start investing with R1,000 (you already have this covered!)",
						protection: "R25,000 free life insurance for peace of mind",
						education: "Dedicated adviser to teach you investing basics",
						flexibility: "Pay fees only when salary comes in"
					} : {
						guidance: "Professional investment education and support",
						platform: "Easy-to-use investment platform",
						minimums: "Low investment minimums to start small"
					},
					
					recommendedFirstSteps: [
						{
							priority: "High",
							action: "Keep Emergency Fund",
							amount: "R5,000-R8,000",
							where: "Investec Instant Access Savings",
							why: "Safety net for unexpected expenses",
							benefit: "No monthly fees, instant access"
						},
						{
							priority: "High", 
							action: "Start Tax-Free Investing",
							amount: "R1,000-R2,000/month",
							where: "Investec Tax-Free Unit Trusts",
							why: "Your profits grow without paying tax",
							benefit: "Compound growth over time - could be worth hundreds of thousands later"
						},
						{
							priority: "Medium",
							action: "Get Life Insurance",
							amount: "Free",
							where: "Investec Life (R25,000 cover)",
							why: "Protection while you build wealth",
							benefit: "Peace of mind, no cost"
						},
						{
							priority: "Medium",
							action: "Plan Your Future",
							amount: "Included",
							where: "Financial Adviser Consultation",
							why: "Professional guidance prevents costly mistakes", 
							benefit: "Personalized strategy for your goals"
						}
					],
					
					investingBasics: {
						whatIsInvesting: "Instead of money sitting in savings earning little interest, investing puts it to work in businesses (shares) or loans (bonds) that can grow over time.",
						whyTaxFree: "Normal investments are taxed on profits. Tax-free means SARS can't touch your gains - more money for you!",
						riskExplained: "All investments have some risk, but young people can take more risk because you have decades for markets to recover from any downturns.",
						compoundMagic: "If you invest R1,000/month earning 10% annually, after 30 years you'd have over R2 million! Time is your superpower."
					},
					
					specificGuidance: specificConcern ? {
						concern: specificConcern,
						response: await this.generateBeginnerResponse(specificConcern, age, currentSavings, monthlyIncome, isYoungProfessional)
					} : null,
					
					nextSteps: [
						monthlyIncome ? "You're ready for detailed investment planning" : "Share your monthly income for personalized amounts",
						"Book consultation with Investec adviser (free with account)",
						"Consider opening Investec Young Professional account",
						"Start with small, regular investments to build confidence"
					]
				};
				
				return { content: [{ type: "text", text: JSON.stringify(beginnerGuidance, null, 2) }] };
			}
		);

		this.server.tool(
			"getYoungProfessionalLifestyleRewards",
			"Get comprehensive lifestyle rewards and sophisticated wealth management strategies for affluent young professionals under 30",
			{
				age: z.number(),
				monthlyIncome: z.number(),
				totalAssets: z.number(),
				currentInvestments: z.array(z.string()).optional(),
				lifestylePriorities: z.array(z.enum(["travel", "luxury", "convenience", "networking", "experiences", "tech", "sustainability"])).optional(),
				currentBank: z.string().optional(),
				specificGoals: z.array(z.string()).optional()
			},
			async ({ age, monthlyIncome, totalAssets, currentInvestments, lifestylePriorities, currentBank, specificGoals }) => {
				const isYoungProfessional = age < 30;
				const timeRemaining = isYoungProfessional ? 30 - age : 0;
				
				if (!isYoungProfessional) {
					return { 
						content: [{ 
							type: "text", 
							text: "Young Professional benefits are only available to clients under 30. However, you may qualify for our premium Private Banking wealth management services." 
						}] 
					};
				}

				const lifestyleRewards = {
					urgentOpportunity: {
						timeRemaining: `${timeRemaining} year${timeRemaining !== 1 ? 's' : ''} remaining to access Young Professional benefits`,
						urgencyMessage: timeRemaining <= 1 ? 
							"⚠️ URGENT: Less than 1 year remaining to access these exclusive benefits!" :
							`💡 You have ${timeRemaining} years to maximize these exclusive benefits`,
						actionRequired: "Switch to Investec Private Banking (Young Professional) immediately to lock in benefits"
					},

					exclusiveLifestyleRewards: {
						privateBankingAtDiscount: {
							normalCost: "R2,000-R3,000+/month for equivalent Private Banking elsewhere",
							youngProfessionalRate: "R320/month until age 30",
							annualSavings: `R${((2500 - 320) * 12).toLocaleString()} per year in banking fees alone`,
							lifeTimeSavings: `R${((2500 - 320) * 12 * timeRemaining).toLocaleString()} while you qualify`
						},

						premiumCardBenefits: {
							oneInvestecVisa: {
								combination: "Credit + Transactional card in one premium product",
								rewardsProgram: "Premium rewards on all spending",
								internationalAccess: "Global acceptance with preferential exchange rates",
								conciergeServices: "24/7 lifestyle concierge included"
							},
							travelPerks: lifestylePriorities?.includes("travel") ? {
								loungeAccess: "Airport lounge access globally",
								travelInsurance: "Comprehensive complimentary travel insurance",
								hotelUpgrades: "Preferred rates and upgrades at luxury hotels",
								carRental: "Premium car rental privileges"
							} : null
						},

						wealthAcceleration: {
							investmentMinimums: {
								onlineTrading: "No minimum requirements (vs R50k+ elsewhere)",
								unitTrusts: "R1,000 minimums (vs R25k+ for private clients elsewhere)",
								offshoreInvestments: "Access to international markets with low minimums"
							},
							taxOptimization: {
								taxFreeInvestments: "R36,000 annual tax-free allowance",
								offshoreAllowance: "R11 million offshore investment allowance",
								estatePlanning: "Sophisticated tax planning included"
							},
							creditLeverage: {
								homeLoanInnovation: "Interest-only payments for first 2 years on home loans",
								vehicleFinance: "Prime -1% rates (currently saving ~1% annually)",
								investmentFunding: "Use credit strategically for wealth building"
							}
						},

						lifestyleConvenience: lifestylePriorities?.includes("convenience") ? {
							dedicatedAdviser: "Personal CFP-qualified financial adviser",
							priorityBanking: "Skip queues, priority service",
							digitalPlatform: "Sophisticated online and mobile banking",
							estatePlanning: "Comprehensive wealth succession planning"
						} : null,

						networkingAndStatus: lifestylePriorities?.includes("networking") ? {
							privateClientEvents: "Exclusive investment seminars and networking events",
							advisorNetwork: "Access to specialist advisors (tax, legal, estate)",
							statusRecognition: "Recognition as Private Banking client",
							businessBanking: "Seamless personal to business banking integration"
						} : null
					},

					sophisticatedStrategies: {
						wealthOptimization: [
							{
								strategy: "Tax-Free Maximization",
								implementation: "Maximize R36,000 annual tax-free allowance across local and offshore funds",
								benefit: `Save ~R${Math.floor(monthlyIncome * 0.35 * 0.36).toLocaleString()} annually in tax on investment growth`,
								timeValue: `Compound tax savings over ${timeRemaining} years could exceed R${Math.floor(monthlyIncome * 0.35 * 0.36 * timeRemaining * 1.5).toLocaleString()}`
							},
							{
								strategy: "Offshore Diversification",
								implementation: "Use R11M offshore allowance for international exposure and rand hedging",
								benefit: "Protect against rand volatility and access global growth",
								allocation: `Consider 30-40% offshore allocation (R${Math.floor(totalAssets * 0.35).toLocaleString()} of current assets)`
							},
							{
								strategy: "Credit Optimization",
								implementation: "Use prime -1% vehicle finance and interest-only home loans strategically",
								benefit: "Free up cash flow for higher-return investments",
								calculation: "1% saving on R2M+ credit facilities = R20,000+ annual savings"
							},
							{
								strategy: "Estate Planning",
								implementation: "Sophisticated trust structures and succession planning while young",
								benefit: "Minimize estate duty and ensure efficient wealth transfer",
								timing: "Implement early for maximum compounding benefits"
							}
						],

						investmentAccess: {
							institutionalProducts: [
								"Structured products for enhanced returns",
								"Hedge funds and alternative investments",
								"Direct access to IPOs and private placements",
								"Commodity and derivative strategies"
							],
							globalMarkets: [
								"JSE shares with preferential rates",
								"International shares (US, Europe, Asia)",
								"Global ETFs and index funds",
								"Currency and commodity exposure"
							],
							exclusiveOpportunities: [
								"Private equity deal flow",
								"Property syndications",
								"Venture capital opportunities",
								"Sophisticated bond strategies"
							]
						}
					},

					lifestyleIntegration: {
						...(lifestylePriorities?.includes("travel") && {
							travelOptimization: {
								currencyStrategy: "Multi-currency accounts for seamless international spending",
								investmentTravel: "Offshore investments in countries you visit frequently",
								travelRewards: "Maximize card rewards on international spending",
								insuranceCover: "Comprehensive travel and medical insurance"
							}
						}),

						...(lifestylePriorities?.includes("luxury") && {
							luxuryAccess: {
								exclusiveOffers: "Access to luxury goods financing",
								artAndCollectibles: "Investment-grade art and collectibles financing",
								yachtAndJetShares: "Financing for luxury lifestyle assets",
								privateEvents: "VIP access to exclusive events and experiences"
							}
						}),

						...(lifestylePriorities?.includes("tech") && {
							digitalInnovation: {
								tradingPlatform: "Institutional-grade online trading platform",
								mobileApp: "Sophisticated mobile banking and investing",
								apiAccess: "Integration with financial management tools",
								realTimeReporting: "Real-time portfolio tracking and reporting"
							}
						}),

						...(lifestylePriorities?.includes("sustainability") && {
							sustainableInvesting: {
								esgFunds: "Comprehensive ESG and impact investment options",
								greenBonds: "Environmental and social impact bonds",
								sustainableStrategy: "Align investments with values without sacrificing returns",
								reporting: "Impact reporting on sustainable investments"
							}
						})
					},

					competitiveAnalysis: {
						vsOtherBanks: {
							standardBank: "Premium banking costs R2,500+/month with higher minimums",
							fnb: "Private clients pay R3,000+/month with limited investment access",
							nedbank: "Private banking from R2,000/month with geographic limitations",
							absa: "Premier banking lacks investment sophistication at similar costs"
						},
						investecAdvantage: [
							"Institutional-grade investment platform",
							"True private banking relationship",
							"Sophisticated lending solutions",
							"International banking capabilities",
							"Dedicated advisory team"
						]
					},

					actionPlan: {
						immediate: [
							"Book urgent consultation with Investec Private Banking advisor",
							"Apply for Young Professional Private Banking account immediately",
							"Consolidate banking to maximize R320/month benefit",
							"Activate R25,000 complimentary life insurance"
						],
						within30Days: [
							"Transfer core banking and investments to Investec",
							"Set up automated tax-free investment maximization",
							"Optimize existing investment portfolio structure",
							"Implement offshore diversification strategy"
						],
						ongoing: [
							"Maximize young professional benefits for remaining time",
							"Regular portfolio optimization with dedicated adviser",
							"Strategic use of credit facilities for wealth building",
							"Prepare for transition to standard private banking at 30"
						]
					},

					costBenefitAnalysis: {
						currentCosts: currentBank ? `Estimated current banking/investment costs: R${Math.floor(monthlyIncome * 0.02).toLocaleString()}/month` : "Current banking costs not specified",
						investecCosts: "R320/month for comprehensive Private Banking suite",
						savings: {
							monthly: `R${Math.floor(monthlyIncome * 0.02 - 320).toLocaleString()}/month potential savings`,
							annually: `R${Math.floor((monthlyIncome * 0.02 - 320) * 12).toLocaleString()}/year`,
							untilAge30: `R${Math.floor((monthlyIncome * 0.02 - 320) * 12 * timeRemaining).toLocaleString()} total savings remaining`
						},
						additionalBenefits: [
							"Prime -1% credit rates worth R20,000+ annually on large facilities",
							"Tax optimization potentially worth R50,000+ annually",
							"Investment access and minimums saving significant opportunity costs",
							"Lifestyle rewards and convenience valued at R10,000+ annually"
						]
					}
				};

				return { content: [{ type: "text", text: JSON.stringify(lifestyleRewards, null, 2) }] };
			}
		);

		// Visual Finance Dashboard Tools

		this.server.tool(
			"generateSpendingDashboard",
			"Generate a visual spending breakdown dashboard for young professionals with Investec-specific insights",
			{
				userId: z.string(),
				timeframe: z.enum(["week", "month", "quarter", "year"]).optional().default("month"),
				monthlyIncome: z.number().optional(),
				includeProjections: z.boolean().optional().default(true)
			},
			async ({ userId, timeframe, monthlyIncome, includeProjections }) => {
				try {
					// Try to get real data from API first
					await callBackendAPI('/api/spending-insights', 'GET');
					
					// Generate visual dashboard data with enhanced formatting
					const spendingData = [
						{ category: "Groceries & Food", amount: 3500, percentage: 23.3, color: "#FF6B6B", icon: "🛒" },
						{ category: "Entertainment", amount: 2800, percentage: 18.7, color: "#4ECDC4", icon: "🎬" },
						{ category: "Transport", amount: 2200, percentage: 14.7, color: "#45B7D1", icon: "🚗" },
						{ category: "Utilities", amount: 1800, percentage: 12.0, color: "#96CEB4", icon: "💡" },
						{ category: "Shopping", amount: 1600, percentage: 10.7, color: "#FFEAA7", icon: "🛍️" },
						{ category: "Health & Fitness", amount: 1200, percentage: 8.0, color: "#DDA0DD", icon: "💪" },
						{ category: "Savings & Investments", amount: 1900, percentage: 12.7, color: "#98D8C8", icon: "💎" }
					];

					// Create a visual pie chart representation
					const visualChart = `
📊 YOUR SPENDING BREAKDOWN - PIE CHART VISUALIZATION
══════════════════════════════════════════════════════════════

        🛒 GROCERIES & FOOD (23.3%)
           ████████████████████████ R3,500
          
        🎬 ENTERTAINMENT (18.7%)
           ████████████████████ R2,800
          
        🚗 TRANSPORT (14.7%)
           ████████████████ R2,200
          
        💡 UTILITIES (12.0%)
           ████████████ R1,800
          
        🛍️ SHOPPING (10.7%)
           ███████████ R1,600
          
        💪 HEALTH & FITNESS (8.0%)
           ████████ R1,200
          
        💎 SAVINGS & INVESTMENTS (12.7%)
           █████████████ R1,900

══════════════════════════════════════════════════════════════
💰 TOTAL SPENT: R15,000
💳 BUDGET REMAINING: R${monthlyIncome ? monthlyIncome - 15000 : 5000}
📈 SAVINGS RATE: ${monthlyIncome ? ((monthlyIncome - 15000) / monthlyIncome * 100).toFixed(1) : "25.0"}%

🔗 INVESTEC INSIGHTS:
💡 Use your R320/month Young Professional account savings to boost investments
🎯 Set up automated savings to reach R2,000/month target
📈 Your 25% savings rate is excellent - ready for offshore investments

📞 NEXT STEPS:
• Book financial consultation to optimize spending
• Switch to One Investec Visa for rewards on entertainment
• Consider automated investment debit orders
══════════════════════════════════════════════════════════════`;

					const dashboard = {
						displayChart: visualChart,
						type: "spending_dashboard",
						title: `💰 Spending Dashboard - ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`,
						timestamp: new Date().toISOString(),
						
						visualComponents: {
							spendingBreakdown: {
								type: "pie_chart",
								title: "Spending by Category",
								data: spendingData
							},
							
							trendChart: {
								type: "line_chart",
								title: "Spending Trends",
								data: {
									labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
									datasets: [
										{
											label: "Spending",
											data: [3200, 3800, 3600, 4400],
											color: "#FF6B6B",
											trend: "increasing"
										},
										{
											label: "Budget",
											data: [4000, 4000, 4000, 4000],
											color: "#45B7D1",
											trend: "stable"
										}
									]
								}
							},
							
							budgetProgress: {
								type: "progress_bars",
								title: "Budget vs Actual",
								categories: [
									{ name: "Food & Dining", budgeted: 4000, spent: 3500, status: "under", percentage: 87.5 },
									{ name: "Entertainment", budgeted: 2500, spent: 2800, status: "over", percentage: 112.0 },
									{ name: "Transport", budgeted: 2000, spent: 2200, status: "over", percentage: 110.0 },
									{ name: "Shopping", budgeted: 1500, spent: 1600, status: "over", percentage: 106.7 }
								]
							}
						},
						
						keyMetrics: {
							totalSpent: 15000,
							budgetRemaining: monthlyIncome ? monthlyIncome - 15000 : 5000,
							savingsRate: monthlyIncome ? ((monthlyIncome - 15000) / monthlyIncome * 100).toFixed(1) : "25.0",
							topSpendingCategory: "Groceries & Food",
							budgetUtilization: "75%"
						},
						
						investecInsights: {
							youngProfessionalTips: [
								"💡 Use your R320/month account savings to boost your investment budget",
								"🎯 Set up automated debit orders to prevent overspending in entertainment",
								"📈 Your 25% savings rate is excellent - consider increasing tax-free investments"
							],
							optimizationSuggestions: [
								{
									category: "Entertainment",
									suggestion: "R300 over budget - consider Investec's lifestyle rewards for dining",
									action: "Switch entertainment spending to One Investec Visa for rewards"
								},
								{
									category: "Savings",
									suggestion: "Great savings discipline! Ready for next level investments",
									action: "Book consultation to explore offshore investment options"
								}
							]
						},
						
						interactiveElements: {
							buttons: [
								{ text: "📊 Detailed Analysis", action: "analyzeSpendingPatterns", params: { userId } },
								{ text: "💰 Budget Optimization", action: "generateBudgetPlan", params: { monthlyIncome } },
								{ text: "🎯 Set Savings Goals", action: "trackFinancialGoals", params: {} }
							],
							quickActions: [
								"View investment performance",
								"Check account benefits",
								"Book financial consultation"
							]
						},
						
						projections: includeProjections ? {
							monthEndForecast: {
								estimatedTotalSpend: 18500,
								budgetVariance: -1500,
								projectedSavings: monthlyIncome ? monthlyIncome - 18500 : 1500
							},
							recommendations: [
								"Reduce entertainment spending by R400 to stay on budget",
								"Increase automated savings to R2000/month",
								"Consider using Investec's spending alerts"
							]
						} : null
					};
					
					return { content: [{ type: "text", text: visualChart }] };
					
				} catch (error) {
					console.error('Error generating spending dashboard:', error);
					
					// Fallback visual dashboard with mock data and ASCII chart
					const spendingData = [
						{ category: "Groceries & Food", amount: 3500, percentage: 23.3, color: "#FF6B6B", icon: "🛒" },
						{ category: "Entertainment", amount: 2800, percentage: 18.7, color: "#4ECDC4", icon: "🎬" },
						{ category: "Transport", amount: 2200, percentage: 14.7, color: "#45B7D1", icon: "🚗" },
						{ category: "Utilities", amount: 1800, percentage: 12.0, color: "#96CEB4", icon: "💡" },
						{ category: "Shopping", amount: 1600, percentage: 10.7, color: "#FFEAA7", icon: "🛍️" },
						{ category: "Health & Fitness", amount: 1200, percentage: 8.0, color: "#DDA0DD", icon: "💪" },
						{ category: "Savings & Investments", amount: 1900, percentage: 12.7, color: "#98D8C8", icon: "💎" }
					];

					// Create visual chart for fallback
					const fallbackVisualChart = `
📊 YOUR SPENDING BREAKDOWN - PIE CHART VISUALIZATION (DEMO)
══════════════════════════════════════════════════════════════

        🛒 GROCERIES & FOOD (23.3%)
           ████████████████████████ R3,500
          
        🎬 ENTERTAINMENT (18.7%)
           ████████████████████ R2,800
          
        🚗 TRANSPORT (14.7%)
           ████████████████ R2,200
          
        💡 UTILITIES (12.0%)
           ████████████ R1,800
          
        🛍️ SHOPPING (10.7%)
           ███████████ R1,600
          
        💪 HEALTH & FITNESS (8.0%)
           ████████ R1,200
          
        💎 SAVINGS & INVESTMENTS (12.7%)
           █████████████ R1,900

══════════════════════════════════════════════════════════════
💰 TOTAL SPENT: R15,000
💳 BUDGET REMAINING: R${monthlyIncome ? monthlyIncome - 15000 : 5000}
📈 SAVINGS RATE: ${monthlyIncome ? ((monthlyIncome - 15000) / monthlyIncome * 100).toFixed(1) : "25.0"}%
⚠️  API UNAVAILABLE - SHOWING DEMO DATA

🔗 INVESTEC INSIGHTS:
💡 Use your R320/month Young Professional account savings to boost investments
🎯 Set up automated savings to reach R2,000/month target
📈 Your 25% savings rate is excellent - ready for offshore investments

📞 NEXT STEPS:
• Book financial consultation to optimize spending
• Switch to One Investec Visa for rewards on entertainment
• Consider automated investment debit orders
══════════════════════════════════════════════════════════════`;
					
					return { content: [{ type: "text", text: fallbackVisualChart }] };
				}
			}
		);

		this.server.tool(
			"generateInvestmentDashboard",
			"Generate a visual investment performance dashboard with Investec young professional focus",
			{
				userId: z.string().optional(),
				timeframe: z.enum(["week", "month", "quarter", "year", "ytd"]).optional().default("month"),
				includeProjections: z.boolean().optional().default(true),
				portfolioValue: z.number().optional(),
				age: z.number().optional()
			},
			async ({ userId, timeframe, includeProjections, portfolioValue, age }) => {
				const isYoungProfessional = age && age < 30;
				
				const dashboard = {
					type: "investment_dashboard",
					title: `📈 Investment Performance - ${timeframe.toUpperCase()}`,
					timestamp: new Date().toISOString(),
					youngProfessionalStatus: isYoungProfessional,
					
					visualComponents: {
						portfolioOverview: {
							type: "donut_chart",
							title: "Portfolio Allocation",
							totalValue: portfolioValue || 125000,
							data: [
								{ asset: "Tax-Free Unit Trusts", value: 45000, percentage: 36, color: "#4ECDC4", recommended: true },
								{ asset: "JSE Shares", value: 35000, percentage: 28, color: "#45B7D1", recommended: true },
								{ asset: "Offshore Investments", value: 25000, percentage: 20, color: "#96CEB4", recommended: true },
								{ asset: "Cash/Savings", value: 15000, percentage: 12, color: "#FFEAA7", recommended: false },
								{ asset: "Property/REITs", value: 5000, percentage: 4, color: "#DDA0DD", recommended: true }
							]
						},
						
						performanceChart: {
							type: "area_chart",
							title: "Portfolio Performance",
							data: {
								labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
								datasets: [
									{
										label: "Portfolio Value",
										data: [100000, 105000, 108000, 115000, 120000, 125000],
										color: "#4ECDC4",
										growth: "+25%"
									},
									{
										label: "Benchmark (SWIX)",
										data: [100000, 103000, 106000, 110000, 112000, 118000],
										color: "#45B7D1",
										growth: "+18%"
									}
								]
							}
						},
						
						returnsBreakdown: {
							type: "bar_chart",
							title: "Returns by Asset Class",
							data: [
								{ asset: "Tax-Free Unit Trusts", return: 12.5, value: 5625, color: "#4ECDC4" },
								{ asset: "JSE Shares", return: 8.2, value: 2870, color: "#45B7D1" },
								{ asset: "Offshore", return: 15.8, value: 3950, color: "#96CEB4" },
								{ asset: "Cash", return: 4.5, value: 675, color: "#FFEAA7" }
							]
						}
					},
					
					keyMetrics: {
						totalValue: portfolioValue || 125000,
						totalReturn: 13120,
						returnPercentage: "11.7%",
						monthlyContribution: 8500,
						taxFreeSavings: 2000,
						compoundGrowthProjection: "R2.8M by age 50"
					},
					
					investecAdvantages: isYoungProfessional ? {
						youngProfessionalBenefits: [
							"🎯 No minimum trading requirements (vs R50k+ elsewhere)",
							"💎 Tax-free investments from R1,000/month",
							"🌍 Access to offshore markets with low minimums",
							"💰 Reduced R320 account fee until age 30"
						],
						optimizationOpportunities: [
							{
								opportunity: "Tax-Free Maximization",
								current: "R24,000/year",
								potential: "R36,000/year",
								benefit: "Save additional R4,200 in taxes annually"
							},
							{
								opportunity: "Offshore Diversification",
								current: "20%",
								recommended: "30-40%",
								benefit: "Better rand hedging and global exposure"
							}
						]
					} : null,
					
					riskMetrics: {
						type: "gauge_chart",
						riskLevel: "Moderate",
						volatility: "12.5%",
						sharpeRatio: 1.24,
						maxDrawdown: "-8.2%",
						diversificationScore: 85
					},
					
					taxEfficiency: {
						type: "progress_bar",
						taxFreUtilization: {
							used: 24000,
							limit: 36000,
							percentage: 66.7,
							monthsRemaining: 6
						},
						taxSavings: {
							thisYear: 8400,
							projected: 12600,
							lifetime: "R180,000+ if maximized until 65"
						}
					},
					
					interactiveElements: {
						buttons: [
							{ text: "📊 Rebalance Portfolio", action: "getInvestmentRecommendations", params: {} },
							{ text: "🎯 Optimize Tax-Free", action: "getSavingsStrategy", params: {} },
							{ text: "🌍 Explore Offshore", action: "getInvestmentRecommendations", params: { offshore: true } }
						],
						quickActions: [
							"Add to tax-free investments",
							"Book investment consultation",
							"View detailed performance",
							"Download tax certificates"
						]
					},
					
					projections: includeProjections ? {
						retirementForecast: {
							type: "projection_chart",
							scenarios: [
								{
									name: "Conservative (7%)",
									valueAt65: 5200000,
									monthlyIncome: 36400
								},
								{
									name: "Moderate (10%)",
									valueAt65: 8900000,
									monthlyIncome: 62300
								},
								{
									name: "Aggressive (12%)",
									valueAt65: 13400000,
									monthlyIncome: 93800
								}
							],
							currentTrajectory: "Moderate",
							timeToMillionaire: "8.5 years"
						},
						nextSteps: [
							"Increase monthly contributions by R1,500",
							"Maximize R36,000 tax-free allowance",
							"Consider 30% offshore allocation",
							"Review and rebalance quarterly"
						]
					} : null
				};
				
				return { content: [{ type: "text", text: JSON.stringify(dashboard, null, 2) }] };
			}
		);

		this.server.tool(
			"generateBudgetProgressDashboard",
			"Generate a visual budget progress dashboard with real-time tracking and Investec optimization tips",
			{
				monthlyIncome: z.number(),
				age: z.number().optional(),
				budgetCategories: z.array(z.object({
					category: z.string(),
					budgeted: z.number(),
					spent: z.number().optional()
				})).optional(),
				savingsGoal: z.number().optional()
			},
			async ({ monthlyIncome, age, budgetCategories, savingsGoal }) => {
				const isYoungProfessional = age && age < 30;
				const defaultBudget = [
					{ category: "Housing", budgeted: monthlyIncome * 0.30, spent: monthlyIncome * 0.28 },
					{ category: "Food & Dining", budgeted: monthlyIncome * 0.15, spent: monthlyIncome * 0.16 },
					{ category: "Transportation", budgeted: monthlyIncome * 0.10, spent: monthlyIncome * 0.12 },
					{ category: "Entertainment", budgeted: monthlyIncome * 0.08, spent: monthlyIncome * 0.09 },
					{ category: "Utilities", budgeted: monthlyIncome * 0.07, spent: monthlyIncome * 0.06 },
					{ category: "Shopping", budgeted: monthlyIncome * 0.05, spent: monthlyIncome * 0.07 },
					{ category: "Savings & Investments", budgeted: monthlyIncome * 0.25, spent: monthlyIncome * 0.22 }
				];
				
				const budget = budgetCategories || defaultBudget;
				const totalBudgeted = budget.reduce((sum, cat) => sum + cat.budgeted, 0);
				const totalSpent = budget.reduce((sum, cat) => sum + (cat.spent || 0), 0);
				
				const dashboard = {
					type: "budget_dashboard",
					title: "🎯 Budget Progress Dashboard",
					timestamp: new Date().toISOString(),
					youngProfessionalStatus: isYoungProfessional,
					
					visualComponents: {
						overallProgress: {
							type: "radial_progress",
							title: "Monthly Budget Progress",
							percentage: Math.round((totalSpent / totalBudgeted) * 100),
							spent: totalSpent,
							budgeted: totalBudgeted,
							remaining: totalBudgeted - totalSpent,
							status: totalSpent <= totalBudgeted ? "on_track" : "over_budget",
							color: totalSpent <= totalBudgeted ? "#4ECDC4" : "#FF6B6B"
						},
						
						categoryBreakdown: {
							type: "horizontal_bar_chart",
							title: "Budget vs Actual by Category",
							data: budget.map(cat => ({
								category: cat.category,
								budgeted: cat.budgeted,
								spent: cat.spent || 0,
								percentage: Math.round(((cat.spent || 0) / cat.budgeted) * 100),
								status: (cat.spent || 0) <= cat.budgeted ? "under" : "over",
								variance: (cat.spent || 0) - cat.budgeted,
								color: (cat.spent || 0) <= cat.budgeted ? "#4ECDC4" : "#FF6B6B"
							}))
						},
						
						dailySpendingTrend: {
							type: "line_chart",
							title: "Daily Spending Trend",
							data: {
								labels: Array.from({length: 30}, (_, i) => `Day ${i + 1}`),
								datasets: [
									{
										label: "Daily Spending",
										data: Array.from({length: 30}, () => Math.round(totalSpent / 30 + (Math.random() - 0.5) * 200)),
										color: "#45B7D1"
									},
									{
										label: "Daily Budget",
										data: Array.from({length: 30}, () => Math.round(totalBudgeted / 30)),
										color: "#96CEB4",
										type: "dashed"
									}
								]
							}
						},
						
						savingsProgress: {
							type: "progress_ring",
							title: "Savings Goal Progress",
							current: (savingsGoal || monthlyIncome * 0.25) * 0.88, // 88% progress
							target: savingsGoal || monthlyIncome * 0.25,
							percentage: 88,
							daysRemaining: 8,
							onTrack: true
						}
					},
					
					keyMetrics: {
						budgetUtilization: Math.round((totalSpent / totalBudgeted) * 100),
						savingsRate: Math.round(((monthlyIncome - totalSpent) / monthlyIncome) * 100),
						daysUntilPayday: 8,
						avgDailySpending: Math.round(totalSpent / 22), // 22 days into month
						budgetRemaining: totalBudgeted - totalSpent
					},
					
					investecOptimizations: isYoungProfessional ? {
						accountBenefits: [
							{
								benefit: "R320/month account fee",
								savings: "R2,180/month vs standard banking",
								impact: "Extra R26,160/year for investments"
							},
							{
								benefit: "No-fee savings accounts",
								savings: "R150/month in account fees",
								impact: "R1,800/year additional savings"
							}
						],
						smartBudgetTips: [
							{
								category: "Banking Costs",
								tip: "Switch to Young Professional account",
								potential: "Save R2,180/month in banking fees",
								action: "Apply for Investec Young Professional account"
							},
							{
								category: "Credit Strategy",
								tip: "Use prime -1% for major purchases",
								potential: "Save 1% annually on loans",
								action: "Time vehicle/property purchases strategically"
							}
						]
					} : null,
					
					alerts: {
						overBudget: budget.filter(cat => (cat.spent || 0) > cat.budgeted).map(cat => ({
							category: cat.category,
							overage: (cat.spent || 0) - cat.budgeted,
							percentage: Math.round(((cat.spent || 0) / cat.budgeted - 1) * 100)
						})),
						recommendations: [
							"Food & Dining is 7% over budget - consider meal planning",
							"Transportation exceeded budget - explore ride-sharing alternatives",
							"Great job staying under budget on Housing and Utilities!"
						]
					},
					
					interactiveElements: {
						buttons: [
							{ text: "💡 Budget Optimization", action: "generateBudgetPlan", params: { monthlyIncome } },
							{ text: "🎯 Adjust Categories", action: "updateBudgetCategories", params: {} },
							{ text: "📊 Spending Analysis", action: "analyzeSpendingPatterns", params: {} }
						],
						quickActions: [
							"Set spending alerts",
							"Automate savings transfers",
							"View transaction history",
							"Download budget report"
						]
					},
					
					projections: {
						monthEndForecast: {
							estimatedTotal: Math.round(totalSpent * 1.36), // Project to month end
							budgetVariance: Math.round((totalSpent * 1.36) - totalBudgeted),
							adjustmentNeeded: Math.max(0, Math.round((totalSpent * 1.36) - totalBudgeted))
						},
						yearEndProjection: {
							totalSavings: Math.round((monthlyIncome - totalSpent) * 12),
							investmentPotential: Math.round((monthlyIncome - totalSpent) * 12 * 1.1), // 10% growth
							taxFreeBenefit: 36000 // Max tax-free contribution
						}
					}
				};
				
				return { content: [{ type: "text", text: JSON.stringify(dashboard, null, 2) }] };
			}
		);

		this.server.tool(
			"generateFinancialHealthDashboard",
			"Generate a comprehensive financial health dashboard with visual metrics and young professional insights",
			{
				userId: z.string().optional(),
				age: z.number(),
				monthlyIncome: z.number(),
				totalAssets: z.number().optional(),
				totalDebt: z.number().optional(),
				monthlySavings: z.number().optional()
			},
			async ({ userId, age, monthlyIncome, totalAssets, totalDebt, monthlySavings }) => {
				const isYoungProfessional = age < 30;
				const assets = totalAssets || monthlyIncome * 8; // Estimate if not provided
				const debt = totalDebt || monthlyIncome * 2; // Estimate if not provided
				const savings = monthlySavings || monthlyIncome * 0.25;
				
				// Calculate financial health score
				const netWorth = assets - debt;
				const debtToIncomeRatio = (debt * 12) / (monthlyIncome * 12);
				const savingsRate = savings / monthlyIncome;
				const emergencyFundMonths = assets * 0.3 / monthlyIncome; // Assume 30% in emergency fund
				
				const healthScore = Math.min(100, Math.max(0, 
					(savingsRate * 30) + 
					(Math.max(0, 6 - emergencyFundMonths) * -5) + 
					(Math.max(0, debtToIncomeRatio - 0.3) * -20) + 
					50
				));
				
				const dashboard = {
					type: "financial_health_dashboard",
					title: "💚 Financial Health Overview",
					timestamp: new Date().toISOString(),
					youngProfessionalStatus: isYoungProfessional,
					overallScore: Math.round(healthScore),
					
					visualComponents: {
						healthScore: {
							type: "gauge_chart",
							title: "Financial Health Score",
							score: Math.round(healthScore),
							maxScore: 100,
							ranges: [
								{ min: 0, max: 40, label: "Needs Improvement", color: "#FF6B6B" },
								{ min: 41, max: 70, label: "Good", color: "#FFEAA7" },
								{ min: 71, max: 85, label: "Excellent", color: "#4ECDC4" },
								{ min: 86, max: 100, label: "Outstanding", color: "#00B894" }
							],
							currentRange: healthScore > 85 ? "Outstanding" : healthScore > 70 ? "Excellent" : healthScore > 40 ? "Good" : "Needs Improvement"
						},
						
						netWorthBreakdown: {
							type: "waterfall_chart",
							title: "Net Worth Composition",
							data: [
								{ category: "Total Assets", value: assets, type: "positive", color: "#4ECDC4" },
								{ category: "Total Debt", value: -debt, type: "negative", color: "#FF6B6B" },
								{ category: "Net Worth", value: netWorth, type: "total", color: "#00B894" }
							]
						},
						
						keyRatios: {
							type: "metric_cards",
							title: "Key Financial Ratios",
							metrics: [
								{
									name: "Debt-to-Income",
									value: `${(debtToIncomeRatio * 100).toFixed(1)}%`,
									benchmark: "< 30%",
									status: debtToIncomeRatio < 0.3 ? "good" : "warning",
									color: debtToIncomeRatio < 0.3 ? "#4ECDC4" : "#FFEAA7"
								},
								{
									name: "Savings Rate",
									value: `${(savingsRate * 100).toFixed(1)}%`,
									benchmark: "> 20%",
									status: savingsRate > 0.2 ? "excellent" : "needs_improvement",
									color: savingsRate > 0.2 ? "#00B894" : "#FF6B6B"
								},
								{
									name: "Emergency Fund",
									value: `${emergencyFundMonths.toFixed(1)} months`,
									benchmark: "3-6 months",
									status: emergencyFundMonths >= 3 ? "good" : "needs_improvement",
									color: emergencyFundMonths >= 3 ? "#4ECDC4" : "#FFEAA7"
								}
							]
						},
						
						progressTracking: {
							type: "progress_indicators",
							title: "Financial Milestones",
							milestones: [
								{
									name: "Emergency Fund",
									current: Math.round(assets * 0.3),
									target: monthlyIncome * 6,
									percentage: Math.round((assets * 0.3) / (monthlyIncome * 6) * 100),
									completed: (assets * 0.3) >= (monthlyIncome * 6)
								},
								{
									name: "Debt-Free Goal",
									current: Math.max(0, debt - (savings * 12)),
									target: debt,
									percentage: Math.round((1 - (Math.max(0, debt - (savings * 12)) / debt)) * 100),
									completed: debt <= (savings * 12)
								},
								{
									name: "Investment Portfolio",
									current: Math.round(assets * 0.7),
									target: monthlyIncome * 10,
									percentage: Math.round((assets * 0.7) / (monthlyIncome * 10) * 100),
									completed: (assets * 0.7) >= (monthlyIncome * 10)
								}
							]
						}
					},
					
					investecAdvantages: isYoungProfessional ? {
						youngProfessionalBenefits: [
							{
								benefit: "Reduced Banking Costs",
								impact: "R320/month vs R2,500+ elsewhere",
								healthImpact: "+2% to savings rate automatically"
							},
							{
								benefit: "Prime -1% Credit Rates",
								impact: "Save 1% annually on major loans",
								healthImpact: "Faster debt reduction and wealth building"
							},
							{
								benefit: "Tax-Free Investment Access",
								impact: "R36,000 annual tax-free growth",
								healthImpact: "Accelerated wealth accumulation"
							}
						],
						optimizationPlan: [
							{
								priority: "High",
								action: "Maximize Young Professional benefits",
								benefit: "Improve financial health score by 8-12 points",
								timeline: "Immediate"
							},
							{
								priority: "Medium",
								action: "Optimize tax-free investments",
								benefit: "Boost long-term wealth building by 15%",
								timeline: "Next 30 days"
							}
						]
					} : null,
					
					recommendations: {
						immediate: healthScore < 50 ? [
							"🚨 Focus on building emergency fund first",
							"💰 Switch to Investec Young Professional to save on fees",
							"📊 Track spending to identify cost reduction opportunities"
						] : [
							"🎯 Increase automated savings by R500/month",
							"📈 Consider increasing investment allocation",
							"🏦 Maximize Investec Young Professional benefits"
						],
						shortTerm: [
							"Set up automated tax-free investment contributions",
							"Review and optimize debt repayment strategy",
							"Build towards 6-month emergency fund"
						],
						longTerm: [
							"Aim for 30%+ savings rate by age 30",
							"Build diversified investment portfolio",
							"Plan for property purchase using innovative home loan"
						]
					},
					
					interactiveElements: {
						buttons: [
							{ text: "🎯 Improve Score", action: "getPersonalizedGuidance", params: { age, monthlyIncome } },
							{ text: "💰 Optimize Budget", action: "generateBudgetPlan", params: { monthlyIncome } },
							{ text: "📈 Investment Plan", action: "getInvestmentRecommendations", params: { age } }
						],
						quickActions: [
							"Book financial health consultation",
							"Apply for Young Professional account",
							"Set up automated savings",
							"Download detailed report"
						]
					},
					
					projections: {
						oneYearProjection: {
							estimatedScore: Math.min(100, healthScore + 15),
							netWorthGrowth: Math.round(netWorth * 1.15 + (savings * 12)),
							keyImprovements: [
								"Emergency fund fully funded",
								"Savings rate increased to 25%+",
								"Investment portfolio diversified"
							]
						},
						fiveYearOutlook: {
							projectedNetWorth: Math.round(netWorth * 2.5 + (savings * 60)),
							estimatedScore: 85,
							milestones: [
								"Debt-free status achieved",
								"6-figure investment portfolio",
								"Ready for property purchase"
							]
						}
					}
				};
				
				return { content: [{ type: "text", text: JSON.stringify(dashboard, null, 2) }] };
			}
		);
	}

	// Helper method for generating personalized recommendations
	private async generatePersonalizedRecommendations(
		persona: string, 
		age: number, 
		monthlyIncome: number, 
		currentSavings: number = 0, 
		financialGoals: string[] = [], 
		specificQuestion: string = "",
		isYoungProfessional: boolean
	) {
		const personaContext = {
			beginner: "This person is new to financial planning and needs simple, practical guidance with clear explanations.",
			intermediate: "This person understands basics but wants to optimize their finances and access better products.",
			advanced: "This person is financially sophisticated and wants competitive advantages and premium offerings."
		}[persona];
		
		const investecContext = isYoungProfessional ? 
			"They qualify for Investec Young Professional benefits: R320 account fee, prime -1% vehicle finance, innovative home loans, R25,000 life insurance, tax-free investments, no-fee savings." :
			"They should explore Investec's full Private Banking suite for wealth optimization.";

		try {
			const result = await generateText({
				model: getModel(model),
				system: `You are an Investec Private Banking financial advisor specializing in ${persona} clients. ${personaContext} ${investecContext} Provide specific, actionable recommendations that highlight Investec's competitive advantages.`,
				messages: [
					{
						role: "user",
						content: `Provide 3-5 specific financial recommendations for a ${persona} ${age}-year-old earning R${monthlyIncome}/month with R${currentSavings} saved. Goals: ${financialGoals.join(', ') || 'general wealth building'}. ${specificQuestion ? `Specific question: ${specificQuestion}` : ''} Focus on Investec products and benefits they should use.`
					}
				],
			});
			return result.text;
		} catch (error) {
			console.error('Error generating personalized recommendations:', error);
			return "Unable to generate personalized recommendations at this time. Please consult with an Investec financial adviser for tailored guidance.";
		}
	}

	// Helper method for generating beginner-specific responses
	private async generateBeginnerResponse(
		concern: string,
		age: number,
		currentSavings: number,
		monthlyIncome: number = 0,
		isYoungProfessional: boolean
	) {
		const investecContext = isYoungProfessional ? 
			"They qualify for Investec Young Professional benefits: R320 account fee, R25,000 life insurance, tax-free investments from R1,000/month, no-fee savings accounts." :
			"They can access Investec's beginner-friendly investment platform and professional guidance.";

		try {
			const result = await generateText({
				model: getModel(model),
				system: `You are an Investec financial adviser speaking to a complete beginner. Use simple language, avoid jargon, and focus on practical next steps. ${investecContext} Be encouraging and explain concepts clearly.`,
				messages: [
					{
						role: "user",
						content: `A ${age}-year-old with R${currentSavings} saved${monthlyIncome ? ` earning R${monthlyIncome}/month` : ''} is concerned about: "${concern}". Provide a simple, encouraging response that addresses their concern and shows how Investec can help them start investing safely.`
					}
				],
			});
			return result.text;
		} catch (error) {
			console.error('Error generating beginner response:', error);
			return "Don't worry - this is a common concern for new investors! The best approach is to start small, learn as you go, and get professional guidance. An Investec financial adviser can address this specific concern and help you feel confident about your first investment steps.";
		}
	}
}