import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL });

export interface Notification {
  _id: string;
  type: 'new_upload';
  actor: { _id: string; name: string };
  video: { _id: string; title: string; thumbnailUrl?: string };
  read: boolean;
  createdAt: string;
}

export const getNotifications = async (token: string): Promise<{ notifications: Notification[]; unreadCount: number }> => {
  const { data } = await api.get('/notifications', { headers: { Authorization: `Bearer ${token}` } });
  return data.data;
};

export const markAllRead = async (token: string): Promise<void> => {
  await api.post('/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } });
};
