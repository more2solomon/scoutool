// Shared API client for both web and mobile
class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse(response);
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async postFormData(endpoint, formData) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse(response);
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }

  // Bridge API
  async getQueue() {
    return this.get('/api/bridge/queue');
  }

  async getState() {
    return this.get('/api/bridge/state');
  }

  async updateState(patch) {
    return this.post('/api/bridge/state', patch);
  }

  // Gmail API
  async getGmailStatus() {
    return this.get('/api/auth/google/status');
  }

  async createGmailDrafts(records) {
    return this.post('/api/gmail/drafts', { records });
  }

  // Scraper API
  async scrapeUrls(file) {
    // Check if we're in a browser environment (web)
    if (typeof FormData !== 'undefined') {
      const formData = new FormData();
      formData.append('file', file);
      return this.postFormData('/api/scraper', formData);
    }
    // For React Native, we'd need a different approach with expo-file-system
    throw new Error('File upload not yet implemented for mobile');
  }
}

// Web client (relative URLs)
export const webApiClient = new ApiClient('');

// Mobile client (configured with base URL from env)
const mobileBaseUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : 'http://localhost:3000';
export const mobileApiClient = new ApiClient(mobileBaseUrl);

export default ApiClient;
