const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// --- Competitors ---
export interface Competitor {
  _id: string;
  name: string;
  source_url: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export const competitorApi = {
  getAll: () => request<Competitor[]>('/competitors'),
  getById: (id: string) => request<Competitor>(`/competitors/${id}`),
  create: (data: Partial<Competitor>) =>
    request<Competitor>('/competitors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Competitor>) =>
    request<Competitor>(`/competitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/competitors/${id}`, { method: 'DELETE' }),
};

// --- Trainings ---
export interface Training {
  _id: string;
  competitor_id: {
    _id: string;
    name: string;
    category: string;
  };
  title: string;
  price: number;
  date: string;
  audience: string;
  delivery_mode: 'Online' | 'In-Person' | 'Hybrid';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const trainingApi = {
  getAll: () => request<Training[]>('/trainings'),
  getById: (id: string) => request<Training>(`/trainings/${id}`),
  create: (data: Record<string, unknown>) =>
    request<Training>('/trainings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<Training>(`/trainings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/trainings/${id}`, { method: 'DELETE' }),
};

// --- Analytics ---
export interface AnalyticsData {
  totalTrainings: number;
  totalCompetitors: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  topTopics: { topic: string; count: number }[];
  trainingsPerMonth: { month: string; count: number }[];
  deliveryDistribution: { mode: string; count: number }[];
  competitorRanking: { name: string; count: number }[];
  audienceDistribution: { audience: string; count: number }[];
}

export const analyticsApi = {
  get: () => request<AnalyticsData>('/analytics'),
};

// --- Scraper ---
export interface DiscoveredRecord {
  title: string;
  provider: string;
  url: string;
  description: string;
  status: string;
  source: string;
  type: string | null;
  online_price: string | null;
  f2f_price: string | null;
  inclusion: string | null;
  weakness: string | null;
  trainings_offered: string;
  date: string | null;
  likes: number | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
}

export const scraperApi = {
  discover: (keyword: string) => 
    request<{ success: boolean; count: number; data: DiscoveredRecord[] }>('/scraper/discover', { 
      method: 'POST', 
      body: JSON.stringify({ keyword }) 
    }),
  bulkApprove: (records: DiscoveredRecord[]) =>
    request<{ success: boolean; inserted: number; message?: string }>('/scraper/bulk', {
      method: 'POST',
      body: JSON.stringify({ records, source: 'facebook_dork' })
    }),
};
