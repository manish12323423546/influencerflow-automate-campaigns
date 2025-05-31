import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Headphones, Trash2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Conversation {
  agent_id: string;
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: string;
  call_successful: string;
  agent_name: string;
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
                    className="text-snow hover:text-coral"
                  >
                    <Headphones className="h-4 w-4" />
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
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-snow">Conversation Details</DialogTitle>
            <DialogDescription className="text-snow/60">
              View detailed information about this conversation
            </DialogDescription>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-snow/60">Agent</h4>
                <p className="text-snow">{selectedConversation.agent_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-snow/60">Start Time</h4>
                <p className="text-snow">
                  {formatDate(selectedConversation.start_time_unix_secs)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-snow/60">Duration</h4>
                <p className="text-snow">
                  {formatDuration(selectedConversation.call_duration_secs)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-snow/60">Status</h4>
                <p className="text-snow capitalize">{selectedConversation.status}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-snow/60">Call Result</h4>
                <p className="text-snow capitalize">{selectedConversation.call_successful}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConversationsManager; 