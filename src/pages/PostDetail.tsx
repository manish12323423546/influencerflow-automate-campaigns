import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  type?: string;
  shortCode: string;
  caption?: string;
  ownerUsername: string;
  ownerId?: string;
  firstComment?: string;
  latestComments?: any[];
  commentsCount?: number;
  dimensionsHeight?: number;
  dimensionsWidth?: number;
  displayUrl: string;
  videoUrl?: string;
  likesCount?: number;
  timestamp?: string;
  hashtags?: string[];
  mentions?: string[];
  childPosts?: any[];
  url?: string;
  productType?: string;
  isSponsored?: boolean;
  videoViewCount?: number;
  videoDuration?: number;
}

const PostDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { post?: Post } | undefined;
  const { shortCode } = useParams<{ shortCode: string }>();
  const post = state?.post;

  if (!post) {
    return (
      <div className="p-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4">
          Back
        </Button>
        <h2 className="text-xl font-semibold">Post not found</h2>
        <p className="mt-2">No post data available for {shortCode}.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="secondary" onClick={() => navigate(-1)}>
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Post by @{post.ownerUsername}</CardTitle>
        </CardHeader>
        <CardContent>
          <img
            src={post.displayUrl}
            alt={post.caption}
            className="w-full max-h-[600px] object-contain rounded-lg"
          />
          <p className="mt-4 whitespace-pre-wrap">{post.caption}</p>
          <p className="mt-2 text-sm text-gray-500">
            Posted: {post.timestamp ? new Date(post.timestamp).toLocaleString() : 'Unknown'}
          </p>
          <p className="text-sm text-gray-500">
            Likes: {post.likesCount ?? 0} | Comments: {post.commentsCount ?? 0}
          </p>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Hashtags</h4>
            <div className="flex flex-wrap gap-2">
              {(post.hashtags || []).map(tag => (
                <Badge key={tag}>#{tag}</Badge>
              ))}
            </div>
          </div>
          {post.mentions && post.mentions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Mentions</h4>
              <div className="flex flex-wrap gap-2">
                {post.mentions.map((m, i) => (
                  <Badge key={i}>@{m}</Badge>
                ))}
              </div>
            </div>
          )}
          {post.childPosts && post.childPosts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Child Posts</h4>
              <div className="grid grid-cols-3 gap-4">
                {post.childPosts.map((cp: any) => (
                  <img
                    key={cp.id}
                    src={cp.displayUrl}
                    alt={cp.caption || 'Child post'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostDetail; 