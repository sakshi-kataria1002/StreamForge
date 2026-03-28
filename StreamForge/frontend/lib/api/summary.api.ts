import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL });

export interface SummaryResponse {
  summary: string;
  cached: boolean;
}

export const generateVideoSummary = async (videoId: string): Promise<SummaryResponse> => {
  const { data } = await api.post<{ success: boolean; data: SummaryResponse }>(
    `/videos/${videoId}/summary`
  );
  return data.data;
};
