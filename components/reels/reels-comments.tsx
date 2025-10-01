'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  ScrollArea 
} from '@/components/ui/scroll-area';
import { 
  Send, 
  Heart, 
  MoreHorizontal,
  Flag,
  Trash2,
  Edit,
  Reply,
  X,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  likeCount: number;
  isLiked?: boolean;
  replyCount: number;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  replies?: Comment[];
  parentId?: string;
}

interface ReelsCommentsProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  className?: string;
}

export function ReelsComments({ 
  reelId, 
  isOpen, 
  onClose, 
  userId,
  className 
}: ReelsCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load comments
  const loadComments = useCallback(async () => {
    if (!reelId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reels/${reelId}/comments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [reelId]);

  // Submit comment
  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !userId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyingTo?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Add new comment to state
        const comment = {
          ...data.comment,
          replies: []
        };
        
        if (replyingTo) {
          // Add as reply
          setComments(prev => prev.map(c => {
            if (c.id === replyingTo.id) {
              return {
                ...c,
                replyCount: c.replyCount + 1,
                replies: [...(c.replies || []), comment]
              };
            }
            return c;
          }));
          setReplyingTo(null);
          setReplyContent('');
        } else {
          // Add as top-level comment
          setComments(prev => [comment, ...prev]);
        }
        
        setNewComment('');
        toast({
          title: 'Comment posted!',
          description: 'Your comment has been added',
        });
      }
    } catch (err) {
      toast({
        title: 'Failed to post comment',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, userId, reelId, replyingTo, toast]);

  // Submit reply
  const handleSubmitReply = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !replyingTo || !userId) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId: replyingTo.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post reply');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.id) {
            return {
              ...c,
              replyCount: c.replyCount + 1,
              replies: [...(c.replies || []), data.comment]
            };
          }
          return c;
        }));
        
        setReplyingTo(null);
        setReplyContent('');
        
        toast({
          title: 'Reply posted!',
          description: 'Your reply has been added',
        });
      }
    } catch (err) {
      toast({
        title: 'Failed to post reply',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [replyContent, replyingTo, reelId, userId, toast]);

  // Like comment
  const handleLikeComment = useCallback(async (commentId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/reels/${reelId}/comments/${commentId}/like`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            const isLiked = comment.isLiked;
            return {
              ...comment,
              isLiked: !isLiked,
              likeCount: isLiked ? comment.likeCount - 1 : comment.likeCount + 1
            };
          }
          
          // Check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === commentId) {
                  const isLiked = reply.isLiked;
                  return {
                    ...reply,
                    isLiked: !isLiked,
                    likeCount: isLiked ? reply.likeCount - 1 : reply.likeCount + 1
                  };
                }
                return reply;
              })
            };
          }
          
          return comment;
        }));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  }, [userId, reelId]);

  // Delete comment
  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast({
          title: 'Comment deleted',
          description: 'Your comment has been removed',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to delete comment',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [reelId, toast]);

  // Edit comment
  const handleEditComment = useCallback(async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await fetch(`/api/reels/${reelId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim()
        })
      });
      
      if (response.ok) {
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: editContent.trim(),
              isEdited: true,
              updatedAt: new Date().toISOString()
            };
          }
          return comment;
        }));
        
        setEditingComment(null);
        setEditContent('');
        
        toast({
          title: 'Comment updated!',
          description: 'Your comment has been edited',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to update comment',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [reelId, editContent, toast]);

  // Report comment
  const handleReportComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/comments/${commentId}/report`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: 'Comment reported',
          description: 'Thank you for helping us maintain a safe community',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to report comment',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [reelId, toast]);

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString();
  };

  // Load comments when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, loadComments]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [comments]);

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isOwner = comment.user.id === userId;
    
    return (
      <div className={cn('flex gap-3 py-3', isReply && 'ml-8 border-l-2 border-gray-200 pl-4')}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.user.avatar} />
          <AvatarFallback className="text-xs">
            {comment.user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.user.name}</span>
            {comment.user.verified && (
              <Badge variant="secondary" className="text-xs bg-blue-500">
                ✓
              </Badge>
            )}
            <span className="text-gray-500 text-xs">
              {formatTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-gray-400 text-xs">(edited)</span>
            )}
          </div>
          
          {editingComment?.id === comment.id ? (
            <div className="flex gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => handleEditComment(comment.id)}
                disabled={!editContent.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-900 mb-2">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={cn(
                    'flex items-center gap-1 text-xs text-gray-500 hover:text-red-500',
                    comment.isLiked && 'text-red-500'
                  )}
                >
                  <Heart className={cn('w-3 h-3', comment.isLiked && 'fill-current')} />
                  {comment.likeCount > 0 && comment.likeCount}
                </button>
                
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(comment)}
                    className="text-xs text-gray-500 hover:text-blue-500"
                  >
                    Reply
                  </button>
                )}
                
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingComment(comment);
                        setEditContent(comment.content);
                      }}>
                        <Edit className="w-3 h-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {!isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleReportComment(comment.id)}>
                        <Flag className="w-3 h-3 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} isReply />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            Comments ({comments.length})
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadComments}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          {userId ? (
            <>
              {replyingTo ? (
                <form onSubmit={handleSubmitReply} className="w-full">
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${replyingTo.user.name}...`}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmitting}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Replying to <span className="font-medium">{replyingTo.user.name}</span>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSubmitComment} className="w-full">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="w-full text-center py-4">
              <p className="text-gray-500 text-sm">
                Please sign in to comment
              </p>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


