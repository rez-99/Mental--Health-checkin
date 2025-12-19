// API client for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiError {
  error: string;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Create headers with auth token
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// API request wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Student API
export const studentApi = {
  // Create a check-in
  createCheckIn: async (studentId: string, data: {
    mood: number;
    sleepQuality: number;
    concentration: number;
    energy: number;
    worries: number;
    burden: number;
    notes?: string;
    cognitiveScore?: number;
    screenUseImpact?: string;
  }) => {
    return apiRequest(`/api/students/${studentId}/check-ins`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get check-in history
  getCheckIns: async (studentId: string) => {
    return apiRequest(`/api/students/${studentId}/check-ins`);
  },
};

// Counsellor API
export const counsellorApi = {
  // Get dashboard overview
  getDashboard: async () => {
    return apiRequest('/api/dashboard/overview');
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest('/health');
};

// For development: set a mock token (remove in production)
export function setMockToken(token: string) {
  localStorage.setItem('auth_token', token);
}

// For development: create a mock JWT (you'd use a real auth provider in production)
export function createMockToken(userId: string, role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN', schoolId: string): string {
  // In production, this would come from Auth0/Clerk/etc.
  // For now, we'll create a simple payload that the backend can decode
  const payload = {
    sub: userId,
    role,
    schoolId,
    iat: Math.floor(Date.now() / 1000),
  };
  
  // Base64 encode (backend will decode this - in production, use proper JWT signing)
  return btoa(JSON.stringify(payload));
}

