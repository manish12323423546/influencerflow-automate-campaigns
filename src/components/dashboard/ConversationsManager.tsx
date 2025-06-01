import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Headphones, Trash2, Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getConversationTranscript, ConversationMessage } from '@/lib/elevenlabs';

interface Conversation {
  agent_id: string;
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: string;
  call_successful: string;
  agent_name: string;
  has_audio: boolean;
  has_user_audio: boolean;
  has_response_audio: boolean;
  metadata?: {
    start_time_unix_secs: number;
    accepted_time_unix_secs: number | null;
    call_duration_secs: number;
    cost: number;
    deletion_settings: {
      deletion_time_unix_secs: number | null;
      deleted_logs_at_time_unix_secs: number | null;
      deleted_audio_at_time_unix_secs: number | null;
      deleted_transcript_at_time_unix_secs: number | null;
      delete_transcript_and_pii: boolean;
      delete_audio: boolean;
    };
    feedback: {
      overall_score: number | null;
      likes: number;
      dislikes: number;
    };
  };
  analysis?: {
    evaluation_criteria_results: any;
    data_collection_results: any;
    call_successful: string;
    transcript_summary: string;
  };
}

interface AudioPlayerState {
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
}

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

const ConversationsManager = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [transcripts, setTranscripts] = useState<ConversationMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [playingConversationId, setPlayingConversationId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    duration: 0,
    currentTime: 0,
    volume: 1,
    isMuted: false,
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (selectedConversation) {
      console.log('🎬 Starting transcript fetch for conversation:', selectedConversation.conversation_id);
      
      getConversationTranscript(selectedConversation.conversation_id)
        .then((msgs) => {
          console.log('📝 Setting transcripts:', msgs);
          setTranscripts(msgs);
        })
        .catch((err) => {
          console.error('🚨 Transcript fetch error:', err);
          toast({
            title: 'Transcript Error',
            description: 'Failed to load transcript.',
            variant: 'destructive',
          });
        });
    } else {
      console.log('🧹 Clearing transcripts - no conversation selected');
      setTranscripts([]);
    }
  }, [selectedConversation, toast]);

  const fetchConversations = async (cursor?: string) => {
    if (!API_KEY) {
      toast({
        title: "Configuration Error",
        description: "API key is not configured. Please check your environment settings.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const url = new URL('https://api.elevenlabs.io/v1/convai/conversations');
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }
      url.searchParams.append('page_size', '10');

      const response = await fetch(url.toString(), {
        headers: {
          'Xi-Api-Key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(prev => cursor ? [...prev, ...data.conversations] : data.conversations);
      setHasMore(data.has_more);
      setNextCursor(data.next_cursor);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations. Please check your API key and try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!API_KEY) {
      toast({
        title: "Configuration Error",
        description: "API key is not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Xi-Api-Key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      setConversations(prev => prev.filter(conv => conv.conversation_id !== conversationId));
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const handlePlayAudio = async (conversationId: string) => {
    if (!API_KEY) {
      toast({
        title: "Configuration Error",
        description: "API key is not configured",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying && playingConversationId === conversationId) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
        headers: {
          'Xi-Api-Key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setIsPlaying(true);
      setPlayingConversationId(conversationId);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error fetching audio:', error);
      toast({
        title: "Error",
        description: "Failed to load audio",
        variant: "destructive",
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioState(prev => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
        duration: audioRef.current?.duration || 0,
      }));
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setAudioState(prev => ({ ...prev, currentTime: value[0] }));
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setAudioState(prev => ({ 
        ...prev, 
        volume: newVolume,
        isMuted: newVolume === 0
      }));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !audioState.isMuted;
      audioRef.current.volume = newMuted ? 0 : audioState.volume;
      setAudioState(prev => ({ ...prev, isMuted: newMuted }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchConversations();
    // Cleanup function to revoke any object URLs when component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const formatDate = (unixSecs: number) => {
    return new Date(unixSecs * 1000).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = (conversation: Conversation, messages: ConversationMessage[]) => {
    try {
      // Helper function to clean text by removing extra spaces and normalizing line breaks
      const cleanText = (text: string) => {
        if (!text) return '';
        return text
          .replace(/[\n\r]+/g, ' ')  // Replace newlines with spaces
          .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
          .trim();
      };

      // Format timestamp consistently
      const formatTimestamp = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      // Create transcript content with proper formatting
      const header = [
        'Conversation Transcript',
        '===================',
        `Date: ${formatDate(conversation.start_time_unix_secs)}`,
        `Duration: ${formatDuration(conversation.call_duration_secs)}`,
        `Agent: ${conversation.agent_name}`,
        `Status: ${conversation.status}`,
        '',
        'Messages:',
        '===================',
        ''
      ].join('\n');

      // Format messages with sequence numbers
      const messageContent = messages.map((msg, index) => {
        const sequence = (index + 1).toString().padStart(2, '0');
        const timestamp = formatTimestamp(msg.time_in_call_secs);
        const role = msg.role.toUpperCase();
        const medium = msg.source_medium ? ` via ${msg.source_medium}` : '';
        const interrupted = msg.interrupted ? ' [Interrupted]' : '';
        
        // Format the message block
        const messageBlock = [
          `Message #${sequence} [${timestamp}]`,
          `Role: ${role}${medium}${interrupted}`,
          '---',
          cleanText(msg.message)
        ];

        // Add metadata if present
        const metadata = [];
        if (msg.tool_calls?.length) {
          metadata.push(`Tools Used: ${msg.tool_calls.length}`);
        }
        if (msg.llm_usage) {
          const tokens = Object.values(msg.llm_usage.model_usage)[0]?.output_total?.tokens;
          if (tokens) {
            metadata.push(`LLM Tokens: ${tokens}`);
          }
        }
        if (metadata.length > 0) {
          messageBlock.push('---', `Metadata: ${metadata.join(', ')}`);
        }

        return messageBlock.join('\n');
      }).join('\n\n');

      const content = `${header}${messageContent}`;

      // Create and download file with UTF-8 encoding
      const blob = new Blob([content], { 
        type: 'text/plain;charset=utf-8' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date(conversation.start_time_unix_secs * 1000)
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, 14);
      a.download = `transcript_${conversation.conversation_id}_${timestamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Transcript downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast({
        title: "Error",
        description: "Failed to download transcript",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {!API_KEY && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mb-4">
          <p className="text-red-500">API key is not configured. Please add VITE_ELEVENLABS_API_KEY to your environment variables.</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-snow">AI Conversations</h2>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center text-snow">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-snow">No conversations found</div>
        ) : (
          conversations.map((conversation) => (
            <Card key={conversation.conversation_id} className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg text-snow">
                    Conversation with {conversation.agent_name}
                  </CardTitle>
                  <p className="text-sm text-snow/60">
                    {formatDate(conversation.start_time_unix_secs)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlayAudio(conversation.conversation_id)}
                    className="text-snow hover:text-coral"
                  >
                    {isPlaying && selectedConversation?.conversation_id === conversation.conversation_id ? 
                      <Pause className="h-4 w-4" /> : 
                      <Play className="h-4 w-4" />
                    }
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(conversation)}
                    className="text-snow hover:text-coral flex items-center gap-1"
                  >
                    <Headphones className="h-4 w-4" />
                    <span className="hidden sm:inline">View Transcript</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConversation(conversation.conversation_id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-snow/60">Duration</p>
                    <p className="text-snow font-medium">
                      {formatDuration(conversation.call_duration_secs)}
                    </p>
                  </div>
                  <div>
                    <p className="text-snow/60">Messages</p>
                    <p className="text-snow font-medium">{conversation.message_count}</p>
                  </div>
                  <div>
                    <p className="text-snow/60">Status</p>
                    <p className="text-snow font-medium capitalize">{conversation.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => fetchConversations(nextCursor || undefined)}
            className="bg-coral hover:bg-coral/90 text-white"
          >
            Load More
          </Button>
        </div>
      )}

      {/* Audio Player Control Bar */}
      {isPlaying && audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 p-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlayAudio(playingConversationId!)}
              className="text-snow hover:text-coral"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs text-snow/60">
                <span>{formatTime(audioState.currentTime)}</span>
                <span>{formatTime(audioState.duration)}</span>
              </div>
              <Slider
                value={[audioState.currentTime]}
                max={audioState.duration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-snow hover:text-coral"
              >
                {audioState.isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[audioState.isMuted ? 0 : audioState.volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          setPlayingConversationId(null);
          setAudioState(prev => ({ ...prev, currentTime: 0 }));
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setAudioState(prev => ({
              ...prev,
              duration: audioRef.current?.duration || 0,
            }));
          }
        }}
        className="hidden"
      />

      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-snow">Conversation Details</DialogTitle>
                <DialogDescription className="text-snow/60">
                  Full conversation transcript and analytics
                </DialogDescription>
              </div>
              {selectedConversation && transcripts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTranscript(selectedConversation, transcripts)}
                  className="border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Transcript
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Call Summary Section */}
          {selectedConversation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-snow/60">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-snow">
                    {formatDuration(selectedConversation.call_duration_secs)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-snow/60">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-snow capitalize">
                    {selectedConversation.status}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-snow/60">Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-snow">
                    {selectedConversation.agent_name}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transcript Section */}
          {selectedConversation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-snow">Conversation Transcript</h3>
                <p className="text-xs text-snow/60">
                  Started at: {formatDate(selectedConversation.start_time_unix_secs)}
                </p>
              </div>
              
              <div className="space-y-4 border border-zinc-800 rounded-lg p-4">
                {transcripts.length === 0 ? (
                  <div className="text-center py-8">
                    {selectedConversation.status === 'initiated' ? (
                      <>
                        <div className="text-snow/60 mb-2">Call Initiated</div>
                        <p className="text-sm text-snow/40">
                          The conversation has been initiated but no messages have been exchanged yet.
                        </p>
                      </>
                    ) : selectedConversation.status === 'in-progress' ? (
                      <>
                        <div className="animate-pulse flex justify-center">
                          <div className="h-2 w-2 bg-coral rounded-full mx-1"></div>
                          <div className="h-2 w-2 bg-coral rounded-full mx-1 animate-pulse-delay-200"></div>
                          <div className="h-2 w-2 bg-coral rounded-full mx-1 animate-pulse-delay-400"></div>
                        </div>
                        <p className="text-sm text-snow/40 mt-2">
                          Call in progress, waiting for messages...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-snow/60 mb-2">No Messages</div>
                        <p className="text-sm text-snow/40">
                          No transcript messages are available for this conversation.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  transcripts.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg ${
                        msg.role === 'agent' 
                          ? 'bg-zinc-800 ml-4' 
                          : 'bg-zinc-700 mr-4'
                      } p-4`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            msg.role === 'agent' 
                              ? 'bg-coral/20 text-coral' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {msg.role.toUpperCase()}
                          </span>
                          <span className="text-snow/60 text-xs">
                            {formatDuration(msg.time_in_call_secs)} into call
                          </span>
                        </div>
                        {msg.source_medium && (
                          <span className="text-xs text-snow/40">
                            via {msg.source_medium}
                          </span>
                        )}
                      </div>
                      <p className="text-snow whitespace-pre-wrap">{msg.message}</p>
                      
                      {/* Show additional message metadata if available */}
                      {(msg.tool_calls?.length > 0 || msg.interrupted || msg.llm_usage) && (
                        <div className="mt-2 pt-2 border-t border-zinc-700/50 text-xs text-snow/40 space-y-1">
                          {msg.interrupted && (
                            <p>⚡ Message was interrupted</p>
                          )}
                          {msg.tool_calls?.length > 0 && (
                            <p>🛠 Used {msg.tool_calls.length} tools</p>
                          )}
                          {msg.llm_usage && (
                            <p>📊 LLM tokens used: {
                              Object.values(msg.llm_usage.model_usage)[0].output_total.tokens
                            }</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Call Analytics Section */}
          {selectedConversation && transcripts.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-snow">Call Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-snow/60">Message Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-snow">
                        {transcripts.length}
                      </p>
                      <div className="text-xs text-snow/60">
                        <p>User: {transcripts.filter(m => m.role === 'user').length}</p>
                        <p>Agent: {transcripts.filter(m => m.role === 'agent').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-snow/60">Audio Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedConversation.has_audio ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-snow text-sm">Recording Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedConversation.has_user_audio ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-snow text-sm">User Audio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedConversation.has_response_audio ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-snow text-sm">Agent Audio</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConversationsManager; 