'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { addComment, Comment } from '../../../lib/api/comment.api';

const MAX_LENGTH = 2000;

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

interface CommentInputProps {
  videoId: string;
  onCommentAdded: (comment: Comment) => void;
}

export default function CommentInput({ videoId, onCommentAdded }: CommentInputProps) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  if (!currentUser || !accessToken) {
    return (
      <p className="text-sm text-gray-500 py-3">
        <span className="text-indigo-600 font-medium cursor-pointer hover:underline">Sign in</span>{' '}
        to leave a comment.
      </p>
    );
  }

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const comment = await addComment(videoId, trimmed, accessToken);
      onCommentAdded(comment);
      setBody('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to post comment. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Add a comment..."
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${body.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
          {body.length} / {MAX_LENGTH}
        </span>
        <button
          onClick={handleSubmit}
          disabled={submitting || !body.trim()}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
