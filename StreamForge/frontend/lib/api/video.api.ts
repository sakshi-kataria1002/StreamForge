import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL });

export interface Video {
  _id: string;
  title: string;
  description: string;
  owner: { _id: string; name: string };
  s3Key: string;
  s3Bucket: string;
  status: 'pending' | 'processing' | 'ready';
  thumbnailUrl?: string;
  cloudinaryPublicId?: string;
  duration: number;
  views: number;
  createdAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  bucket: string;
}

export const getUploadUrl = async (
  filename: string,
  contentType: string,
  token: string
): Promise<UploadUrlResponse> => {
  const { data } = await api.post(
    '/videos/upload-url',
    { filename, contentType },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.data;
};

export const createVideo = async (
  payload: { title: string; description: string; s3Key: string; s3Bucket: string },
  token: string
): Promise<Video> => {
  const { data } = await api.post('/videos', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const getVideoStatus = async (
  videoId: string,
  token: string
): Promise<{ status: string; thumbnailUrl?: string }> => {
  const { data } = await api.get(`/videos/${videoId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const getVideos = async (
  page = 1
): Promise<{ videos: Video[]; total: number; page: number; totalPages: number }> => {
  const { data } = await api.get('/videos', { params: { page } });
  return data.data;
};
