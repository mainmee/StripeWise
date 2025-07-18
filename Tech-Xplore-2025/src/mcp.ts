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
  model = openai(env.OPENAI_API_MODEL);
}


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
				monthlyIncome: z.number().optional(),
				expenses: z.array(z.object({
					category: z.string(),
					amount: z.number(),
					description: z.string().optional()
				})).optional()
			},
			async ({ monthlyIncome, expenses }) => {
				if (env.IS_LOCAL) {
					// Mock spending analysis for demo
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
					return { content: [{ type: "text", text: JSON.stringify(mockAnalysis, null, 2) }] };
				} else {
					// Here you would integrate with Investec's API or your backend API
					return { content: [{ type: "text", text: "Spending analysis would connect to real banking data here" }] };
				}
			}
		);

		this.server.tool(
			"generateBudgetPlan",
			"Create a personalized budget plan based on income and goals",
			{
				monthlyIncome: z.number(),
				financialGoals: z.array(z.string()),
				currentAge: z.number().optional(),
				retirementAge: z.number().optional()
			},
			async ({ monthlyIncome, financialGoals, currentAge, retirementAge }) => {
				const result = await generateText({
					model: getModel(model),
					system: "You are an expert financial advisor specializing in creating personalized budget plans for young professionals in South Africa. Provide practical, actionable advice.",
					messages: [
						{
							role: "user",
							content: `Create a detailed budget plan for someone with monthly income of R${monthlyIncome}. Their financial goals are: ${financialGoals.join(', ')}. ${currentAge ? `They are ${currentAge} years old` : ''} ${retirementAge ? `and want to retire at ${retirementAge}` : ''}. Include specific rand amounts and percentages.`
						}
					],
				});
				return { content: [{ type: "text", text: result.text }] };
			}
		);

		this.server.tool(
			"getInvestmentRecommendations",
			"Provide personalized investment recommendations based on risk profile and goals",
			{
				riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
				investmentAmount: z.number(),
				timeHorizon: z.number(), // years
				investmentGoals: z.array(z.string())
			},
			async ({ riskTolerance, investmentAmount, timeHorizon, investmentGoals }) => {
				if (env.IS_LOCAL) {
					const mockRecommendations = {
						riskProfile: riskTolerance,
						recommendedPortfolio: {
							"SA Equity Funds": riskTolerance === "aggressive" ? "40%" : riskTolerance === "moderate" ? "30%" : "20%",
							"Global Equity Funds": riskTolerance === "aggressive" ? "30%" : riskTolerance === "moderate" ? "25%" : "15%",
							"Bonds": riskTolerance === "aggressive" ? "20%" : riskTolerance === "moderate" ? "30%" : "45%",
							"Cash/Money Market": riskTolerance === "aggressive" ? "10%" : riskTolerance === "moderate" ? "15%" : "20%"
						},
						specificProducts: [
							"Investec Equity Fund",
							"Satrix Top 40 ETF",
							"Government Retail Savings Bonds"
						],
						projectedReturns: `Expected annual return: ${riskTolerance === "aggressive" ? "12-15%" : riskTolerance === "moderate" ? "8-12%" : "6-9%"}`
					};
					return { content: [{ type: "text", text: JSON.stringify(mockRecommendations, null, 2) }] };
				} else {
					// Integration point for real investment data
					return { content: [{ type: "text", text: "Investment recommendations would connect to real market data here" }] };
				}
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
			"Get daily personalized financial tips based on user profile",
			{
				userProfile: z.object({
					age: z.number(),
					profession: z.string().optional(),
					monthlyIncome: z.number(),
					mainFinancialChallenges: z.array(z.string())
				})
			},
			async ({ userProfile }) => {
				const result = await generateText({
					model: getModel(model),
					system: "You are a financial wellness coach for young South African professionals. Provide practical, culturally relevant financial tips.",
					messages: [
						{
							role: "user",
							content: `Provide 3 personalized financial tips for a ${userProfile.age}-year-old ${userProfile.profession || 'professional'} earning R${userProfile.monthlyIncome} per month. Their main challenges are: ${userProfile.mainFinancialChallenges.join(', ')}. Make tips specific and actionable for the South African context.`
						}
					],
				});
				return { content: [{ type: "text", text: result.text }] };
			}
		);
	}
}