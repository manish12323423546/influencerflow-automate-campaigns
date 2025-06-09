import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X, Search, User, Instagram } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { instagramService } from '@/services/instagram';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Creator {
  username: string;
  fullName: string;
  profilePicture?: string;
  followers?: number;
  engagement?: number;
  isVerified?: boolean;
  bio?: string;
  recentPosts?: any[];
}

interface Post {
  id: string;
  shortCode: string;
  caption: string;
  ownerUsername: string;
  ownerFullName: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  displayUrl: string;
  hashtags: string[];
  isSponsored?: boolean;
}

const RealTimeCreatorFinder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hashtags, setHashtags] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rtcf_hashtags') || '[]'); } catch { return []; }
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>(() => {
    try { return JSON.parse(localStorage.getItem('rtcf_posts') || '[]'); } catch { return []; }
  });
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(() => {
    try { return JSON.parse(localStorage.getItem('rtcf_selectedCreator') || 'null'); } catch { return null; }
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(() => {
    try { return JSON.parse(localStorage.getItem('rtcf_selectedPost') || 'null'); } catch { return null; }
  });
  const [mode, setMode] = useState<'manual'|'ai'>('manual');
  const [purpose, setPurpose] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Clear localStorage and reset all state
  const clearStorage = () => {
    localStorage.removeItem('rtcf_hashtags');
    localStorage.removeItem('rtcf_posts');
    localStorage.removeItem('rtcf_selectedPost');
    localStorage.removeItem('rtcf_selectedCreator');
    setHashtags([]);
    setPosts([]);
    setSelectedPost(null);
    setSelectedCreator(null);
    toast({ title: 'Storage cleared', description: 'All local data has been removed.' });
  };

  // Persist state to localStorage on change
  useEffect(() => { localStorage.setItem('rtcf_hashtags', JSON.stringify(hashtags)); }, [hashtags]);
  useEffect(() => { localStorage.setItem('rtcf_posts', JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem('rtcf_selectedPost', JSON.stringify(selectedPost)); }, [selectedPost]);
  useEffect(() => { localStorage.setItem('rtcf_selectedCreator', JSON.stringify(selectedCreator)); }, [selectedCreator]);

  const handleAddHashtag = () => {
    // Trim whitespace and remove leading '#'
    const tag = inputValue.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setInputValue('');
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddHashtag();
    }
  };

  // AI post filtering: select top posts via OpenAI
  const filterPostsByAI = async (postsList: Post[]): Promise<Post[]> => {
    try {
      const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      const summary = postsList.map(p => ({
        shortCode: p.shortCode,
        caption: p.caption,
        likes: p.likesCount,
        comments: p.commentsCount,
        timestamp: p.timestamp,
        sponsored: p.isSponsored ?? false
      }));
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'Select the top 5 Instagram posts based on engagement (likes and comments), recency (timestamp), and exclude sponsored content. Return a JSON array of shortCode strings.' },
            { role: 'user', content: `Here are the posts data: ${JSON.stringify(summary)}` }
          ],
          temperature: 0.7,
          max_tokens: 300
        }),
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '[]';
      const codes: string[] = JSON.parse(text);
      return postsList.filter(p => codes.includes(p.shortCode));
    } catch (err) {
      console.error('AI filtering failed, showing all posts:', err);
      return postsList;
    }
  };

  const searchCreators = async () => {
    if (hashtags.length === 0) return;
    console.log('searchCreators called with hashtags:', hashtags);
    setIsLoading(true);
    try {
      const postsResult = await instagramService.searchHashtags(hashtags);
      let finalPosts = postsResult;
      if (mode === 'ai') {
        console.log('Filtering posts via AI...');
        finalPosts = await filterPostsByAI(postsResult);
      }
      console.log('searchCreators: final posts count:', finalPosts.length);
      setPosts(finalPosts);
      toast({
        title: 'Posts fetched!',
        description: `Found ${finalPosts.length} posts for your hashtags.`,
      });
    } catch (error) {
      console.error('Error searching creators:', error);
      toast({
        title: 'Error searching creators',
        description: 'There was a problem fetching post data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewCreatorProfile = async (username: string) => {
    console.log('viewCreatorProfile called for username:', username);
    setIsLoading(true);
    try {
      const profile = await instagramService.getProfile(username);
      console.log('viewCreatorProfile: received profile', profile);
      setSelectedCreator({
        username: profile.username,
        fullName: profile.fullName,
        profilePicture: profile.profilePicUrl,
        followers: profile.followersCount,
        engagement: profile.engagementRate,
        isVerified: profile.isVerified,
        bio: profile.biography,
        recentPosts: profile.recentPosts,
      });
      console.log('viewCreatorProfile: selected creator set');
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      toast({
        title: "Error fetching profile",
        description: "Could not load the creator's profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateHashtags = async () => {
    if (!purpose.trim()) return;
    setIsLoading(true);
    try {
      const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'You generate concise Instagram hashtags.' },
            { role: 'user', content: `Generate 3 relevant hashtags for: ${purpose}` }
          ],
          temperature: 0.7,
          max_tokens: 60,
        }),
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      const tags = text.split(/[\s,]+/).map(t => t.replace(/^#/, '').trim()).filter(t => t).slice(0,3);
      setSuggestions(tags);
      // Auto-populate hashtags with AI suggestions
      setHashtags(tags);
    } catch (err) {
      console.error('Error generating hashtags:', err);
      toast({ title: 'AI error', description: 'Failed to generate hashtags.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Get Real-Time Creators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mode selection */}
            <div className="flex gap-2">
              <Button onClick={() => setMode('manual')} variant={mode==='manual'?undefined:'outline'}>Manual</Button>
              <Button onClick={() => setMode('ai')} variant={mode==='ai'?undefined:'outline'}>AI</Button>
            </div>
            {mode === 'manual' && (
              <>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Enter hashtag (e.g., fashion)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={handleAddHashtag}>Add</Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        #{tag}
                        <button
                          onClick={() => handleRemoveHashtag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Button
                      onClick={searchCreators}
                      disabled={isLoading}
                      className="ml-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Search Posts
                        </>
                      )}
                    </Button>
                    <Button variant="destructive" onClick={clearStorage} className="ml-2">
                      Clear Storage
                    </Button>
                  </div>
                )}
              </>
            )}
            {mode === 'ai' && (
              <>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Describe what you need hashtags for"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                  <Button onClick={generateHashtags} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Hashtags'}
                  </Button>
                </div>
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestions.map(tag => (
                      <Badge key={tag} className="cursor-pointer" onClick={() => setHashtags([...hashtags, tag])}>
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {/* After selecting suggestions, show hashtags list and search controls */}
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {hashtags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        #{tag}
                        <button
                          onClick={() => handleRemoveHashtag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Button
                      onClick={searchCreators}
                      disabled={isLoading}
                      className="ml-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Search Posts
                        </>
                      )}
                    </Button>
                    <Button variant="destructive" onClick={clearStorage} className="ml-2">
                      Clear Storage
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Discovered Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`cursor-pointer p-1 rounded-lg transition-opacity hover:opacity-90 ${selectedPost?.id === post.id ? 'border-2 border-blue-500' : ''}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <img
                      src={post.displayUrl}
                      alt={post.caption?.slice(0, 50) || 'Post image'}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <p className="mt-2 font-medium">@{post.ownerUsername}</p>
                    <p className="text-sm text-gray-500">{post.caption?.slice(0, 100)}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {selectedPost && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img
                src={selectedPost.displayUrl}
                alt={selectedPost.caption?.slice(0, 50) || 'Selected post'}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="space-y-2">
                <p className="font-medium">@{selectedPost.ownerUsername}</p>
                <p className="text-sm text-gray-500">{selectedPost.caption?.slice(0, 100)}</p>
                <p className="text-sm text-gray-500">{new Date(selectedPost.timestamp).toLocaleString()}</p>
                <p className="text-sm">Likes: {selectedPost.likesCount}, Comments: {selectedPost.commentsCount}</p>
                <Button onClick={() => viewCreatorProfile(selectedPost.ownerUsername)} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <User className="mr-2 h-4 w-4" />
                  )}
                  Scrape Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCreator && (
        <Card>
          <CardHeader>
            <CardTitle>Creator Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCreator.profilePicture} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedCreator.fullName}</h3>
                    {selectedCreator.isVerified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                  </div>
                  <p className="text-gray-500">@{selectedCreator.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedCreator.followers?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Followers</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedCreator.engagement?.toFixed(2)}%</p>
                  <p className="text-sm text-gray-500">Engagement</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedCreator.recentPosts?.length || 0}</p>
                  <p className="text-sm text-gray-500">Recent Posts</p>
                </div>
              </div>

              {selectedCreator.bio && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedCreator.bio}</p>
                </div>
              )}

              {selectedCreator.recentPosts && selectedCreator.recentPosts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">Recent Posts</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedCreator.recentPosts.slice(0, 6).map((post: any) => (
                      <div
                        key={post.id}
                        className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
                        onClick={() => navigate(`/post/${post.shortCode}`, { state: { post } })}
                      >
                        <img
                          src={post.displayUrl}
                          alt={post.caption?.slice(0, 50) || 'Instagram post'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeCreatorFinder; 