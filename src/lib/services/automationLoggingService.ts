
import { supabase } from '@/integrations/supabase/client';

export interface AutomationReport {
  id: string;
  campaignId: string;
  status: string;
  totalSteps: number;
  completedSteps: number;
  creatorsFound: number;
  creatorsContacted: number;
  contractsGenerated: number;
  contractsSent: number;
  emailsSent: number;
  phoneCallsMade: number;
  successfulCommunications: number;
  failedCommunications: number;
  startedAt: string;
  completedAt?: string;
  stepLogs: any[];
  errorLogs: any[];
  performanceMetrics: any;
  summaryReport: any;
}

export interface AutomationLog {
  id: string;
  campaignId: string;
  step: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
  metadata?: any;
}

export class AutomationLoggingService {
  private static instance: AutomationLoggingService;

  private constructor() {}

  static getInstance(): AutomationLoggingService {
    if (!AutomationLoggingService.instance) {
      AutomationLoggingService.instance = new AutomationLoggingService();
    }
    return AutomationLoggingService.instance;
  }

  async startAutomationSession(
    campaignId: string,
    userId: string,
    mode: 'AUTOMATIC' | 'MANUAL'
  ): Promise<string> {
    try {
      const sessionId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('campaign_automation_logs')
        .insert({
          id: sessionId,
          campaign_id: campaignId,
          automation_session_id: sessionId,
          user_id: userId,
          automation_mode: mode,
          status: 'RUNNING',
          started_at: new Date().toISOString(),
          total_steps: 10,
          completed_steps: 0,
          creators_found: 0,
          creators_contacted: 0,
          contracts_generated: 0,
          contracts_sent: 0,
          emails_sent: 0,
          phone_calls_made: 0,
          successful_communications: 0,
          failed_communications: 0,
          step_logs: [],
          error_logs: [],
          performance_metrics: {},
          summary_report: {}
        });

      if (error) throw error;

      return sessionId;
    } catch (error) {
      console.error('Failed to start automation session:', error);
      throw error;
    }
  }

  async updateAutomationProgress(
    sessionId: string,
    updates: Partial<{
      completedSteps: number;
      currentStep: string;
      creatorsFound: number;
      creatorsContacted: number;
      contractsGenerated: number;
      contractsSent: number;
      emailsSent: number;
      phoneCallsMade: number;
      successfulCommunications: number;
      failedCommunications: number;
    }>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_automation_logs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('automation_session_id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update automation progress:', error);
      throw error;
    }
  }

  async logAutomationStep(
    sessionId: string,
    step: string,
    message: string,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info',
    metadata?: any
  ): Promise<void> {
    try {
      // Get current logs
      const { data: currentLog, error: fetchError } = await supabase
        .from('campaign_automation_logs')
        .select('step_logs')
        .eq('automation_session_id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const stepLogs = Array.isArray(currentLog.step_logs) ? currentLog.step_logs : [];
      
      const newLog = {
        id: crypto.randomUUID(),
        step,
        message,
        level,
        timestamp: new Date().toISOString(),
        metadata
      };

      stepLogs.push(newLog);

      const { error } = await supabase
        .from('campaign_automation_logs')
        .update({
          step_logs: stepLogs,
          updated_at: new Date().toISOString()
        })
        .eq('automation_session_id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log automation step:', error);
      throw error;
    }
  }

  async logAutomationError(
    sessionId: string,
    error: string,
    step?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Get current error logs
      const { data: currentLog, error: fetchError } = await supabase
        .from('campaign_automation_logs')
        .select('error_logs')
        .eq('automation_session_id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const errorLogs = Array.isArray(currentLog.error_logs) ? currentLog.error_logs : [];
      
      const newError = {
        id: crypto.randomUUID(),
        error,
        step,
        timestamp: new Date().toISOString(),
        metadata
      };

      errorLogs.push(newError);

      const { error: updateError } = await supabase
        .from('campaign_automation_logs')
        .update({
          error_logs: errorLogs,
          updated_at: new Date().toISOString()
        })
        .eq('automation_session_id', sessionId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Failed to log automation error:', err);
      throw err;
    }
  }

  async completeAutomationSession(
    sessionId: string,
    status: 'COMPLETED' | 'FAILED',
    summaryReport?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_automation_logs')
        .update({
          status,
          final_status: status,
          completed_at: new Date().toISOString(),
          summary_report: summaryReport || {},
          updated_at: new Date().toISOString()
        })
        .eq('automation_session_id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to complete automation session:', error);
      throw error;
    }
  }

  async getAutomationReport(campaignId: string): Promise<AutomationReport | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_automation_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        campaignId: data.campaign_id,
        status: data.status,
        totalSteps: data.total_steps || 0,
        completedSteps: data.completed_steps || 0,
        creatorsFound: data.creators_found || 0,
        creatorsContacted: data.creators_contacted || 0,
        contractsGenerated: data.contracts_generated || 0,
        contractsSent: data.contracts_sent || 0,
        emailsSent: data.emails_sent || 0,
        phoneCallsMade: data.phone_calls_made || 0,
        successfulCommunications: data.successful_communications || 0,
        failedCommunications: data.failed_communications || 0,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        stepLogs: Array.isArray(data.step_logs) ? data.step_logs : [],
        errorLogs: Array.isArray(data.error_logs) ? data.error_logs : [],
        performanceMetrics: data.performance_metrics || {},
        summaryReport: data.summary_report || {}
      };
    } catch (error) {
      console.error('Failed to get automation report:', error);
      return null;
    }
  }

  async getAutomationLogs(campaignId: string): Promise<AutomationLog[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_automation_logs')
        .select('step_logs')
        .eq('campaign_id', campaignId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (!data || !Array.isArray(data.step_logs)) return [];

      return data.step_logs.map((log: any) => ({
        id: log.id,
        campaignId,
        step: log.step,
        message: log.message,
        level: log.level,
        timestamp: log.timestamp,
        metadata: log.metadata
      }));
    } catch (error) {
      console.error('Failed to get automation logs:', error);
      return [];
    }
  }

  async testLogging(campaignId: string, userId: string): Promise<void> {
    try {
      const sessionId = await this.startAutomationSession(campaignId, userId, 'MANUAL');
      
      await this.logAutomationStep(sessionId, 'TEST', 'Test logging functionality', 'info');
      await this.updateAutomationProgress(sessionId, { completedSteps: 1 });
      await this.completeAutomationSession(sessionId, 'COMPLETED');
      
      console.log('Automation logging test completed successfully');
    } catch (error) {
      console.error('Automation logging test failed:', error);
      throw error;
    }
  }
}
