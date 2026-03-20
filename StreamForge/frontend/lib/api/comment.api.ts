import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL });

export interface Comment {
  _id: string;
  body: string;
  author: { _id: string; name: string };
  videoId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

export const getComments = async (videoId: string, page = 1): Promise<CommentsResponse> => {
  const { data } = await api.get(`/videos/${videoId}/comments`, { params: { page } });
  return data.data;
};

export const addComment = async (
  videoId: string,
  body: string,
  token: string
): Promise<Comment> => {
  const { data } = await api.post(
    `/videos/${videoId}/comments`,
    { body },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.data;
};

export const deleteComment = async (commentId: string, token: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
