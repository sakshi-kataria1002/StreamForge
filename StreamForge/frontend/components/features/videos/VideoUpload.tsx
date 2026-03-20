'use client';

import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getUploadUrl, createVideo } from '../../../lib/api/video.api';

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

export default function VideoUpload() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [doneTitle, setDoneTitle] = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!currentUser || !accessToken) {
    return (
      <p className="text-sm text-gray-500 py-4">
        <span className="text-indigo-600 font-medium">Sign in</span> to upload videos.
      </p>
    );
  }

  const reset = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setStage('idle');
    setErrorMsg('');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    try {
      setStage('uploading');
      setUploadProgress(0);

      // 1. Get pre-signed S3 URL
      const { uploadUrl, s3Key, bucket } = await getUploadUrl(file.name, file.type, accessToken);

      // 2. Upload directly to S3 via XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });

      // 3. Save metadata + trigger transcoding
      const video = await createVideo(
        { title: title.trim(), description: description.trim(), s3Key, s3Bucket: bucket },
        accessToken
      );

      setDoneTitle(video.title);
      setStage('processing');

      // 4. Poll for transcoding completion
      pollRef.current = setInterval(async () => {
        try {
          const { status } = await getVideoStatus(video._id, accessToken);
          if (status === 'ready') {
            if (pollRef.current) clearInterval(pollRef.current);
            setStage('done');
          }
        } catch {
          // keep polling
        }
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
      setStage('error');
    }
  };

  // Need getVideoStatus in scope — import it
  const getVideoStatus = async (videoId: string, token: string) => {
    const { getVideoStatus: fn } = await import('../../../lib/api/video.api');
    return fn(videoId, token);
  };

  if (stage === 'done') {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-gray-900">Your video is live!</h2>
        <p className="text-gray-500 mt-1">{doneTitle}</p>
        <button onClick={reset} className="mt-6 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Upload another
        </button>
      </div>
    );
  }

  if (stage === 'processing') {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-700 font-medium">Transcoding your video...</p>
        <p className="text-sm text-gray-400 mt-1">This may take a minute. You can leave this page.</p>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-medium">{errorMsg}</p>
        <button onClick={reset} className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* File picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Video file</label>
        <input
          type="file"
          accept="video/*"
          disabled={stage === 'uploading'}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {file && <p className="text-xs text-gray-400 mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={stage === 'uploading'}
          maxLength={200}
          placeholder="Enter a title for your video"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={stage === 'uploading'}
          maxLength={5000}
          rows={3}
          placeholder="Tell viewers about your video"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Progress bar */}
      {stage === 'uploading' && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleUpload}
        disabled={stage === 'uploading' || !file || !title.trim()}
        className="w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {stage === 'uploading' ? 'Uploading...' : 'Upload Video'}
      </button>
    </div>
  );
}
