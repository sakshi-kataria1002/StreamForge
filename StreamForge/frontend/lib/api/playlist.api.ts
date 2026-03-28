import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL, withCredentials: true });

export interface PlaylistVideo {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  fileUrl: string;
  views: number;
  duration: number;
  owner: { _id: string; name: string };
  createdAt: string;
}

export interface Playlist {
  _id: string;
  title: string;
  description: string;
  owner: { _id: string; name: string };
  videos: PlaylistVideo[];
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistStatus {
  _id: string;
  title: string;
  hasVideo: boolean;
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const createPlaylist = async (
  payload: { title: string; description?: string; visibility?: string },
  token: string
): Promise<Playlist> => {
  const { data } = await api.post('/playlists', payload, auth(token));
  return data.data;
};

export const getMyPlaylists = async (token: string): Promise<Playlist[]> => {
  const { data } = await api.get('/playlists/my', auth(token));
  return data.data;
};

export const getPlaylist = async (id: string, token?: string): Promise<Playlist> => {
  const { data } = token
    ? await api.get(`/playlists/${id}`, auth(token))
    : await api.get(`/playlists/${id}`);
  return data.data;
};

export const updatePlaylist = async (
  id: string,
  payload: Partial<{ title: string; description: string; visibility: string }>,
  token: string
): Promise<Playlist> => {
  const { data } = await api.patch(`/playlists/${id}`, payload, auth(token));
  return data.data;
};

export const deletePlaylist = async (id: string, token: string): Promise<void> => {
  await api.delete(`/playlists/${id}`, auth(token));
};

export const addVideoToPlaylist = async (
  playlistId: string,
  videoId: string,
  token: string
): Promise<void> => {
  await api.post(`/playlists/${playlistId}/videos`, { videoId }, auth(token));
};

export const removeVideoFromPlaylist = async (
  playlistId: string,
  videoId: string,
  token: string
): Promise<void> => {
  await api.delete(`/playlists/${playlistId}/videos/${videoId}`, auth(token));
};

export const getVideoPlaylistStatus = async (
  videoId: string,
  token: string
): Promise<PlaylistStatus[]> => {
  const { data } = await api.get(`/playlists/video-status/${videoId}`, auth(token));
  return data.data;
};
