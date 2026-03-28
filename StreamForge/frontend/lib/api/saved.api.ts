import axios from 'axios';
import { Video } from './video.api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL });

export interface SavedEntry {
  _id: string;
  video: Video;
  createdAt: string;
}

export const getSaved = async (token: string): Promise<SavedEntry[]> => {
  const { data } = await api.get('/saved', { headers: { Authorization: `Bearer ${token}` } });
  return data.data;
};

export const toggleSave = async (videoId: string, token: string): Promise<{ saved: boolean }> => {
  const { data } = await api.post(`/videos/${videoId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return data.data;
};

export const getSaveStatus = async (videoId: string, token: string): Promise<{ saved: boolean }> => {
  const { data } = await api.get(`/videos/${videoId}/save-status`, { headers: { Authorization: `Bearer ${token}` } });
  return data.data;
};
