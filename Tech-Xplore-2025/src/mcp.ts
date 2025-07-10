import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from "cloudflare:workers";
import { generateText, type LanguageModelV1 } from "ai";
import { createAzure } from "@ai-sdk/azure";
import { openai } from "@ai-sdk/openai";
import { getModel } from "./utils";

// Based on value of `env.MODEL_PROVIDER`, we will either use Azure or OpenAI as the model provider.
let model: LanguageModelV1 | undefined = undefined;
if (env.MODEL_PROVIDER === "azure") {
  const azure = createAzure({
    resourceName: env.AI_AZURE_RESOURCE_NAME,
    apiKey: env.AI_AZURE_API_KEY,
  });
  if (!env.AI_AZURE_MODEL_DEPLOYMENT) {
    throw new Error("AI_AZURE_MODEL_DEPLOYMENT is not set in environment variables");
  }
  model = azure(env.AI_AZURE_MODEL_DEPLOYMENT);
} else {
  if (!env.OPENAI_API_MODEL) {
    throw new Error("OPENAI_API_MODEL is not set in environment variables");
  }
  model = openai(env.OPENAI_API_MODEL);
}

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "Starter",
    version: "1.0.0",
  });

  async init() {
    // Financial Coaching Tools for Investec Challenge, tailored for beginners

    this.server.tool(
      "analyzeSpendingPatterns",
      "Analyze your spending to understand where your money goes and get simple saving tips",
      {
        monthlyIncome: z.number().optional().describe("Your monthly income in ZAR (optional)"),
        expenses: z
          .array(
            z.object({
              category: z.string().describe("Type of spending (e.g., groceries, transport)"),
              amount: z.number().describe("Amount spent in ZAR"),
              description: z.string().optional().describe("Optional details about the expense"),
            })
          )
          .optional()
          .describe("List of your recent expenses (optional)"),
      },
      async ({ monthlyIncome, expenses }) => {
        if (env.IS_LOCAL) {
          const mockAnalysis = {
            totalSpending: 15000,
            topCategories: ["Groceries: R3,500", "Entertainment: R2,800", "Transport: R2,200"],
            savingsRate: monthlyIncome ? ((monthlyIncome - 15000) / monthlyIncome * 100).toFixed(1) : "25.0",
            beginnerTips: [
              "Savings rate shows how much of your income you keep. Aim for at least 10% to start building wealth.",
              "Groceries are a big expense. Try shopping at budget stores like Shoprite to save.",
              "Entertainment spending can add up. Look for free local events to enjoy instead.",
            ],
          };
          return {
            content: [
              {
                type: "text",
                text: `**Your Spending Summary** (in ZAR):\n- **Total Spending**: R${mockAnalysis.totalSpending}\n- **Top Expenses**: ${mockAnalysis.topCategories.join(", ")}\n- **Savings Rate**: ${mockAnalysis.savingsRate}% (this means you save ${mockAnalysis.savingsRate}% of your income)\n\n**Simple Tips for Beginners**:\n${mockAnalysis.beginnerTips.map((tip) => `- ${tip}`).join("\n")}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "We would connect to your bank account (like Investec) to analyze your spending. For now, try listing your expenses to get started!",
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "generateBudgetPlan",
      "Create a simple budget plan to help you save and reach your goals",
      {
        monthlyIncome: z.number().describe("Your monthly income in ZAR"),
        financialGoals: z.array(z.string()).describe("Your goals, like saving for a car or vacation"),
        currentAge: z.number().optional().describe("Your age (optional)"),
        retirementAge: z.number().optional().describe("Age you plan to retire (optional)"),
      },
      async ({ monthlyIncome, financialGoals, currentAge, retirementAge }) => {
        const result = await generateText({
          model: getModel(model),
          system: "You are a friendly financial advisor helping young South African professionals with no investment experience. Use simple language, avoid jargon, and explain terms. Create a budget plan with clear percentages and rand amounts.",
          messages: [
            {
              role: "user",
              content: `Create a simple budget plan for someone earning R${monthlyIncome} monthly. Their goals are: ${financialGoals.join(", ")}. ${currentAge ? `They are ${currentAge} years old` : ""} ${retirementAge ? `and want to retire at ${retirementAge}` : ""}. Use percentages (e.g., 50% for essentials) and rand amounts. Explain terms like 'savings' or 'emergency fund' for beginners.`,
            },
          ],
        });
        return {
          content: [
            {
              type: "text",
              text: `${result.text}\n\n**Beginner Tip**: A budget helps you control your money. 'Essentials' are things you need (like rent), and an 'emergency fund' is money saved for unexpected costs, like car repairs.`,
            },
          ],
        };
      }
    );

    this.server.tool(
      "getInvestmentRecommendations",
      "Get easy-to-understand investment ideas based on how much risk you’re comfortable with",
      {
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).describe("Your comfort with risk: conservative (safe), moderate (balanced), aggressive (higher risk for more reward)"),
        investmentAmount: z.number().describe("How much money you want to invest in ZAR"),
        timeHorizon: z.number().describe("How many years you plan to keep the money invested"),
        investmentGoals: z.array(z.string()).describe("Your goals, like buying a house or saving for retirement"),
      },
      async ({ riskTolerance, investmentAmount, timeHorizon, investmentGoals }) => {
        if (env.IS_LOCAL) {
          const mockRecommendations = {
            riskProfile: riskTolerance,
            recommendedPortfolio: {
              "SA Equity Funds": riskTolerance === "aggressive" ? "40%" : riskTolerance === "moderate" ? "30%" : "20%",
              "Global Equity Funds": riskTolerance === "aggressive" ? "30%" : riskTolerance === "moderate" ? "25%" : "15%",
              "Bonds": riskTolerance === "aggressive" ? "20%" : riskTolerance === "moderate" ? "30%" : "45%",
              "Cash/Money Market": riskTolerance === "aggressive" ? "10%" : riskTolerance === "moderate" ? "15%" : "20%",
            },
            beginnerExplanation: [
              "Equity funds are like owning parts of companies. They can grow but have some risk.",
              "Bonds are like lending money to the government or companies. They’re safer but grow slower.",
              "Cash/Money Market is like a savings account—very safe but low returns.",
            ],
            specificProducts: [
              "Investec Equity Fund (good for growth)",
              "Satrix Top 40 ETF (tracks big SA companies)",
              "RSA Retail Savings Bonds (safe, government-backed)",
            ],
            projectedReturns: `Expected annual growth: ${riskTolerance === "aggressive" ? "12-15%" : riskTolerance === "moderate" ? "8-12%" : "6-9%"}`,
          };
          return {
            content: [
              {
                type: "text",
                text: `**Your Investment Ideas**:\n- **Risk Level**: ${mockRecommendations.riskProfile}\n- **Suggested Mix**:\n  - SA Equity Funds: ${mockRecommendations.recommendedPortfolio["SA Equity Funds"]}\n  - Global Equity Funds: ${mockRecommendations.recommendedPortfolio["Global Equity Funds"]}\n  - Bonds: ${mockRecommendations.recommendedPortfolio["Bonds"]}\n  - Cash/Money Market: ${mockRecommendations.recommendedPortfolio["Cash/Money Market"]}\n- **Products to Consider**: ${mockRecommendations.specificProducts.join(", ")}\n- **Expected Growth**: ${mockRecommendations.projectedReturns}\n\n**For Beginners**:\n${mockRecommendations.beginnerExplanation.map((tip) => `- ${tip}`).join("\n")}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "Investment ideas would come from real market data. Try a low-risk option like RSA Retail Savings Bonds to start!",
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "trackFinancialGoals",
      "Track your savings goals and get tips to stay motivated",
      {
        goalType: z.enum(["emergency_fund", "house_deposit", "retirement", "vacation", "debt_payoff", "other"]).describe("What you’re saving for (e.g., emergency fund, vacation)"),
        targetAmount: z.number().describe("Total amount you want to save in ZAR"),
        currentAmount: z.number().describe("How much you’ve saved so far in ZAR"),
        monthlyContribution: z.number().describe("How much you save each month in ZAR"),
      },
      async ({ goalType, targetAmount, currentAmount, monthlyContribution }) => {
        const remaining = targetAmount - currentAmount;
        const monthsToGoal = Math.ceil(remaining / monthlyContribution);
        const progressPercentage = ((currentAmount / targetAmount) * 100).toFixed(1);

        const result = await generateText({
          model: getModel(model),
          system: "You are a motivational financial coach helping beginners in South Africa. Use simple, encouraging language and explain terms like 'progress percentage'.",
          messages: [
            {
              role: "user",
              content: `A beginner is saving for ${goalType.replace("_", " ")}. They want R${targetAmount}, have R${currentAmount} (${progressPercentage}% done), and save R${monthlyContribution} monthly. They need R${remaining} more and will reach their goal in ${monthsToGoal} months. Give encouraging feedback and simple tips to keep going.`,
            },
          ],
        });
        return {
          content: [
            {
              type: "text",
              text: `${result.text}\n\n**Beginner Tip**: Progress percentage shows how close you are to your goal. For example, 50% means you’re halfway there! Keep saving a little each month to stay on track.`,
            },
          ],
        };
      }
    );

    this.server.tool(
      "getPersonalizedFinancialTips",
      "Get daily financial tips tailored to your life as a beginner",
      {
        userProfile: z.object({
          age: z.number().describe("Your age"),
          profession: z.string().optional().describe("Your job (optional)"),
          monthlyIncome: z.number().describe("Your monthly income in ZAR"),
          mainFinancialChallenges: z.array(z.string()).describe("Your financial worries, like debt or saving"),
        }),
      },
      async ({ userProfile }) => {
        const result = await generateText({
          model: getModel(model),
          system: "You are a financial coach for young South Africans with no financial experience. Provide 3 simple, practical tips in plain language, avoiding jargon, tailored to their profile. Explain any financial terms used.",
          messages: [
            {
              role: "user",
              content: `Give 3 easy financial tips for a ${userProfile.age}-year-old ${userProfile.profession || "professional"} earning R${userProfile.monthlyIncome} monthly. Their challenges are: ${userProfile.mainFinancialChallenges.join(", ")}. Make tips actionable and relevant to South Africa.`,
            },
          ],
        });
        return {
          content: [
            {
              type: "text",
              text: `${result.text}\n\n**Beginner Tip**: A financial tip is a small action you can take to improve your money habits, like saving a little each month or avoiding unnecessary debt.`,
            },
          ],
        };
      }
    );

    this.server.tool(
      "getSouthAfricaInvestmentOptions",
      "Get simple investment options for South Africans new to investing",
      {
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).describe("Your comfort with risk: conservative (safe), moderate (balanced), aggressive (higher risk)"),
        investmentAmount: z.number().describe("How much money you want to invest in ZAR"),
        investmentGoals: z.array(z.string()).describe("Your goals, like saving for a car or house"),
        timeHorizon: z.number().optional().describe("How many years you’ll keep the money invested (optional)"),
      },
      async ({ riskTolerance, investmentAmount, investmentGoals, timeHorizon }) => {
        if (env.IS_LOCAL) {
          const mockRecommendations = {
            riskProfile: riskTolerance,
            recommendedOptions: [
              {
                name: "Satrix MSCI World ETF",
                type: "Exchange Traded Fund",
                suitableFor: riskTolerance === "aggressive" ? "High-growth seekers" : riskTolerance === "moderate" ? "Balanced investors" : "Low-risk investors",
                minimumInvestment: 1000,
                annualReturn: riskTolerance === "aggressive" ? "10-14%" : riskTolerance === "moderate" ? "7-10%" : "4-7%",
              },
              {
                name: "RSA Retail Savings Bonds",
                type: "Government Bonds",
                suitableFor: "Conservative investors",
                minimumInvestment: 1000,
                annualReturn: "8.25-9.5%",
              },
              {
                name: "Allan Gray Balanced Fund",
                type: "Unit Trust",
                suitableFor: riskTolerance === "moderate" || riskTolerance === "aggressive" ? "Growth-oriented investors" : "Balanced investors",
                minimumInvestment: 5000,
                annualReturn: riskTolerance === "aggressive" ? "9-12%" : "6-9%",
              },
            ],
            beginnerExplanation: [
              "An ETF (Exchange Traded Fund) is like a basket of companies you can buy into. It’s a simple way to start investing.",
              "Government Bonds are safe because the government promises to pay you back with interest.",
              "A Unit Trust pools your money with others to invest in different things, managed by experts.",
            ],
            recommendations: [
              `Start with ${riskTolerance === "aggressive" ? "60%" : riskTolerance === "moderate" ? "50%" : "30%"} in equities for ${investmentGoals.join(" and ")}.`,
              "Use a tax-free savings account to avoid tax on your investment growth.",
              "Start small with R1,000 in bonds or ETFs to learn how investing works.",
            ],
          };
          return {
            content: [
              {
                type: "text",
                text: `**Your Investment Options**:\n${mockRecommendations.recommendedOptions
                  .map(
                    (opt) =>
                      `- **${opt.name}** (${opt.type}): For ${opt.suitableFor}, minimum R${opt.minimumInvestment}, expected return ${opt.annualReturn}`
                  )
                  .join("\n")}\n\n**For Beginners**:\n${mockRecommendations.beginnerExplanation.map((tip) => `- ${tip}`).join("\n")}\n\n**Next Steps**:\n${mockRecommendations.recommendations.map((tip) => `- ${tip}`).join("\n")}`,
              },
            ],
          };
        } else {
          const result = await generateText({
            model: getModel(model),
            system: "You are a financial advisor helping beginners in South Africa. Provide simple, specific investment options (e.g., ETFs, bonds) with clear explanations of terms and steps to start investing.",
            messages: [
              {
                role: "user",
                content: `Suggest easy investment options for a beginner in South Africa with a ${riskTolerance} risk tolerance, R${investmentAmount} to invest, and goals of ${investmentGoals.join(", ")}. ${timeHorizon ? `They plan to invest for ${timeHorizon} years.` : ""} Include specific products and expected returns, and explain terms in simple language.`,
              },
            ],
          });
          return {
            content: [
              {
                type: "text",
                text: `${result.text}\n\n**Beginner Tip**: Investing means putting your money into things that can grow, like companies or bonds. Start small and choose safer options like bonds if you’re nervous.`,
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "getBeginnerInvestmentGuide",
      "Get a step-by-step guide to start investing for beginners with no experience",
      {
        monthlyIncome: z.number().describe("Your monthly income in ZAR"),
        savingsAmount: z.number().describe("How much you’ve saved to invest in ZAR"),
        financialGoals: z.array(z.string()).describe("Your goals, like buying a car or saving for a house"),
      },
      async ({ monthlyIncome, savingsAmount, financialGoals }) => {
        if (env.IS_LOCAL) {
          const mockGuide = {
            steps: [
              "Step 1: Open a bank account with Investec or another bank to manage your money safely.",
              "Step 2: Save at least 10% of your income (R" + (monthlyIncome * 0.1).toFixed(0) + ") each month to build your investment fund.",
              "Step 3: Start with a safe option like RSA Retail Savings Bonds (minimum R1,000, earns 8.25-9.5% per year).",
              "Step 4: Use a tax-free savings account to invest up to R36,000 per year without paying tax on growth.",
              "Step 5: Talk to a financial advisor at Investec to learn about ETFs or unit trusts for your goals (" + financialGoals.join(", ") + ").",
            ],
            beginnerTips: [
              "Investing is like planting a seed—it grows over time if you’re patient.",
              "Start with small amounts (even R500) to get comfortable.",
              "Always keep some money in an emergency fund before investing.",
            ],
          };
          return {
            content: [
              {
                type: "text",
                text: `**Beginner’s Guide to Investing** (for R${savingsAmount} saved, goals: ${financialGoals.join(", ")}):\n${mockGuide.steps.map((step) => `- ${step}`).join("\n")}\n\n**Tips for New Investors**:\n${mockGuide.beginnerTips.map((tip) => `- ${tip}`).join("\n")}`,
              },
            ],
          };
        } else {
          const result = await generateText({
            model: getModel(model),
            system: "You are a financial coach helping young South Africans with no investment experience. Provide a step-by-step guide to start investing, using simple language and explaining terms. Focus on practical steps and South African options like Investec accounts or RSA Bonds.",
            messages: [
              {
                role: "user",
                content: `Create a 5-step guide for a beginner earning R${monthlyIncome} monthly, with R${savingsAmount} saved, and goals of ${financialGoals.join(", ")}. Explain terms like 'investment' and 'returns' in simple language.`,
              },
            ],
          });
          return {
            content: [
              {
                type: "text",
                text: `${result.text}\n\n**Beginner Tip**: An investment is money you put into something (like a bond) to grow it over time. Returns are the extra money you earn from it.`,
              },
            ],
          };
        }
      }
    );
  }
}