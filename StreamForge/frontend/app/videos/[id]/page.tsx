'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getVideo, likeVideo, dislikeVideo, getRelatedVideos, Video } from '../../../lib/api/video.api';
import { useToast } from '../../../lib/context/toast';
import { toggleSave, getSaveStatus } from '../../../lib/api/saved.api';
import { getComments, addComment, deleteComment, Comment } from '../../../lib/api/comment.api';
import { getSubscriptionStatus, toggleSubscribe } from '../../../lib/api/subscription.api';
import Link from 'next/link';
import VideoSummary from '../../../components/features/videos/VideoSummary';
import CaptionToggle from '../../../components/features/videos/CaptionToggle';
import ReportButton from '../../../components/features/moderation/ReportButton';
import AddToPlaylistModal from '../../../components/features/playlists/AddToPlaylistModal';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatViews(views: number) {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return `${views}`;
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const { showToast } = useToast();

  useEffect(() => {
    if (!currentUser) router.replace('/login');
  }, [currentUser, router]);

  const [video, setVideo] = useState<Video | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [actionError, setActionError] = useState('');
  const [related, setRelated] = useState<Video[]>([]);
  const [chapters, setChapters] = useState<{ time: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [resumeTime, setResumeTime] = useState<number | null>(null);
  const [showResume, setShowResume] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setVideoError(false);
    Promise.all([
      getVideo(id, accessToken ?? undefined),
      getComments(id),
      getRelatedVideos(id).catch(() => []),
    ])
      .then(([v, c, rel]) => {
        setVideo(v);
        setComments(c.comments);
        setLikes(v.likesCount ?? 0);
        setDislikes(v.dislikesCount ?? 0);
        setLiked(v.liked ?? false);
        setDisliked(v.disliked ?? false);
        setRelated(rel);
        // Parse chapters from description: lines like "0:00 Intro" or "1:23:45 Section"
        const parsed: { time: number; label: string }[] = [];
        const regex = /(?:^|\n)(\d+:\d{2}(?::\d{2})?)\s+(.+)/g;
        let m;
        while ((m = regex.exec(v.description ?? '')) !== null) {
          const parts = m[1].split(':').map(Number);
          const secs = parts.length === 3
            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
            : parts[0] * 60 + parts[1];
          parsed.push({ time: secs, label: m[2].trim() });
        }
        setChapters(parsed);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Load saved progress from localStorage
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`sf_progress_${id}`);
    if (saved) {
      const t = parseFloat(saved);
      if (t > 10) { setResumeTime(t); setShowResume(true); }
    }
  }, [id]);

  useEffect(() => {
    if (!video || !currentUser || !accessToken) return;
    getSaveStatus(video._id, accessToken)
      .then((s) => setSaved(s.saved))
      .catch(() => {});
  }, [video, currentUser, accessToken]);

  useEffect(() => {
    if (!video || !currentUser || !accessToken) return;
    getSubscriptionStatus(video.owner?._id, accessToken)
      .then((s) => {
        setSubscribed(s.subscribed);
        setSubscriberCount(s.subscriberCount);
      })
      .catch(() => {});
  }, [video, currentUser, accessToken]);

  const handleLike = async () => {
    if (!accessToken || !id) return;
    try {
      const result = await likeVideo(id, accessToken);
      setLikes(result.likes);
      setDislikes(result.dislikes);
      setLiked(result.liked);
      setDisliked(result.disliked);
    } catch {
      showToast('Session expired — please sign back in.', 'error');
    }
  };

  const handleDislike = async () => {
    if (!accessToken || !id) return;
    try {
      const result = await dislikeVideo(id, accessToken);
      setLikes(result.likes);
      setDislikes(result.dislikes);
      setLiked(result.liked);
      setDisliked(result.disliked);
    } catch {
      showToast('Session expired — please sign back in.', 'error');
    }
  };

  const handleSave = async () => {
    if (!accessToken || !id) return;
    try {
      const result = await toggleSave(id, accessToken);
      setSaved(result.saved);
      showToast(result.saved ? 'Saved to library' : 'Removed from saved', result.saved ? 'success' : 'info');
    } catch {
      showToast('Session expired — please sign back in.', 'error');
    }
  };

  const handleSubscribe = async () => {
    if (!accessToken || !video) return;
    try {
      const result = await toggleSubscribe(video.owner?._id, accessToken);
      setSubscribed(result.subscribed);
      setSubscriberCount(result.subscriberCount);
      showToast(result.subscribed ? `Subscribed to ${video.owner?.name}` : 'Unsubscribed', result.subscribed ? 'success' : 'info');
    } catch {
      showToast('Session expired — please sign back in.', 'error');
    }
  };

  const handleComment = async () => {
    if (!commentInput.trim() || !accessToken || !id) return;
    setSubmitting(true);
    try {
      const c = await addComment(id, commentInput.trim(), accessToken);
      setComments((prev) => [c, ...prev]);
      setCommentInput('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!accessToken) return;
    await deleteComment(commentId, accessToken);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="w-full aspect-video bg-gray-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center text-gray-500 dark:text-slate-400">
        <p className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-2">Video not found</p>
        <p className="text-sm">This video may have been deleted or doesn't exist.</p>
        <Link href="/feed" className="mt-6 inline-block text-indigo-600 hover:underline text-sm font-medium">
          ← Back to feed
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === video.owner?._id;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Resume banner */}
          {showResume && resumeTime && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-sm">
              <span className="text-indigo-700 dark:text-indigo-300">
                Resume from <span className="font-semibold">{Math.floor(resumeTime / 60)}:{String(Math.floor(resumeTime % 60)).padStart(2, '0')}</span>?
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = resumeTime;
                    setShowResume(false);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  Resume
                </button>
                <button type="button" onClick={() => setShowResume(false)} className="text-xs font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 px-2">
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* Video player */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-lg">
            {videoError ? (
              <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-900 text-gray-400 gap-3">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-sm">Could not load video</p>
                <a href={video.fileUrl} target="_blank" rel="noopener noreferrer"
                   className="text-indigo-400 text-xs hover:underline">
                  Try opening directly
                </a>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={video.fileUrl}
                  controls
                  className="w-full aspect-video"
                  onError={() => setVideoError(true)}
                  onTimeUpdate={(e) => {
                    const t = e.currentTarget.currentTime;
                    const dur = e.currentTarget.duration;
                    if (!dur || t < 5) return;
                    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
                    progressSaveTimer.current = setTimeout(() => {
                      if (dur - t > 10) localStorage.setItem(`sf_progress_${id}`, String(t));
                      else localStorage.removeItem(`sf_progress_${id}`);
                    }, 3000);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
                <CaptionToggle videoRef={videoRef} subtitleUrl={(video as any).subtitleUrl ?? null} />
              </>
            )}
          </div>

          {/* Title & meta */}
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{video.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {video.owner?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{video.owner?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{subscriberCount} subscribers</p>
                </div>
                {currentUser && !isOwner && (
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    className={`ml-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      subscribed
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {subscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={!currentUser}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    liked ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                  </svg>
                  {likes}
                </button>
                <button
                  type="button"
                  onClick={handleDislike}
                  disabled={!currentUser}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    disliked ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384" />
                  </svg>
                  {dislikes}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!currentUser}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    saved ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  {saved ? 'Saved' : 'Save'}
                </button>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => setShowPlaylistModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                    Save to playlist
                  </button>
                )}
                <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">{formatViews(video.views)} views · {timeAgo(video.createdAt)}</span>
                {currentUser && !isOwner && (
                  <ReportButton targetId={video._id} targetType="video" />
                )}
              </div>
            </div>

            {video.description && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">
                {video.description}
              </div>
            )}

            <VideoSummary videoId={video._id} initialSummary={(video as any).summary ?? null} />
          </div>

          {/* Comments */}
          <div className="space-y-4 pt-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{comments.length} Comments</h2>

            {currentUser ? (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                    placeholder="Add a comment..."
                    className="w-full border-b border-gray-300 dark:border-slate-700 focus:border-indigo-500 outline-none py-1.5 text-sm text-gray-900 dark:text-white bg-transparent placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
                  />
                  {commentInput.trim() && (
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setCommentInput('')} className="text-xs text-gray-500 dark:text-slate-400 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleComment}
                        disabled={submitting}
                        className="text-xs font-semibold bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {submitting ? 'Posting...' : 'Comment'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-slate-500">
                <Link href="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link> to comment
              </p>
            )}

            <div className="space-y-4 mt-2">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-slate-300 font-bold text-xs shrink-0">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{comment.author.name}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300 mt-0.5">{comment.body}</p>
                  </div>
                  {currentUser?.id === comment.author._id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors mt-0.5 shrink-0"
                      title="Delete"
                      aria-label="Delete comment"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      {showPlaylistModal && video && (
        <AddToPlaylistModal videoId={video._id} onClose={() => setShowPlaylistModal(false)} />
      )}

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-5">

          {/* Chapters */}
          {chapters.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Chapters</p>
              <div className="space-y-1">
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = ch.time;
                        videoRef.current.play();
                      }
                    }}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left group"
                  >
                    <span className="text-xs font-mono font-semibold text-indigo-500 shrink-0 w-12">
                      {ch.time >= 3600
                        ? `${Math.floor(ch.time / 3600)}:${String(Math.floor((ch.time % 3600) / 60)).padStart(2, '0')}:${String(ch.time % 60).padStart(2, '0')}`
                        : `${Math.floor(ch.time / 60)}:${String(ch.time % 60).padStart(2, '0')}`}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {ch.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related videos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Up Next</p>
            {related.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">
                No related videos found
              </div>
            ) : (
              <div className="space-y-3">
                {related.map((rv) => (
                  <Link
                    key={rv._id}
                    href={`/videos/${rv._id}`}
                    className="flex gap-3 group"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-36 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0">
                      {rv.thumbnailUrl ? (
                        <img
                          src={rv.thumbnailUrl}
                          alt={rv.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {rv.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{rv.owner?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{formatViews(rv.views)} views</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
