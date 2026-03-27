import axios from 'axios';
import { Video } from './video.api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL });

export interface HistoryEntry {
  _id: string;
  video: Video;
  watchedAt: string;
}

export const getHistory = async (token: string): Promise<HistoryEntry[]> => {
  const { data } = await api.get('/history', { headers: { Authorization: `Bearer ${token}` } });
  return data.data;
};

export const clearHistory = async (token: string): Promise<void> => {
  await api.delete('/history', { headers: { Authorization: `Bearer ${token}` } });
};
