'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  username: string;
  message: string;
  timestamp: string | Date;
}

interface LiveChatProps {
  streamId: string;
  username: string;
}

export default function LiveChat({ streamId, username }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-stream', streamId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('new-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-199), msg]);
    });
    socket.on('viewer-count', (count: number) => setViewerCount(count));

    return () => {
      socket.emit('leave-stream', streamId);
      socket.disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !socketRef.current || !connected) return;
    socketRef.current.emit('send-message', { streamId, message: trimmed, username });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts: string | Date) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">Live Chat</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {viewerCount} watching
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center pt-8">
            {connected ? 'No messages yet. Say hello!' : 'Connecting to chat…'}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-indigo-400 shrink-0">{msg.username}</span>
              <span className="text-[11px] text-slate-600 shrink-0">{formatTime(msg.timestamp)}</span>
            </div>
            <p className="text-sm text-slate-300 break-words leading-snug">{msg.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Say something…' : 'Connecting…'}
            disabled={!connected}
            maxLength={500}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-200 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !input.trim()}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
