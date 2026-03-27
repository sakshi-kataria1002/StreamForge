import axios from 'axios';
import { Video } from './video.api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL });

export interface DashboardData {
  stats: {
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    subscriberCount: number;
  };
  videos: Video[];
}

export const getDashboard = async (token: string): Promise<DashboardData> => {
  const { data } = await api.get('/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  return data.data;
};
