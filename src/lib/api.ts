// GoGio API client for Chrome Extension
// Uses unified gateway endpoint with background script proxy in content script context

import { isContentScriptContext } from '@/lib/oauthBridge';

const GATEWAY_URL = 'https://aba41743-9dfe-4b0e-88f2-0c24aeb910c4.functions.supabase.co/chrome-api-gateway';

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

export interface ResumeUploadPayload {
  candidate_id: string;
  filename: string;
  file_data: string; // base64-encoded PDF
}

export interface ExistingJobInfo {
  association_id: string;
  job_id: string;
  job_title: string;
  stage_id: string | null;
  stage_name: string;
  candidate_url: string;
}

export interface CandidateSubmitResponse {
  candidate_id: string;
  association_id: string;
  was_duplicate: boolean;
  action: 'created' | 'attached' | 'updated';
  existing_jobs?: ExistingJobInfo[];
}

export interface ResumeUploadResponse {
  success: boolean;
  attachment_id: string;
  file_url: string;
}

interface ApiProxyResponse {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
}

/**
 * Make an API request via the background script proxy
 * Used in content script context to avoid CORS issues
 */
async function requestViaProxy<T>(
  path: string,
  token: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  const chromeApi = (globalThis as any).chrome;
  
  return new Promise((resolve, reject) => {
    chromeApi.runtime.sendMessage(
      {
        type: 'API_REQUEST',
        path,
        method,
        body,
        token,
      },
      (response: ApiProxyResponse) => {
        if (chromeApi.runtime.lastError) {
          console.error('[ApiClient] Proxy error:', chromeApi.runtime.lastError);
          reject(new Error(chromeApi.runtime.lastError.message || 'Background proxy failed'));
          return;
        }

        if (!response) {
          reject(new Error('No response from background API proxy'));
          return;
        }

        console.log('[ApiClient] Proxy response:', response.status, 'ok:', response.ok);

        if (!response.ok) {
          if (response.status === 401) {
            reject(new Error('UNAUTHORIZED'));
          } else {
            reject(new Error(response.error || `Request failed with status ${response.status}`));
          }
          return;
        }

        resolve(response.data as T);
      }
    );
  });
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

  private async request<T>(action: string, options: RequestInit = {}, queryParams?: Record<string, string>): Promise<T> {
    if (!this.token) {
      console.error('[ApiClient] No token set when calling:', action);
      throw new Error('No authentication token set');
    }

    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    
    // Build query string with action and any additional params
    const params = new URLSearchParams({ action, ...queryParams });
    const endpoint = `chrome-api-gateway?${params.toString()}`;
    
    // Use background proxy in content script context to avoid CORS
    if (isContentScriptContext()) {
      console.log('[ApiClient] Using background proxy for:', action);
      return requestViaProxy<T>(endpoint, this.token, method, body);
    }

    // Direct fetch for popup/extension pages
    console.log('[ApiClient] Direct fetch for:', action);

    const response = await fetch(`${GATEWAY_URL}?${params.toString()}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    console.log('[ApiClient] Response status:', response.status, 'for', action);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('[ApiClient] 401 Unauthorized for', action);
        throw new Error('UNAUTHORIZED');
      }
      const error = await response.text();
      console.error('[ApiClient] Error response:', error);
      throw new Error(error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async getMe(): Promise<UserInfo> {
    return this.request<UserInfo>('me');
  }

  async getOrganizations(): Promise<Organization[]> {
    const response = await this.request<{ organizations: Organization[] }>('organizations');
    return response.organizations ?? [];
  }

  async getJobs(organizationId: string): Promise<Job[]> {
    const response = await this.request<{ jobs: Job[] }>('jobs', {}, { organization_id: organizationId });
    return response.jobs ?? [];
  }

  async getStages(jobId: string): Promise<Stage[]> {
    const response = await this.request<{ stages: Stage[] }>('stages', {}, { job_id: jobId });
    return response.stages ?? [];
  }

  async submitCandidate(payload: CandidatePayload): Promise<CandidateSubmitResponse> {
    return this.request('candidates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async uploadResume(payload: ResumeUploadPayload): Promise<ResumeUploadResponse> {
    return this.request('resume', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();
