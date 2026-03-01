const API_BASE_URL = 'http://localhost:3001/api';

export const httpClient = {
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) throw new Error(`API_ERROR_${response.status}`);
    return response.json();
  },

  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`API_ERROR_${response.status}`);
    return response.json();
  }
};