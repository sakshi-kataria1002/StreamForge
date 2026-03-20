import axios from 'axios';
import { Video } from './video.api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL });

export interface SubscriptionStatus {
  subscribed: boolean;
  subscriberCount: number;
}

export const toggleSubscribe = async (
  creatorId: string,
  token: string
): Promise<SubscriptionStatus> => {
  const { data } = await api.post(
    `/users/${creatorId}/subscribe`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.data;
};

export const getSubscriptionStatus = async (
  creatorId: string,
  token: string
): Promise<SubscriptionStatus> => {
  const { data } = await api.get(`/users/${creatorId}/subscribe`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const getFeed = async (
  page = 1,
  token?: string
): Promise<{ videos: Video[]; total: number; page: number; totalPages: number }> => {
  const { data } = await api.get('/feed', {
    params: { page },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data.data;
};
