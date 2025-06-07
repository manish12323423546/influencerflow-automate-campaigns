import { supabase } from '@/integrations/supabase/client';

export interface AutomationStep {
  step_name: string;
  step_type: 'INITIALIZATION' | 'CREATOR_SEARCH' | 'CONTRACT_GENERATION' | 'OUTREACH' | 'COMMUNICATION' | 'COMPLETION';
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  details?: any;
  error_message?: string;
}

export interface AutomationError {
  error_type: string;
  error_message: string;
  step_name?: string;
  timestamp: string;
  stack_trace?: string;
  context?: any;
}

export interface AutomationMetrics {
  total_execution_time_ms?: number;
  average_step_time_ms?: number;
  success_rate?: number;
  email_success_rate?: number;
  contract_generation_time_ms?: number;
  creator_matching_time_ms?: number;
}

export interface AutomationLogData {
  campaign_id: string;
  automation_session_id: string;
  user_id: string;
  automation_mode: 'AUTOMATIC' | 'MANUAL';
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  total_steps?: number;
  completed_steps?: number;
  current_step?: string;
  creators_found?: number;
  creators_contacted?: number;
  contracts_generated?: number;
  contracts_sent?: number;
  emails_sent?: number;
  phone_calls_made?: number;
  successful_communications?: number;
  failed_communications?: number;
  step_logs?: AutomationStep[];
  error_logs?: AutomationError[];
  performance_metrics?: AutomationMetrics;
  final_status?: string;
  summary_report?: any;
}

export class AutomationLoggingService {
  private static instance: AutomationLoggingService;
  private currentLogId: string | null = null;

  static getInstance(): AutomationLoggingService {
    if (!AutomationLoggingService.instance) {
      AutomationLoggingService.instance = new AutomationLoggingService();
    }
    return AutomationLoggingService.instance;
  }

