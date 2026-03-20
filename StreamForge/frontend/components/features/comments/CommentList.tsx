'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getComments, deleteComment, Comment } from '../../../lib/api/comment.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

interface CommentListProps {
  videoId: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-3/4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommentList({ videoId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    getComments(videoId)
      .then((res) => setComments(res.comments))
      .finally(() => setLoading(false));
  }, [videoId]);

  const handleDelete = async (commentId: string) => {
    if (!accessToken) return;
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    try {
      await deleteComment(commentId, accessToken);
    } catch {
      // re-fetch on failure
      const res = await getComments(videoId);
      setComments(res.comments);
    }
  };

  if (loading) return <Skeleton />;

  if (comments.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No comments yet. Be the first!</p>;
  }

  return (
    <ul className="space-y-5">
      {comments.map((comment) => (
        <li key={comment._id} className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0">
            {comment.author.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
              <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{comment.body}</p>
          </div>
          {currentUser && comment.author._id === currentUser.id && (
            <button
              onClick={() => handleDelete(comment._id)}
              className="text-xs text-gray-400 hover:text-red-500 self-start mt-1"
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
