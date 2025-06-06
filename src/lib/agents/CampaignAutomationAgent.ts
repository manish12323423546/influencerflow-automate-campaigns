import { CampaignState, CampaignStatus, Creator, Communication, Campaign, CreatorContactPreference } from './types';
import { supabase } from '@/integrations/supabase/client';
import { ChatOpenAI } from "@langchain/openai";
import { CEOAgent } from './CEOAgent';
import { GmailService, GmailCreator, GmailCampaign } from '@/lib/services/gmailService';
import { AutomationLoggingService, AutomationStep, AutomationError } from '@/lib/services/automationLoggingService';

export class CampaignAutomationAgent {
  private campaignId: string;
  private userId: string;
  private state: CampaignState;
  private mode: 'AUTOMATIC' | 'MANUAL';
  private model: ChatOpenAI;
  private ceoAgent: CEOAgent;
  private onProgress: (state: CampaignState) => void;

  // Automation logging
  private loggingService: AutomationLoggingService;
  private automationSessionId: string;
  private currentLogId: string | null = null;
  private automationStartTime: number = 0;
  
  // Add rate limiting and control parameters
  private readonly MIN_DELAY_BETWEEN_ACTIONS = 5000; // 5 seconds minimum between actions
  private readonly MAX_ACTIONS_PER_MINUTE = 10;
  private readonly MAX_RETRIES = 3;
  private actionCount: number = 0;
  private lastActionTime: number = 0;
  private isExecuting: boolean = false;

  constructor(
    model: ChatOpenAI,
    config: { campaignId?: string; userId?: string; mode: 'AUTOMATIC' | 'MANUAL' },
    onProgress: (state: CampaignState) => void
  ) {
    this.model = model;
    this.campaignId = config.campaignId || 'ad48a64e-0e64-402a-8271-090f55088293';
    this.userId = config.userId || 'e5c58861-fada-4c8c-bbe7-f7aff2879fcb';
    this.mode = config.mode;
    this.onProgress = onProgress;
    this.state = {
      status: CampaignStatus.INITIATED,
      selectedCreators: [],
      sentContracts: [],
      communications: [],
    };

    // Initialize logging service
    this.loggingService = AutomationLoggingService.getInstance();
    // Generate a proper UUID for the automation session
    this.automationSessionId = crypto.randomUUID();
    // CEOAgent will be initialized later when we have campaign and creator data
  }

  public async initialize() {
    this.log('Initializing campaign automation agent...');
    await this.updateState({ status: CampaignStatus.INITIATED });
    return this;
  }

  // Automation logging methods
  private async startAutomationLogging(): Promise<void> {
    try {
      this.log('Starting automation logging...');
      this.automationStartTime = Date.now();

      this.log(`Campaign ID: ${this.campaignId}, User ID: ${this.userId}, Mode: ${this.mode}`);

      this.currentLogId = await this.loggingService.startAutomationLog({
        campaign_id: this.campaignId,
        automation_session_id: this.automationSessionId,
        user_id: this.userId,
        automation_mode: this.mode,
        total_steps: 5, // INITIATED, CREATOR_SEARCH, CONTRACT_PHASE, OUTREACH, COMPLETED
        current_step: 'Initializing automation agent'
      });

      this.log(`Automation log created with ID: ${this.currentLogId}`);

      await this.logStep({
        step_name: 'Initialization',
        step_type: 'INITIALIZATION',
        status: 'STARTED',
        started_at: new Date().toISOString(),
        details: { automation_mode: this.mode, session_id: this.automationSessionId }
      });

      this.log('Automation logging started successfully');
    } catch (error) {
      console.error('Failed to start automation logging:', error);
      this.log(`Automation logging failed: ${error}`);
      // Don't throw the error to prevent automation from failing
    }
  }

