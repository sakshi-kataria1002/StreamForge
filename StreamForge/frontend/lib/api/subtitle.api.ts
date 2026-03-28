import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL });

export interface SubtitleUploadResponse {
  subtitleUrl: string;
}

export const uploadSubtitle = async (
  videoId: string,
  file: File,
  token: string
): Promise<SubtitleUploadResponse> => {
  const formData = new FormData();
  formData.append('subtitle', file);

  const { data } = await api.post<{ success: boolean; data: SubtitleUploadResponse }>(
    `/videos/${videoId}/subtitles`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data.data;
};

export const deleteSubtitle = async (videoId: string, token: string): Promise<void> => {
  await api.delete(`/videos/${videoId}/subtitles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
