// Heads up: This is the code for your ChatAgent, each user gets routed to a unique instance of this agent.

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  createDataStreamResponse,
  streamText,
  type StreamTextOnFinishCallback,
  type ToolSet,
  tool,
  type LanguageModelV1,
} from "ai";
import { z } from "zod";
import { createAzure } from '@ai-sdk/azure';
import { openai } from '@ai-sdk/openai';
import { processToolCalls } from "./utils";
import { env } from "cloudflare:workers";
import { registerToolsFromMcpServer } from "./tools";
import { getModel } from "./utils";

// To use Cloudflare Worker AI, uncomment the below
// import { createWorkersAI } from 'workers-ai-provider';
// const workersai = createWorkersAI({ binding: env.AI });
// const model = workersai("@hf/nousresearch/hermes-2-pro-mistral-7b")

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



interface ChatAgentState {
  userName?: string;
  userProfile?: {
    age?: number;
    profession?: string;
    monthlyIncome?: number;
    financialGoals?: string[];
    riskTolerance?: "conservative" | "moderate" | "aggressive";
  };
  isProfileComplete?: boolean;
}


/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env, ChatAgentState> {
  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   */

  initialState: ChatAgentState = {
    isProfileComplete: false,
  };

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    const {mcpAgentTools, executions, mcpConnectionId } = await registerToolsFromMcpServer(
        this.mcp,
        env.IS_LOCAL ? "http://localhost:5173/sse" : env.MCP_TOOLS_URL
       );

       

    // Tools that are locally defined to the ChatAgent (as opposed to the McpAgent)
    // You can use these tools to manage the state of the Chat Agent 
    // There is a limitation when using the McpAgent to do this, since at the moment you cannot guarantee that
    // the McpAgent you connect to via the ChatAgent's MCP client is always the same one
    // ================= CHAT AGENT DEFINED TOOLS =========================
    const getUserInfo = tool({
      description: "Get the user's name and profile information",
      parameters: z.object({}),
      execute: async () => {
        const profile = this.state.userProfile || {};
        return { 
          content: [{ 
            type: "text", 
            text: `User: ${this.state.userName || "unknown"}
Profile: ${JSON.stringify(profile, null, 2)}
Profile Complete: ${this.state.isProfileComplete || false}` 
          }] 
        };  
      },
    });

    const updateUserProfile = tool({
      description: "Update the user's financial profile information",
      parameters: z.object({
        age: z.number().optional(),
        profession: z.string().optional(),
        monthlyIncome: z.number().optional(),
        financialGoals: z.array(z.string()).optional(),
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).optional()
      }),
      execute: async ({ age, profession, monthlyIncome, financialGoals, riskTolerance }) => {
        // Update the user profile
        this.state.userProfile = {
          ...this.state.userProfile,
          ...(age && { age }),
          ...(profession && { profession }),
          ...(monthlyIncome && { monthlyIncome }),
          ...(financialGoals && { financialGoals }),
          ...(riskTolerance && { riskTolerance })
        };

        // Check if profile is complete
        const profile = this.state.userProfile;
        this.state.isProfileComplete = !!(
          profile.age && 
          profile.monthlyIncome && 
          profile.financialGoals && 
          profile.financialGoals.length > 0
        );

        return { 
          content: [{ 
            type: "text", 
            text: `Profile updated successfully! Profile complete: ${this.state.isProfileComplete}` 
          }] 
        };
      },
    });

    const setUserName = tool({
      description: "Set or update the user's name",
      parameters: z.object({
        name: z.string()
      }),
      execute: async ({ name }) => {
        this.state.userName = name;
        return { 
          content: [{ 
            type: "text", 
            text: `Hello ${name}! I'm your personal financial coach from Investec. Let's work together to achieve your financial goals!` 
          }] 
        };
      },
    });

    // ===================== END CHAT AGENT DEFINED TOOLS ========================

    const chatAgentTools = { getUserInfo, updateUserProfile, setUserName };

    // Collect all tools, including MCP tools
    const allTools = {
      ...chatAgentTools,
      ...mcpAgentTools
    };

    // Create a streaming response that handles both text and tool outputs
    const dataStreamResponse = createDataStreamResponse({
      execute: async (dataStream) => {
        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: this.messages,
          dataStream,
          tools: allTools,
          executions : executions
        });

        // Stream the AI response using the Workers AI model
        const result = streamText({
          model : getModel(model),
          system: `You are an expert financial coach working for Investec, specializing in helping young South African professionals manage their finances. Your goal is to provide personalized, practical financial advice.

IMPORTANT PERSONALITY AND BEHAVIOR:
- Be friendly, encouraging, and professional
- Use South African context (Rand currency, local financial products, SARS tax implications)
- Always personalize advice based on the user's profile
- If the user's profile is incomplete, guide them to complete it first
- Proactively use your financial tools to provide data-driven insights
- Be motivational but realistic about financial goals

CONVERSATION FLOW:
1. If this is a new user, introduce yourself and get their name using setUserName
2. If profile incomplete, gather: age, profession, monthly income, financial goals, risk tolerance using updateUserProfile
3. Once profile is complete, provide personalized coaching using your financial tools

FINANCIAL EXPERTISE AREAS:
- Budgeting and expense tracking
- Investment recommendations (SA equity, ETFs, bonds, unit trusts)
- Goal setting and tracking (emergency funds, retirement, property, etc.)
- Tax optimization strategies
- Debt management
- Financial wellness and behavioral coaching

Always use your available tools to provide specific, actionable advice rather than generic responses.`,
          messages: processedMessages,
          tools: allTools,
          onFinish: async (args) => {
            onFinish(
              args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]
            );
            await this.mcp.closeConnection(mcpConnectionId);
          },
          onError: (error) => {
            console.error("Error while streaming:", error);
          },
          maxSteps: 100,
        });

        // Merge the AI response stream with tool execution outputs
        result.mergeIntoDataStream(dataStream);

        // wait for 0.5 seconds
        await new Promise((resolve) => setTimeout(resolve, 500));
      },
    });


    return dataStreamResponse;
  }
}