import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL });

export interface Video {
  _id: string;
  title: string;
  description: string;
  owner: { _id: string; name: string };
  filePath: string;
  fileUrl: string;
  thumbnailUrl?: string;
  status: 'ready';
  duration: number;
  views: number;
  likesCount?: number;
  dislikesCount?: number;
  liked?: boolean;
  disliked?: boolean;
  createdAt: string;
}

export const uploadVideo = async (
  formData: FormData,
  token: string,
  onProgress?: (percent: number) => void
): Promise<Video> => {
  const { data } = await api.post('/videos', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data.data;
};

export const getVideos = async (
  page = 1
): Promise<{ videos: Video[]; total: number; page: number; totalPages: number }> => {
  const { data } = await api.get('/videos', { params: { page } });
  return data.data;
};

export const getVideo = async (id: string, token?: string): Promise<Video> => {
  const { data } = await api.get(`/videos/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data.data;
};

export const deleteVideo = async (id: string, token: string): Promise<void> => {
  await api.delete(`/videos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateVideo = async (
  id: string,
  body: { title?: string; description?: string },
  token: string
): Promise<Video> => {
  const { data } = await api.put(`/videos/${id}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const likeVideo = async (id: string, token: string) => {
  const { data } = await api.post(`/videos/${id}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const dislikeVideo = async (id: string, token: string) => {
  const { data } = await api.post(`/videos/${id}/dislike`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const getUserVideos = async (userId: string): Promise<Video[]> => {
  const { data } = await api.get(`/users/${userId}/videos`);
  return data.data;
};
