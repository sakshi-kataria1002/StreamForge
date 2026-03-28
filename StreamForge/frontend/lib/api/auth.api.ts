import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL });

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (name: string, email: string, password: string) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const logout = async (accessToken: string) => {
  const { data } = await api.post(
    '/auth/logout',
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return data;
};

export const refreshToken = async (refreshToken: string) => {
  const { data } = await api.post('/auth/refresh', { refreshToken });
  return data;
};
