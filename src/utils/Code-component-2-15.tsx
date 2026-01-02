import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6d448e25`;

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Error [${response.status}]:`, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Profile methods
  async getProfile(userId: string) {
    return this.request(`/profile/${userId}`);
  }

  async updateProfile(userId: string, updates: any) {
    return this.request(`/profile/${userId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  // Journal methods
  async saveJournalEntry(userId: string, text: string, mood: string) {
    return this.request(`/journal/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ text, mood }),
    });
  }

  async getJournalEntries(userId: string, limit = 10) {
    return this.request(`/journal/${userId}?limit=${limit}`);
  }

  // Analytics methods
  async getAnalytics(userId: string, days = 7) {
    return this.request(`/analytics/${userId}?days=${days}`);
  }

  // Quest methods
  async getQuests(userId: string) {
    return this.request(`/quests/${userId}`);
  }

  async completeQuest(userId: string, questId: string, reward: number) {
    return this.request(`/quests/${userId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ questId, reward }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiClient();