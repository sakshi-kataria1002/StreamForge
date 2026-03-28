import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_URL, withCredentials: true });

export interface MembershipStatus {
  isMember: boolean;
  membership: {
    _id: string;
    tier: 'free' | 'basic' | 'premium';
    price: number;
    startDate: string;
    stripeSubscriptionId: string;
  } | null;
}

export const getMembershipStatus = async (creatorId: string, token: string): Promise<MembershipStatus> => {
  const { data } = await api.get(`/memberships/status/${creatorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const createCheckoutSession = async (
  payload: { creatorId: string; tier: string; price: number },
  token: string
): Promise<{ url: string }> => {
  const { data } = await api.post('/memberships/checkout', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

export const cancelMembership = async (membershipId: string, token: string): Promise<void> => {
  await api.delete(`/memberships/${membershipId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
