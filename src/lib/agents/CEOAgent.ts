import { BaseChain, LLMChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIAgentTokenBufferMemory } from "langchain/agents/toolkits";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChainValues } from "@langchain/core/utils/types";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { Campaign, Creator, CreatorContactPreference } from "./types";

const OUTREACH_STAGES = {
  "1": "Initial Analysis: Analyze campaign requirements and creator profiles",
  "2": "Strategy Planning: Determine optimal communication channels and sequence",
  "3": "Execution: Execute the communication plan in order of priority",
  "4": "Monitoring: Track responses and adjust strategy if needed",
  "5": "Completion: Finalize the outreach process"
};

export class CEOAgent extends BaseChain {
  declare memory: OpenAIAgentTokenBufferMemory;
  private llm: ChatOpenAI;
  private campaign: Campaign;
  private creators: Creator[];
  private currentStage: string = "1";
  private executionPlan: any = null;
  private stageAnalyzerChain: LLMChain;
  private plannerChain: LLMChain;

  // Add rate limiting properties
  private readonly MIN_DELAY_BETWEEN_ACTIONS = 5000; // 5 seconds
  private readonly MAX_ACTIONS_PER_MINUTE = 10;
  private actionCount: number = 0;
  private lastActionTime: number = 0;

  constructor(
    llm: ChatOpenAI,
    campaign: Campaign,
    creators: Creator[]
  ) {
    super();
    this.llm = llm;
    this.campaign = campaign;
    this.creators = creators;
    
    // Initialize memory
    this.memory = new OpenAIAgentTokenBufferMemory({
      llm: this.llm,
      memoryKey: "chat_history",
      outputKey: "output",
      returnMessages: true
    });

    // Initialize stage analyzer chain
    const analyzerSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
      "You are a CEO agent analyzing the current stage of an influencer marketing campaign outreach process. " +
      "Your role is to determine the most appropriate next stage based on the current situation and progress."
    );

