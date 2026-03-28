import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL, withCredentials: true });

export interface LiveStream {
  _id: string;
  host: { _id: string; name: string };
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended';
  streamKey: string;
  viewerCount: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const createStream = async (payload: { title: string; description: string }, token: string): Promise<LiveStream> => {
  const { data } = await api.post('/livestreams', payload, { headers: authHeader(token) });
  return data.data;
};

export const getStream = async (streamId: string): Promise<LiveStream> => {
  const { data } = await api.get(`/livestreams/${streamId}`);
  return data.data;
};

export const goLive = async (streamId: string, token: string): Promise<LiveStream> => {
  const { data } = await api.patch(`/livestreams/${streamId}/go-live`, {}, { headers: authHeader(token) });
  return data.data;
};

export const endStream = async (streamId: string, token: string): Promise<void> => {
  await api.patch(`/livestreams/${streamId}/end`, {}, { headers: authHeader(token) });
};

export const getLiveStreams = async (): Promise<LiveStream[]> => {
  const { data } = await api.get('/livestreams');
  return data.data;
};