  private async logStep(step: AutomationStep): Promise<void> {
    if (!this.currentLogId) {
      this.log('Warning: No current log ID, skipping step log');
      return;
    }

    try {
      this.log(`Logging step: ${step.step_name} - ${step.status}`);
      await this.loggingService.addStepLog(this.currentLogId, step);
      this.log(`Successfully logged step: ${step.step_name}`);
    } catch (error) {
      console.error('Failed to log step:', error);
      this.log(`Failed to log step ${step.step_name}: ${error}`);
    }
  }

  private async logError(error: AutomationError): Promise<void> {
    if (!this.currentLogId) {
      this.log('Warning: No current log ID, skipping error log');
      return;
    }

    try {
      this.log(`Logging error: ${error.error_type} - ${error.error_message}`);
      await this.loggingService.addErrorLog(this.currentLogId, error);
      this.log('Successfully logged error');
    } catch (error) {
      console.error('Failed to log error:', error);
      this.log(`Failed to log error: ${error}`);
    }
  }

  private async updateAutomationMetrics(updates: any): Promise<void> {
    if (!this.currentLogId) {
      this.log('Warning: No current log ID, skipping metrics update');
      return;
    }

    try {
      this.log(`Updating automation metrics: ${JSON.stringify(updates)}`);
      await this.loggingService.updateAutomationLog(this.currentLogId, updates);
      this.log('Successfully updated automation metrics');
    } catch (error) {
      console.error('Failed to update automation metrics:', error);
      this.log(`Failed to update automation metrics: ${error}`);
    }
  }

