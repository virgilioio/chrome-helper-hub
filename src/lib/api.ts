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
  name: string;
  job_id: string;
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
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      const error = await response.text();
      throw new Error(error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async getMe(): Promise<UserInfo> {
    return this.request<UserInfo>('/chrome-api-me');
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/chrome-api-organizations');
  }

  async getJobs(organizationId: string): Promise<Job[]> {
    return this.request<Job[]>(`/chrome-api-jobs?organization_id=${organizationId}`);
  }

  async getStages(jobId: string): Promise<Stage[]> {
    return this.request<Stage[]>(`/chrome-api-stages?job_id=${jobId}`);
  }

  async submitCandidate(payload: CandidatePayload): Promise<{ success: boolean; candidateId?: string }> {
    return this.request('/chrome-api-candidates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();
