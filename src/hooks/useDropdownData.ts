import { useState, useEffect, useCallback } from 'react';
import { apiClient, Organization, Job, Stage } from '@/lib/api';
import { getStoredPreferences, setStoredPreferences } from '@/lib/chromeStorage';

export interface UseDropdownDataReturn {
  organizations: Organization[];
  jobs: Job[];
  stages: Stage[];
  selectedOrgId: string;
  selectedJobId: string;
  selectedStageId: string;
  setSelectedOrgId: (id: string) => void;
  setSelectedJobId: (id: string) => void;
  setSelectedStageId: (id: string) => void;
  isLoadingOrgs: boolean;
  isLoadingJobs: boolean;
  isLoadingStages: boolean;
  error: string | null;
  refreshOrganizations: () => Promise<void>;
}

export function useDropdownData(): UseDropdownDataReturn {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  const [selectedOrgId, setSelectedOrgIdState] = useState<string>('');
  const [selectedJobId, setSelectedJobIdState] = useState<string>('');
  const [selectedStageId, setSelectedStageIdState] = useState<string>('');
  
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Load organizations
  const refreshOrganizations = useCallback(async () => {
    setIsLoadingOrgs(true);
    setError(null);
    try {
      const orgs = await apiClient.getOrganizations();
      const orgsList = Array.isArray(orgs) ? orgs : [];
      setOrganizations(orgsList);
      
      // Restore last used organization
      const prefs = await getStoredPreferences();
      if (prefs.lastOrganizationId && orgsList.some(o => o.id === prefs.lastOrganizationId)) {
        setSelectedOrgIdState(prefs.lastOrganizationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setIsLoadingOrgs(false);
    }
  }, []);

  // Load jobs when organization changes
  useEffect(() => {
    if (!selectedOrgId) {
      setJobs([]);
      setSelectedJobIdState('');
      return;
    }

    const loadJobs = async () => {
      setIsLoadingJobs(true);
      setError(null);
      try {
        const jobsResult = await apiClient.getJobs(selectedOrgId);
        const jobsList = Array.isArray(jobsResult) ? jobsResult : [];
        setJobs(jobsList);
        
        // Restore last used job if it belongs to this org
        const prefs = await getStoredPreferences();
        if (prefs.lastJobId && jobsList.some(j => j.id === prefs.lastJobId)) {
          setSelectedJobIdState(prefs.lastJobId);
        } else {
          setSelectedJobIdState('');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobs();
  }, [selectedOrgId]);

  // Load stages when job changes
  useEffect(() => {
    if (!selectedJobId) {
      setStages([]);
      setSelectedStageIdState('');
      return;
    }

    const loadStages = async () => {
      setIsLoadingStages(true);
      setError(null);
      try {
        const stagesResult = await apiClient.getStages(selectedJobId);
        const stagesList = Array.isArray(stagesResult) ? stagesResult : [];
        setStages(stagesList);
        
        // Restore last used stage if it belongs to this job
        const prefs = await getStoredPreferences();
        if (prefs.lastStageId && stagesList.some(s => s.id === prefs.lastStageId)) {
          setSelectedStageIdState(prefs.lastStageId);
        } else {
          setSelectedStageIdState('');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stages');
      } finally {
        setIsLoadingStages(false);
      }
    };

    loadStages();
  }, [selectedJobId]);

  // Persist selections
  const setSelectedOrgId = useCallback((id: string) => {
    setSelectedOrgIdState(id);
    setStoredPreferences({ lastOrganizationId: id });
    // Reset dependent selections
    setSelectedJobIdState('');
    setSelectedStageIdState('');
  }, []);

  const setSelectedJobId = useCallback((id: string) => {
    setSelectedJobIdState(id);
    setStoredPreferences({ lastJobId: id });
    // Reset dependent selection
    setSelectedStageIdState('');
  }, []);

  const setSelectedStageId = useCallback((id: string) => {
    setSelectedStageIdState(id);
    setStoredPreferences({ lastStageId: id });
  }, []);

  return {
    organizations,
    jobs,
    stages,
    selectedOrgId,
    selectedJobId,
    selectedStageId,
    setSelectedOrgId,
    setSelectedJobId,
    setSelectedStageId,
    isLoadingOrgs,
    isLoadingJobs,
    isLoadingStages,
    error,
    refreshOrganizations,
  };
}