  public async executeCampaign() {
    if (this.isExecuting) {
      throw new Error('Campaign execution already in progress');
    }

    this.isExecuting = true;
    this.actionCount = 0;
    this.lastActionTime = Date.now();

    try {
      this.log('Starting campaign execution...');

      // Start automation logging
      await this.startAutomationLogging();

      await this.updateState({ status: CampaignStatus.INITIATED });

      // Step 1: Search Creators
      await this.logStep({
        step_name: 'Search Creators',
        step_type: 'CREATOR_SEARCH',
        status: 'STARTED',
        started_at: new Date().toISOString()
      });

      await this.enforceDelay();
      await this.searchCreators();

      await this.logStep({
        step_name: 'Search Creators',
        step_type: 'CREATOR_SEARCH',
        status: 'COMPLETED',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        details: { creators_found: this.state.selectedCreators.length }
      });

      await this.updateAutomationMetrics({
        creators_found: this.state.selectedCreators.length,
        completed_steps: 2
      });

      // Step 2: Generate Contracts
      await this.logStep({
        step_name: 'Generate Contracts',
        step_type: 'CONTRACT_GENERATION',
        status: 'STARTED',
        started_at: new Date().toISOString()
      });

      await this.enforceDelay();
      await this.generateContracts();

      await this.logStep({
        step_name: 'Generate Contracts',
        step_type: 'CONTRACT_GENERATION',
        status: 'COMPLETED',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        details: { contracts_generated: this.state.sentContracts.length }
      });

      await this.updateAutomationMetrics({
        contracts_generated: this.state.sentContracts.length,
        contracts_sent: this.state.sentContracts.length,
        completed_steps: 3
      });

      await this.enforceDelay();

      const campaignData = await this.getCampaignWithSettings();
      this.ceoAgent = new CEOAgent(
        this.model,
        campaignData,
        this.state.selectedCreators
      );

      // Step 3: Conduct Outreach
      await this.logStep({
        step_name: 'Conduct Outreach',
        step_type: 'OUTREACH',
        status: 'STARTED',
        started_at: new Date().toISOString()
      });

      await this.conductOutreach();

      await this.logStep({
        step_name: 'Conduct Outreach',
        step_type: 'OUTREACH',
        status: 'COMPLETED',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        details: { communications_sent: this.state.communications.length }
      });

      await this.updateAutomationMetrics({
        creators_contacted: this.state.selectedCreators.filter(c => c.contactPreference !== 'NONE').length,
        emails_sent: this.state.communications.filter(c => c.type === 'EMAIL' && c.status === 'SENT').length,
        phone_calls_made: this.state.communications.filter(c => c.type === 'PHONE' && c.status === 'SENT').length,
        successful_communications: this.state.communications.filter(c => c.status === 'SENT').length,
        failed_communications: this.state.communications.filter(c => c.status === 'FAILED').length,
        completed_steps: 4
      });

      await this.enforceDelay();
      await this.processResponses();

      await this.updateState({ status: CampaignStatus.COMPLETED });

      // Final completion logging
      await this.updateAutomationMetrics({
        status: 'COMPLETED',
        final_status: 'Campaign automation completed successfully',
        completed_steps: 5,
        summary_report: {
          total_creators: this.state.selectedCreators.length,
          contracts_generated: this.state.sentContracts.length,
          communications_sent: this.state.communications.length,
          success_rate: this.state.communications.length > 0 ?
            (this.state.communications.filter(c => c.status === 'SENT').length / this.state.communications.length) * 100 : 0
        }
      });

      this.log('Campaign completed successfully!');
      return this.state;

    } catch (error) {
      this.log(`Campaign failed: ${error}`);

      // Log the error
      await this.logError({
        error_type: 'CAMPAIGN_EXECUTION_FAILURE',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        context: { step: 'executeCampaign', campaign_id: this.campaignId }
      });

      await this.updateAutomationMetrics({
        status: 'FAILED',
        final_status: `Campaign automation failed: ${error}`
      });

      await this.updateState({ status: CampaignStatus.FAILED });
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  private log(message: string) {
    console.log(`[Campaign ${this.campaignId}] ${message}`);
  }

  private async updateState(newState: Partial<CampaignState>) {
    this.state = {
      ...this.state,
      ...newState,
    };
    this.log(`Status: ${this.state.status}`);
    this.log(`Current State: ${JSON.stringify(this.state)}`);
    this.onProgress(this.state);
  }

  private async getCampaignWithSettings(): Promise<Campaign> {
    const maxRetries = 5;
    const retryDelay = 2000;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`Attempt ${attempt}/${maxRetries}: Starting campaign fetch...`);
        
        // First, get the campaign with its settings and influencers
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select(`
            *,
            campaign_influencers (
              influencer_id,
              status,
              match_score,
              match_reason,
              fee
            )
          `)
          .eq('id', this.campaignId)
          .maybeSingle();

        if (campaignError) {
          throw new Error(`Campaign fetch failed: ${campaignError.message}`);
        }

        if (!campaign) {
          throw new Error(`Campaign not found with ID: ${this.campaignId}`);
        }

        // Get all influencer IDs from campaign_influencers
        const influencerIds = campaign.campaign_influencers?.map(ci => ci.influencer_id) || [];
        
        // Wait for campaign_influencers to be populated
        if (influencerIds.length === 0 && attempt < maxRetries) {
          throw new Error('Campaign influencers not yet populated');
        }
        
        // Fetch influencer details
        const { data: influencers, error: influencersError } = await supabase
          .from('influencers')
          .select('*')
          .in('id', influencerIds);

        if (influencersError) {
          throw new Error(`Failed to fetch influencers: ${influencersError.message}`);
        }

        // Combine campaign data with influencer details
        return {
          ...campaign,
          influencers: influencers || [],
          settings: campaign.campaign_settings || {}
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          this.log(`Failed to fetch campaign after ${maxRetries} attempts: ${lastError.message}`);
          throw lastError;
        }
        
        this.log(`Attempt ${attempt} failed, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw lastError || new Error('Unknown error fetching campaign');
  }

  private async searchCreators() {
    this.log('Starting creator search...');
    await this.updateState({ status: CampaignStatus.CREATOR_SEARCH });

    try {
      const campaignData = await this.getCampaignWithSettings();
      
      if (!campaignData.settings) {
        throw new Error('Campaign settings not found');
      }

      // Get all influencers that are already associated with the campaign
      const existingInfluencerIds = campaignData.campaign_influencers?.map(ci => ci.influencer_id) || [];

      // If we already have influencers associated, use those instead of searching
      if (existingInfluencerIds.length > 0) {
        const { data: existingInfluencers, error: existingError } = await supabase
          .from('influencers')
          .select('*')
          .in('id', existingInfluencerIds);

        if (existingError) throw existingError;

        // Transform existing influencers data
        const selectedCreators: Creator[] = (existingInfluencers || []).map(creator => ({
          id: creator.id,
          name: creator.name,
          email: creator.gmail_gmail,
          metrics: {
            followers: creator.followers_count,
            engagement: creator.engagement_rate
          }
        }));

        // Add communication log
        const communication: Communication = {
          id: `search-${Date.now()}`,
          creatorId: 'system',
          type: 'EMAIL',
          status: 'SENT',
          content: `Using ${selectedCreators.length} pre-selected creators`,
          timestamp: new Date().toISOString(),
        };

        await this.updateState({
          selectedCreators,
          communications: [...this.state.communications, communication],
        });

        return;
      }

      // If no pre-selected influencers, search based on campaign criteria
      const { data: creators, error: creatorsError } = await supabase
        .from('influencers')
        .select('*')
        .eq('platform', campaignData.settings.platform || 'instagram')
        .gte('followers_count', campaignData.settings.min_followers || 0)
        .lte('engagement_rate', campaignData.settings.max_engagement_rate || 100)
        .limit(10); // Limit to top 10 matching creators

      if (creatorsError) {
        this.log(`Failed to fetch creators: ${creatorsError.message}`);
        throw new Error(`Creator search failed: ${creatorsError.message}`);
      }

      // Transform creators data
      const selectedCreators: Creator[] = (creators || []).map(creator => ({
        id: creator.id,
        name: creator.name,
        email: creator.gmail_gmail,
        metrics: {
          followers: creator.followers_count,
          engagement: creator.engagement_rate
        }
      }));

      // Add communication log
      const communication: Communication = {
        id: `search-${Date.now()}`,
        creatorId: 'system',
        type: 'EMAIL',
        status: 'SENT',
        content: `Found ${selectedCreators.length} potential creators`,
        timestamp: new Date().toISOString(),
      };

      await this.updateState({
        selectedCreators,
        communications: [...this.state.communications, communication],
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during creator search';
      this.log(`Creator search failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  private async generateContracts() {
    this.log('Generating contracts...');
    await this.updateState({ status: CampaignStatus.CONTRACT_PHASE });

    try {
      // Filter creators based on contact preferences
      const creatorsToContact = this.state.selectedCreators.filter(creator => {
        const preference = this.state.creatorPreferences?.find(p => p.creatorId === creator.id);
        return preference && preference.contactMethod !== 'NONE';
      });

      if (creatorsToContact.length === 0) {
        this.log('No creators selected for contracts');
        const communication: Communication = {
          id: `contract-gen-${Date.now()}`,
          creatorId: 'system',
          type: 'SYSTEM',
          status: 'SENT',
          content: 'No creators selected for contracts',
          timestamp: new Date().toISOString(),
        };
        await this.updateState({
          communications: [...this.state.communications, communication],
        });
        return;
      }

      const contracts = await Promise.all(
        creatorsToContact.map(async (creator) => {
          try {
            this.log(`Creating contract for creator ${creator.name}...`);
            
            // Create contract in Supabase
            const { data: contract, error } = await supabase
              .from('contracts')
              .insert({
                brand_user_id: this.userId,
                influencer_id: creator.id,
                campaign_id: this.campaignId,
                status: 'DRAFT',
                contract_data: {
                  campaignId: this.campaignId,
                  creatorId: creator.id,
                  creatorName: creator.name,
                  status: 'DRAFT',
                  content: `Contract for creator ${creator.name}`,
                  terms: {
                    deliverables: 'Content creation and posting',
                    timeline: '30 days',
                    compensation: 'To be negotiated'
                  }
                }
              })
              .select('*')
              .single();

            if (error) {
              this.log(`Failed to create contract for creator ${creator.name}: ${error.message}`);
              if (error.details) this.log(`Error details: ${error.details}`);
              if (error.hint) this.log(`Error hint: ${error.hint}`);
              throw new Error(`Contract creation failed: ${error.message}`);
            }

            if (!contract) {
              throw new Error(`No contract data returned for creator ${creator.name}`);
            }

            this.log(`Successfully created contract for creator ${creator.name}`);
            return {
              id: contract.id,
              creatorId: creator.id,
              status: 'DRAFT' as const,
              content: contract.contract_data,
            };
          } catch (error) {
            this.log(`Error creating contract for creator ${creator.name}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
          }
        })
      );

      const communication: Communication = {
        id: `contract-gen-${Date.now()}`,
        creatorId: 'system',
        type: 'EMAIL',
        status: 'SENT',
        content: `Generated ${contracts.length} contracts`,
        timestamp: new Date().toISOString(),
      };

      await this.updateState({
        sentContracts: contracts,
        communications: [...this.state.communications, communication],
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Contract generation failed: ${errorMessage}`);
      throw new Error(`Contract generation failed: ${errorMessage}`);
    }
  }

  public setCreatorPreferences(preferences: CreatorContactPreference[]) {
    // Update creator preferences in state
    this.state = {
      ...this.state,
      creatorPreferences: preferences,
      // Update contact preferences in selectedCreators
      selectedCreators: this.state.selectedCreators.map(creator => ({
        ...creator,
        contactPreference: preferences.find(p => p.creatorId === creator.id)?.contactMethod || 'NONE'
      }))
    };
    this.log('Updated creator contact preferences');
  }

  private async conductOutreach() {
    this.log('Initiating creator outreach...');
    await this.updateState({ status: CampaignStatus.OUTREACH });

    try {
      // Filter creators based on contact preferences
      const emailCreators = this.state.selectedCreators.filter(creator => {
        const preference = this.state.creatorPreferences?.find(p => p.creatorId === creator.id);
        return preference?.contactMethod === 'EMAIL';
      });

      const phoneCreators = this.state.selectedCreators.filter(creator => {
        const preference = this.state.creatorPreferences?.find(p => p.creatorId === creator.id);
        return preference?.contactMethod === 'PHONE';
      });

      if (emailCreators.length === 0 && phoneCreators.length === 0) {
        this.log('No creators selected for contact');
        return;
      }

      // Process email creators using bulk Gmail workflow
      if (emailCreators.length > 0) {
        await this.sendBulkEmails(emailCreators);
      }

      // Process phone creators
      for (const creator of phoneCreators) {
        try {
          await this.enforceDelay();
          await this.makePhoneCall(creator);
        } catch (error) {
          this.log(`Failed to make phone call to ${creator.name}: ${error}`);
          const communication: Communication = {
            id: `outreach-phone-failed-${creator.id}-${Date.now()}`,
            creatorId: creator.id,
            type: 'PHONE',
            status: 'FAILED',
            content: `Failed to call ${creator.name}: ${error}`,
            timestamp: new Date().toISOString(),
          };
          await this.updateState({
            communications: [...this.state.communications, communication],
          });
        }
      }

      // Create execution plan with contact preferences
      if (this.ceoAgent) {
        const executionPlan = await this.ceoAgent.createExecutionPlan();
        await this.updateState({ executionPlan });
      }

    } catch (error) {
      this.log(`Outreach process failed: ${error}`);
      throw error;
    }
  }

  private async sendEmail(creator: Creator) {
    const campaignData = await this.getCampaignWithSettings();

    try {
      // First check if we have a valid email
      if (!creator.email) {
        throw new Error(`No email address found for creator ${creator.name}`);
      }

      // Get contract for this creator
      const contract = this.state.sentContracts.find(c => c.creatorId === creator.id);

      // Get full creator data from Supabase for Gmail service
      const { data: creatorData, error: creatorError } = await supabase
        .from('influencers')
        .select('*')
        .eq('id', creator.id)
        .single();

      if (creatorError || !creatorData) {
        throw new Error(`Failed to fetch creator data for ${creator.name}`);
      }

      // Transform data for Gmail service
      const gmailCreator: GmailCreator = {
        id: creatorData.id,
        name: creatorData.name,
        gmail_gmail: creatorData.gmail_gmail,
        handle: creatorData.handle,
        platform: creatorData.platform,
        followers_count: creatorData.followers_count,
        engagement_rate: creatorData.engagement_rate
      };

      const gmailCampaign: GmailCampaign = {
        id: campaignData.id,
        name: campaignData.name,
        brand: campaignData.brand,
        description: campaignData.description,
        goals: campaignData.goals,
        target_audience: campaignData.target_audience,
        budget: campaignData.budget,
        deliverables: campaignData.deliverables,
        timeline: campaignData.timeline
      };

      // Use Gmail service to send email
      const result = await GmailService.sendGmailWorkflow(
        gmailCreator,
        gmailCampaign,
        contract?.content
      );

      if (result.status === 'error') {
        throw new Error(result.error || 'Failed to send email');
      }

      const communication: Communication = {
        id: `outreach-email-${creator.id}-${Date.now()}`,
        creatorId: creator.id,
        type: 'EMAIL',
        status: 'SENT',
        content: `Gmail workflow sent to ${creator.name} (${creator.email})`,
        timestamp: new Date().toISOString(),
      };

      await this.updateState({
        communications: [...this.state.communications, communication],
      });

      this.log(`Successfully sent Gmail workflow to creator ${creator.name}`);
    } catch (error) {
      this.log(`Error sending email to ${creator.name}: ${error}`);
      throw error;
    }
  }

  private async sendBulkEmails(creators: Creator[]) {
    this.log(`Sending bulk emails to ${creators.length} creators...`);

    try {
      const campaignData = await this.getCampaignWithSettings();

      // Get full creator data from Supabase
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('influencers')
        .select('*')
        .in('id', creators.map(c => c.id));

      if (creatorsError || !creatorsData) {
        throw new Error('Failed to fetch creators data for bulk email');
      }

      // Transform data for Gmail service
      const gmailCreators: GmailCreator[] = creatorsData.map(creatorData => ({
        id: creatorData.id,
        name: creatorData.name,
        gmail_gmail: creatorData.gmail_gmail,
        handle: creatorData.handle,
        platform: creatorData.platform,
        followers_count: creatorData.followers_count,
        engagement_rate: creatorData.engagement_rate
      }));

      const gmailCampaign: GmailCampaign = {
        id: campaignData.id,
        name: campaignData.name,
        brand: campaignData.brand,
        description: campaignData.description,
        goals: campaignData.goals,
        target_audience: campaignData.target_audience,
        budget: campaignData.budget,
        deliverables: campaignData.deliverables,
        timeline: campaignData.timeline
      };

      // Send bulk emails with progress tracking
      const results = await GmailService.sendBulkGmailWorkflow(
        gmailCreators,
        gmailCampaign,
        (creator, result) => {
          // Create communication log for each email
          const communication: Communication = {
            id: `bulk-email-${creator.id}-${Date.now()}`,
            creatorId: creator.id,
            type: 'EMAIL',
            status: result.status === 'success' ? 'SENT' : 'FAILED',
            content: result.status === 'success'
              ? `Gmail workflow sent to ${creator.name} (${creator.gmail_gmail})`
              : `Failed to send email to ${creator.name}: ${result.error}`,
            timestamp: new Date().toISOString(),
          };

          // Update state with new communication
          this.updateState({
            communications: [...this.state.communications, communication],
          });

          this.log(`Email ${result.status} for ${creator.name}`);
        }
      );

      const successCount = Object.values(results).filter(r => r.status === 'success').length;
      const failureCount = Object.values(results).filter(r => r.status === 'error').length;

      this.log(`Bulk email completed: ${successCount} successful, ${failureCount} failed`);

    } catch (error) {
      this.log(`Error in bulk email sending: ${error}`);
      throw error;
    }
  }

  private async makePhoneCall(creator: Creator) {
    try {
      // Validate environment variables before making the call
      const env = this.validateEnvVariables();

      // Get creator's phone number from Supabase
      const { data: creatorData, error: creatorError } = await supabase
        .from('influencers')
        .select('phone_no')
        .eq('id', creator.id)
        .single();

      if (creatorError || !creatorData?.phone_no) {
        throw new Error(`No phone number found for creator ${creator.name}`);
      }

      // Get contract for this creator
      const contract = this.state.sentContracts.find(c => c.creatorId === creator.id);
      if (!contract) {
        throw new Error(`No contract found for creator ${creator.name}`);
      }

      this.log(`Initiating call to creator ${creator.name} at +${creatorData.phone_no}`);

      const requestBody = {
        agent_id: env.VITE_ELEVENLABS_AGENT_ID,
        agent_phone_number_id: env.VITE_ELEVENLABS_PHONE_NUMBER_ID,
        to_number: `+${creatorData.phone_no}`,
        context: {
          campaign: await this.getCampaignWithSettings(),
          creator: {
            id: creator.id,
            name: creator.name,
            metrics: creator.metrics
          },
          contract: contract.content
        }
      };

      this.log('Making API request to Eleven Labs with body: ' + JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: {
          "Xi-Api-Key": env.VITE_ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        this.log(`Failed to initiate call to ${creator.name}: ${errorData?.message || response.statusText}`);
        throw new Error(`Failed to initiate call: ${errorData?.message || response.statusText}`);
      }

      const responseData = await response.json();
      this.log(`Successfully initiated call to ${creator.name}. Response: ${JSON.stringify(responseData, null, 2)}`);

      const communication: Communication = {
        id: `outreach-call-${creator.id}-${Date.now()}`,
        creatorId: creator.id,
        type: 'PHONE',
        status: 'SENT',
        content: `Phone call initiated to ${creator.name} (+${creatorData.phone_no})`,
        timestamp: new Date().toISOString(),
      };

      await this.updateState({
        communications: [...this.state.communications, communication],
      });

      this.log(`Successfully initiated call to creator ${creator.name}`);
    } catch (error) {
      this.log(`Error making phone call to ${creator.name}: ${error}`);
      throw error;
    }
  }

  private async processResponses() {
    this.log('Processing creator responses...');
    await this.updateState({ status: CampaignStatus.RESPONSE_PROCESSING });

    try {
      // Add a processing communication
      const communication: Communication = {
        id: `process-${Date.now()}`,
        creatorId: 'system',
        type: 'SYSTEM',
        status: 'SENT',
        content: 'Processing creator responses',
        timestamp: new Date().toISOString(),
      };

      await this.updateState({
        communications: [...this.state.communications, communication],
      });

      // Wait for a short time to simulate response processing
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      this.log(`Response processing failed: ${error}`);
      throw error;
    }
  }

  public getState(): CampaignState {
    return this.state;
  }

  public reset() {
    this.state = {
      status: CampaignStatus.INITIATED,
      selectedCreators: [],
      sentContracts: [],
      communications: [],
    };
  }

  // Add rate limiting helper method
  private async enforceDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastAction = now - this.lastActionTime;
    
    if (timeSinceLastAction < this.MIN_DELAY_BETWEEN_ACTIONS) {
      const delayNeeded = this.MIN_DELAY_BETWEEN_ACTIONS - timeSinceLastAction;
      this.log(`Rate limiting: Waiting ${delayNeeded}ms before next action`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    this.actionCount++;
    if (this.actionCount >= this.MAX_ACTIONS_PER_MINUTE) {
      this.log('Rate limiting: Maximum actions per minute reached, enforcing cooldown');
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute cooldown
      this.actionCount = 0;
    }

    this.lastActionTime = Date.now();
  }

  private validateEnvVariables() {
    const required = {
      VITE_ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY,
      VITE_ELEVENLABS_AGENT_ID: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
      VITE_ELEVENLABS_PHONE_NUMBER_ID: import.meta.env.VITE_ELEVENLABS_PHONE_NUMBER_ID
    };

    const missing = Object.entries(required)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return required;
  }
} 