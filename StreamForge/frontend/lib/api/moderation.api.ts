import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL, withCredentials: true });

export type ReportReason = 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'copyright' | 'other';
export type ReportTargetType = 'video' | 'comment' | 'user';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface Report {
  _id: string;
  reportedBy: { _id: string; name: string; email: string };
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  reviewedBy: { _id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  totalPages: number;
}

export const submitReport = async (
  payload: { targetType: ReportTargetType; targetId: string; reason: ReportReason; description?: string },
  token: string
): Promise<Report> => {
  const { data } = await api.post('/moderation/reports', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const getReports = async (
  params: { status?: ReportStatus; targetType?: ReportTargetType; page?: number; limit?: number },
  token: string
): Promise<ReportsResponse> => {
  const { data } = await api.get('/moderation/reports', {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
  token: string
): Promise<Report> => {
  const { data } = await api.patch(
    `/moderation/reports/${reportId}`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.data;
};
