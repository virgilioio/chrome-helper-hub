// GoGio API client for Chrome Extension

const API_BASE_URL = 'https://etrxjxstjfcozdjumfsj.supabase.co/functions/v1';

export interface Organization {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;
  organization_id: string;
}

export interface Stage {
  id: string;
  stage_name: string;
  stage_type?: string;
  position?: number;
}

export interface UserInfo {
  email: string;
  name?: string;
}

export interface CandidatePayload {
  organization_id: string;
  job_id: string;
  stage_id: string;
  candidate_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  company_current: string;
  role_current: string;
  location_city: string;
  location_country: string;
  profile_summary: string;
  skills: string[];
  notes: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    const masked = token.length > 12 
      ? `${token.slice(0, 8)}...${token.slice(-4)}` 
      : '[short]';
    console.log('[ApiClient] setToken called, masked:', masked, 'length:', token.length);
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      console.error('[ApiClient] No token set when calling:', endpoint);
      throw new Error('No authentication token set');
    }

    console.log('[ApiClient] Calling', endpoint, 'with token length:', this.token.length);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    console.log('[ApiClient] Response status:', response.status, 'for', endpoint);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('[ApiClient] 401 Unauthorized for', endpoint);
        throw new Error('UNAUTHORIZED');
      }
      const error = await response.text();
      console.error('[ApiClient] Error response:', error);
      throw new Error(error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async getMe(): Promise<UserInfo> {
    return this.request<UserInfo>('/chrome-api-me');
  }

  async getOrganizations(): Promise<Organization[]> {
    const response = await this.request<{ organizations: Organization[] }>('/chrome-api-organizations');
    return response.organizations ?? [];
  }

  async getJobs(organizationId: string): Promise<Job[]> {
    const response = await this.request<{ jobs: Job[] }>(`/chrome-api-jobs?organization_id=${organizationId}`);
    return response.jobs ?? [];
  }

  async getStages(jobId: string): Promise<Stage[]> {
    const response = await this.request<{ stages: Stage[] }>(`/chrome-api-stages?job_id=${jobId}`);
    return response.stages ?? [];
  }

  async submitCandidate(payload: CandidatePayload): Promise<{ success: boolean; candidateId?: string }> {
    return this.request('/chrome-api-candidates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();