  async startAutomationLog(data: AutomationLogData): Promise<string> {
    try {
      console.log('Starting automation log with data:', data);

      const insertData = {
        campaign_id: data.campaign_id,
        automation_session_id: data.automation_session_id,
        user_id: data.user_id,
        automation_mode: data.automation_mode,
        status: 'RUNNING',
        total_steps: data.total_steps || 0,
        completed_steps: 0,
        current_step: data.current_step || 'Initializing',
        step_logs: [],
        error_logs: [],
        performance_metrics: {}
      };

      console.log('Inserting automation log:', insertData);

      const { data: logEntry, error } = await supabase
        .from('campaign_automation_logs')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!logEntry) {
        throw new Error('No log entry returned from database');
      }

      console.log('Successfully created automation log with ID:', logEntry.id);
      this.currentLogId = logEntry.id;
      return logEntry.id;
    } catch (error) {
      console.error('Failed to start automation log:', error);
      throw error;
    }
  }

  async updateAutomationLog(logId: string, updates: Partial<AutomationLogData>): Promise<void> {
    try {
      console.log('Updating automation log:', logId, 'with updates:', updates);

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map the updates to database columns
      if (updates.status) updateData.status = updates.status;
      if (updates.completed_steps !== undefined) updateData.completed_steps = updates.completed_steps;
      if (updates.current_step) updateData.current_step = updates.current_step;
      if (updates.creators_found !== undefined) updateData.creators_found = updates.creators_found;
      if (updates.creators_contacted !== undefined) updateData.creators_contacted = updates.creators_contacted;
      if (updates.contracts_generated !== undefined) updateData.contracts_generated = updates.contracts_generated;
      if (updates.contracts_sent !== undefined) updateData.contracts_sent = updates.contracts_sent;
      if (updates.emails_sent !== undefined) updateData.emails_sent = updates.emails_sent;
      if (updates.phone_calls_made !== undefined) updateData.phone_calls_made = updates.phone_calls_made;
      if (updates.successful_communications !== undefined) updateData.successful_communications = updates.successful_communications;
      if (updates.failed_communications !== undefined) updateData.failed_communications = updates.failed_communications;
      if (updates.final_status) updateData.final_status = updates.final_status;
      if (updates.summary_report) updateData.summary_report = updates.summary_report;
      if (updates.performance_metrics) updateData.performance_metrics = updates.performance_metrics;

      // Handle completion
      if (updates.status === 'COMPLETED' || updates.status === 'FAILED' || updates.status === 'CANCELLED') {
        updateData.completed_at = new Date().toISOString();
      }

      console.log('Updating with data:', updateData);

      const { error } = await supabase
        .from('campaign_automation_logs')
        .update(updateData)
        .eq('id', logId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Successfully updated automation log');
    } catch (error) {
      console.error('Failed to update automation log:', error);
      throw error;
    }
  }

  async addStepLog(logId: string, step: AutomationStep): Promise<void> {
    try {
      console.log('Adding step log to:', logId, 'step:', step);

      // Get current step logs
      const { data: currentLog, error: fetchError } = await supabase
        .from('campaign_automation_logs')
        .select('step_logs')
        .eq('id', logId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch current log:', fetchError);
        throw fetchError;
      }

      const currentStepLogs = currentLog.step_logs || [];
      const updatedStepLogs = [...currentStepLogs, step];

      console.log('Updating step logs from', currentStepLogs.length, 'to', updatedStepLogs.length, 'steps');

      const { error } = await supabase
        .from('campaign_automation_logs')
        .update({
          step_logs: updatedStepLogs,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId);

      if (error) {
        console.error('Failed to update step logs:', error);
        throw error;
      }

      console.log('Successfully added step log');
    } catch (error) {
      console.error('Failed to add step log:', error);
      throw error;
    }
  }

  async addErrorLog(logId: string, errorLog: AutomationError): Promise<void> {
    try {
      // Get current error logs
      const { data: currentLog, error: fetchError } = await supabase
        .from('campaign_automation_logs')
        .select('error_logs')
        .eq('id', logId)
        .single();

      if (fetchError) throw fetchError;

      const currentErrorLogs = currentLog.error_logs || [];
      const updatedErrorLogs = [...currentErrorLogs, errorLog];

      const { error } = await supabase
        .from('campaign_automation_logs')
        .update({
          error_logs: updatedErrorLogs,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to add error log:', error);
      throw error;
    }
  }

  async getAutomationLogs(campaignId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_automation_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get automation logs:', error);
      return [];
    }
  }

  async getAutomationReport(campaignId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('campaign_automation_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      // Calculate summary metrics
      const stepLogs = data.step_logs || [];
      const errorLogs = data.error_logs || [];
      
      const totalSteps = stepLogs.length;
      const completedSteps = stepLogs.filter((step: AutomationStep) => step.status === 'COMPLETED').length;
      const failedSteps = stepLogs.filter((step: AutomationStep) => step.status === 'FAILED').length;
      
      const totalDuration = stepLogs.reduce((acc: number, step: AutomationStep) => {
        return acc + (step.duration_ms || 0);
      }, 0);

      return {
        ...data,
        calculated_metrics: {
          total_steps: totalSteps,
          completed_steps: completedSteps,
          failed_steps: failedSteps,
          success_rate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
          total_duration_ms: totalDuration,
          total_errors: errorLogs.length,
          automation_efficiency: data.successful_communications / (data.successful_communications + data.failed_communications) * 100 || 0
        }
      };
    } catch (error) {
      console.error('Failed to get automation report:', error);
      return null;
    }
  }

  getCurrentLogId(): string | null {
    return this.currentLogId;
  }

  setCurrentLogId(logId: string): void {
    this.currentLogId = logId;
  }

  // Test method to verify logging is working
  async testLogging(campaignId: string, userId: string): Promise<void> {
    try {
      console.log('Testing automation logging...');

      const sessionId = `test_${Date.now()}`;
      const logId = await this.startAutomationLog({
        campaign_id: campaignId,
        automation_session_id: sessionId,
        user_id: userId,
        automation_mode: 'AUTOMATIC',
        total_steps: 3,
        current_step: 'Testing'
      });

      console.log('Created test log with ID:', logId);

      await this.addStepLog(logId, {
        step_name: 'Test Step',
        step_type: 'INITIALIZATION',
        status: 'COMPLETED',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: 1000,
        details: { test: true }
      });

      await this.updateAutomationLog(logId, {
        status: 'COMPLETED',
        completed_steps: 3,
        creators_found: 5,
        emails_sent: 3,
        final_status: 'Test completed successfully'
      });

      console.log('Test logging completed successfully');
    } catch (error) {
      console.error('Test logging failed:', error);
      throw error;
    }
  }
}