    const analyzerHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
      "Current Stage: {current_stage}\n\n" +
      "Stage Descriptions:\n" +
      "1. Initial Analysis - Review campaign requirements and analyze creator profiles\n" +
      "2. Strategy Planning - Plan communication approach and prioritize creators\n" +
      "3. Execution - Implement outreach strategy and send communications\n" +
      "4. Monitoring - Track responses and engagement\n" +
      "5. Completion - Finalize campaign outreach process\n\n" +
      "Campaign Details:\n{campaign_details}\n\n" +
      "Creator Information:\n{creator_details}\n\n" +
      "Previous Actions:\n{history}\n\n" +
      "Based on the above information, determine the next appropriate stage number (1-5).\n" +
      "Consider:\n" +
      "- Have all necessary creators been identified? (Stage 1)\n" +
      "- Is there a clear outreach strategy? (Stage 2)\n" +
      "- Have all planned communications been sent? (Stage 3)\n" +
      "- Are we waiting for responses? (Stage 4)\n" +
      "- Has the outreach process concluded? (Stage 5)\n\n" +
      "Return only the stage number."
    );

    const analyzerPrompt = ChatPromptTemplate.fromMessages([
      analyzerSystemPrompt,
      analyzerHumanPrompt
    ]);

    this.stageAnalyzerChain = new LLMChain({
      llm: this.llm,
      prompt: analyzerPrompt
    });

    // Initialize planner chain
    const plannerSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
      "You are a CEO agent developing an intelligent outreach strategy for an influencer marketing campaign. " +
      "Your goal is to create an effective execution plan that maximizes engagement and response rates."
    );

    const plannerHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
      "Campaign Information:\n{campaign_details}\n\n" +
      "Available Creators:\n{creator_details}\n\n" +
      "Special Requirements:\n{custom_requirements}\n\n" +
      "Instructions:\n" +
      "1. Analyze each creator's metrics and potential fit\n" +
      "2. Consider the optimal communication channel (EMAIL or PHONE) for each creator\n" +
      "3. Prioritize creators based on:\n" +
      "   - Follower count and engagement rates\n" +
      "   - Platform alignment with campaign goals\n" +
      "   - Likelihood of positive response\n" +
      "4. Create a sequential outreach plan\n" +
      "5. Provide clear reasoning for each decision\n\n" +
      "IMPORTANT: Return ONLY a valid JSON object with no additional text or explanation.\n" +
      "The JSON must follow this exact structure:\n" +
      '{{\n' +
      '  "sequence": [\n' +
      '    {{\n' +
      '      "type": "EMAIL|PHONE",\n' +
      '      "creatorId": "string",\n' +
      '      "priority": number,\n' +
      '      "reasoning": "string"\n' +
      '    }}\n' +
      '  ],\n' +
      '  "strategy_reasoning": "string"\n' +
      '}}\n\n' +
      "Ensure the response contains ONLY the JSON object and no other text."
    );

    const plannerPrompt = ChatPromptTemplate.fromMessages([
      plannerSystemPrompt,
      plannerHumanPrompt
    ]);

    this.plannerChain = new LLMChain({
      llm: this.llm,
      prompt: plannerPrompt
    });
  }

  _chainType(): string {
    return "ceo_agent";
  }

  get inputKeys(): string[] {
    return [];
  }

  get outputKeys(): string[] {
    return ["plan", "stage"];
  }

  async _call(values: ChainValues): Promise<ChainValues> {
    const plan = await this.createExecutionPlan();
    const stage = await this.determineNextStage();
    return { plan, stage };
  }

  // Add rate limiting method
  private async enforceDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastAction = now - this.lastActionTime;
    
    if (timeSinceLastAction < this.MIN_DELAY_BETWEEN_ACTIONS) {
      const delayNeeded = this.MIN_DELAY_BETWEEN_ACTIONS - timeSinceLastAction;
      console.log(`[CEOAgent] Rate limiting: Waiting ${delayNeeded}ms before next action`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    this.actionCount++;
    if (this.actionCount >= this.MAX_ACTIONS_PER_MINUTE) {
      console.log('[CEOAgent] Rate limiting: Maximum actions per minute reached, enforcing cooldown');
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute cooldown
      this.actionCount = 0;
    }

    this.lastActionTime = Date.now();
  }

  async createExecutionPlan() {
    console.log("[CEOAgent] Creating execution plan...");
    
    try {
      await this.enforceDelay();

      // Filter out creators with no contact preference or NONE
      const creatorsToContact = this.creators.filter(
        creator => creator.contactPreference && creator.contactPreference !== 'NONE'
      );

      if (creatorsToContact.length === 0) {
        return {
          sequence: [],
          strategy_reasoning: "No creators selected for contact"
        };
      }

      const response = await this.plannerChain.call({
        campaign_details: JSON.stringify(this.campaign),
        creator_details: JSON.stringify(creatorsToContact),
        custom_requirements: "Only use the specified contact method for each creator."
      });

      console.log("[CEOAgent] Raw response:", response.text);

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the response");
      }

      const jsonStr = jsonMatch[0];
      console.log("[CEOAgent] Extracted JSON:", jsonStr);

      try {
        this.executionPlan = JSON.parse(jsonStr);
        
        // Filter the sequence to only include actions that match creator preferences
        this.executionPlan.sequence = this.executionPlan.sequence.filter(action => {
          const creator = creatorsToContact.find(c => c.id === action.creatorId);
          return creator && creator.contactPreference === action.type;
        });

        console.log("[CEOAgent] Parsed execution plan:", this.executionPlan);
        return this.executionPlan;
      } catch (parseError) {
        console.error("[CEOAgent] JSON parse error:", parseError);
        throw new Error("Failed to parse execution plan JSON");
      }
    } catch (error) {
      console.error("[CEOAgent] Execution plan creation failed:", error);
      throw error;
    }
  }

  async determineNextStage() {
    console.log("[CEOAgent] Analyzing current stage:", this.currentStage);
    
    await this.enforceDelay(); // Add rate limiting
    const history = await this.memory.loadMemoryVariables({});
    console.log("[CEOAgent] Current memory state:", history);
    
    const response = await this.stageAnalyzerChain.call({
      current_stage: this.currentStage,
      campaign_details: JSON.stringify(this.campaign),
      creator_details: JSON.stringify(this.creators),
      history: history
    });

    console.log("[CEOAgent] Stage analysis result:", response.text);
    this.currentStage = response.text;
    return OUTREACH_STAGES[this.currentStage];
  }

  async executeNextAction(): Promise<{
    action: 'EMAIL' | 'PHONE',
    creatorId: string,
    priority: number
  } | null> {
    await this.enforceDelay(); // Add rate limiting
    if (!this.executionPlan) {
      console.log("[CEOAgent] No execution plan found, creating new plan...");
      await this.createExecutionPlan();
    }

    const nextAction = this.executionPlan.sequence.shift();
    if (!nextAction) {
      console.log("[CEOAgent] No more actions in sequence");
      return null;
    }

    console.log("[CEOAgent] Executing next action:", nextAction);

    // Log the action to memory with proper format
    const input = `Planning action for creator ${nextAction.creatorId}`;
    const output = `Decided to use ${nextAction.type} with priority ${nextAction.priority}. Reasoning: ${nextAction.reasoning}`;
    
    await this.memory.chatHistory.addMessage(
      new HumanMessage(input)
    );
    await this.memory.chatHistory.addMessage(
      new SystemMessage(output)
    );

    return {
      action: nextAction.type,
      creatorId: nextAction.creatorId,
      priority: nextAction.priority
    };
  }

  async *execute() {
    console.log("[CEOAgent] Starting execution sequence");
    this.currentStage = "1";
    
    while (this.currentStage !== "5") {
      const stage = await this.determineNextStage();
      console.log("[CEOAgent] Current stage:", stage);
      yield { type: 'STAGE_UPDATE', stage };

      if (this.currentStage === "3") {
        // Execute all planned actions in sequence
        while (true) {
          const action = await this.executeNextAction();
          if (!action) {
            // No more actions in sequence
            break;
          }
          console.log("[CEOAgent] Executing action:", action);
          yield { type: 'ACTION', ...action };
          
          // Add a small delay between actions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update memory with action completion
          await this.memory.chatHistory.addMessage(
            new SystemMessage(`Completed ${action.action} for creator ${action.creatorId}`)
          );
        }
        
        // After all actions are complete, move to monitoring stage
        this.currentStage = "4";
        continue;
      }

      // For monitoring stage, check if we should move to completion
      if (this.currentStage === "4") {
        // Add a message to memory indicating monitoring is complete
        await this.memory.chatHistory.addMessage(
          new SystemMessage("All outreach actions completed, moving to completion stage")
        );
        this.currentStage = "5";
        continue;
      }

      // For all other stages, proceed normally
      const nextStage = await this.determineNextStage();
      this.currentStage = nextStage;
    }

    // Final completion message
    await this.memory.chatHistory.addMessage(
      new SystemMessage("Campaign outreach process completed")
    );
    
    console.log("[CEOAgent] Execution sequence completed");
    yield { type: 'STAGE_UPDATE', stage: OUTREACH_STAGES["5"] };
  }
} 