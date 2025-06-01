export interface LLMUsage {
  model_usage: {
    [key: string]: {
      input: { tokens: number; price: number };
      input_cache_read: { tokens: number; price: number };
      input_cache_write: { tokens: number; price: number };
      output_total: { tokens: number; price: number };
    };
  };
}

export interface ConversationMessage {
  role: string;         // 'user' or 'agent'
  message: string;      // message content (note: API returns 'message', not 'content')
  time_in_call_secs: number;  // timestamp in seconds from call start
  tool_calls?: any[];   // Array of tool calls made during this message
  tool_results?: any[]; // Results of tool calls
  feedback?: any;       // Any feedback on the message
  llm_override?: any;   // Any LLM overrides
  source_medium?: string; // How the message was input (e.g. 'audio')
  conversation_turn_metrics?: {
    metrics: {
      convai_llm_service_ttf_sentence: { elapsed_time: number };
      convai_llm_service_ttfb: { elapsed_time: number };
    };
  };
  rag_retrieval_info?: {
    chunks: Array<{
      document_id: string;
      chunk_id: string;
      vector_distance: number;
    }>;
    embedding_model: string;
    retrieval_query: string;
    rag_latency_secs: number;
  };
  llm_usage?: LLMUsage;
  interrupted?: boolean;
  original_message?: string;
}

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

/**
 * Fetches the transcript messages for a given conversation from ElevenLabs ConvAI API
 */
export async function getConversationTranscript(
  conversationId: string
): Promise<ConversationMessage[]> {
  console.log('🎯 Fetching transcript for conversation:', conversationId);
  console.log('🔑 Using API key:', API_KEY ? 'Present' : 'Missing');

  const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
  console.log('🌐 Making request to:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'Xi-Api-Key': API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Error response:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Raw API response:', JSON.stringify(data, null, 2));
    
    // The transcript is directly in the response's transcript array
    if (!data.transcript || !Array.isArray(data.transcript)) {
      console.warn('⚠️ No transcript found in response');
      return [];
    }

    // Map the transcript messages - note that the API returns 'message' not 'content'
    const messages = data.transcript.map((msg: ConversationMessage) => ({
      ...msg,
      content: msg.message // Add content field for backward compatibility
    }));

    console.log('✅ Successfully processed transcript messages:', messages);
    return messages;
  } catch (error) {
    console.error('💥 Error in getConversationTranscript:', error);
    throw error;
  }
} 