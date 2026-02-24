import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SidebarSearchableSelect } from './SidebarSearchableSelect';
import { GoGioLogo } from './GoGioLogo';
import { useDropdownData } from '@/hooks/useDropdownData';
import { getLinkedInUrl } from '@/lib/chromeStorage';
import { apiClient, CandidatePayload } from '@/lib/api';
import { extractProfileData, extractProfileDataWithRetry, extractContactInfo, isLinkedInProfilePage } from '@/lib/profileExtractor';
import { isContentScriptContext } from '@/lib/oauthBridge';
import { sendMessageToActiveTab, getActiveTabUrl } from '@/lib/chromeApi';
import { toast } from 'sonner';
import { useLinkedInResumeDetection } from '@/hooks/useLinkedInResumeDetection';
import { 
  Loader2, 
  Settings, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Linkedin, 
  Building2, 
  Briefcase, 
  MapPin, 
  Globe, 
  FileText, 
  Tag,
  Plus,
  Paperclip
} from 'lucide-react';

interface ManualResume {
  filename: string;
  data: string; // base64
  size: number;
}

interface CandidateFormProps {
  userEmail: string;
  onSettingsClick: () => void;
}

// Helper to read downloaded file via background script
const readDownloadedFile = (downloadId: number): Promise<{ data: string; filename: string; size: number }> => {
  return new Promise((resolve, reject) => {
    const chromeApi = (globalThis as any).chrome;
    if (!chromeApi?.runtime?.sendMessage) {
      reject(new Error('Chrome API not available'));
      return;
    }
    
    chromeApi.runtime.sendMessage(
      { type: 'READ_DOWNLOADED_FILE', downloadId },
      (response: { success: boolean; data?: string; filename?: string; size?: number; error?: string }) => {
        if (chromeApi.runtime.lastError) {
          reject(new Error(chromeApi.runtime.lastError.message));
          return;
        }
        if (!response?.success) {
          reject(new Error(response?.error || 'Failed to read file'));
          return;
        }
        resolve({ data: response.data!, filename: response.filename!, size: response.size! });
      }
    );
  });
};

export const CandidateForm: React.FC<CandidateFormProps> = ({ userEmail, onSettingsClick }) => {
  const {
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
    refreshOrganizations,
  } = useDropdownData();

  // Resume detection hook
  const { resume: pendingResume, hasPendingResume, clearPendingResume } = useLinkedInResumeDetection();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingContact, setIsFetchingContact] = useState(false);
  const [manualResume, setManualResume] = useState<ManualResume | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [duplicateResult, setDuplicateResult] = useState<{
    action: 'created' | 'attached' | 'updated';
    candidateName: string;
    existingJobs: Array<{
      jobTitle: string;
      stageName: string;
      candidateUrl: string;
    }>;
  } | null>(null);

  // Handle manual file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      setManualResume({
        filename: file.name,
        data: base64,
        size: file.size,
      });
      toast.success(`Resume "${file.name}" ready to attach`);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsArrayBuffer(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  // Load organizations on mount
  useEffect(() => {
    refreshOrganizations();
  }, [refreshOrganizations]);

  // Prefill LinkedIn URL from current tab
  useEffect(() => {
    const prefillLinkedIn = async () => {
      const url = await getLinkedInUrl();
      if (url) {
        setLinkedinUrl(url);
      }
    };
    prefillLinkedIn();
  }, []);

  // Auto-fill from LinkedIn profile
  useEffect(() => {
    let cancelled = false;

    const fetchLinkedInData = async () => {
      // Check if we're in content script context (sidebar on LinkedIn)
      if (isContentScriptContext()) {
        // We're in the sidebar - directly extract from DOM with retry
        if (isLinkedInProfilePage()) {
          console.log('[GoGio] Sidebar context - extracting profile data with retry');
          const data = await extractProfileDataWithRetry();
          if (!cancelled) {
            applyProfileData(data);
            console.log('[GoGio] Autofill complete:', { hasName: !!data.fullName, hasLocation: !!data.location });
          }
        }
      } else {
        // We're in popup - use message passing
        getActiveTabUrl((url) => {
          if (!url?.includes('linkedin.com/in/')) {
            return;
          }

          sendMessageToActiveTab<{
            fullName: string | null;
            headline: string | null;
            location: string | null;
            currentCompany: string | null;
            currentRole: string | null;
            profileUrl: string;
          }>(
            { type: 'GET_LINKEDIN_PROFILE_DATA' },
            (response) => {
              if (response && !cancelled) {
                applyProfileData(response);
              }
            }
          );
        });
      }
    };

    // Apply profile data to form (only fills empty fields)
    const applyProfileData = (data: {
      fullName: string | null;
      headline: string | null;
      location: string | null;
      currentCompany: string | null;
      currentRole: string | null;
      profileUrl: string;
    }) => {
      if (!data) return;

      const { fullName, headline, location, profileUrl } = data;

      // Only fill empty fields (non-destructive)
      if (fullName && !firstName && !lastName) {
        const parts = fullName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }

      if (data.currentRole && !currentRole) {
        setCurrentRole(data.currentRole);
      }

      if (data.currentCompany && !currentCompany) {
        setCurrentCompany(data.currentCompany);
      }

      if (headline && !summary) {
        setSummary(headline);
      }

      if (location) {
        // Try to split "City, Country" format
        const parts = location.split(',').map((p: string) => p.trim());
        if (parts.length >= 2 && !city && !country) {
          setCity(parts[0]);
          setCountry(parts.slice(1).join(', '));
        } else if (parts.length === 1 && !city) {
          setCity(parts[0]);
        }
      }

      if (profileUrl && !linkedinUrl) {
        setLinkedinUrl(profileUrl);
      }

      console.log('[GoGio] Auto-filled form from LinkedIn profile');
    };

    fetchLinkedInData();
    return () => { cancelled = true; };
  }, []); // Run once on mount

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCurrentCompany('');
    setCurrentRole('');
    setCity('');
    setCountry('');
    setSummary('');
    setSkills('');
    setNotes('');
    setDuplicateResult(null);
    setManualResume(null);
    // Keep linkedinUrl as user might add multiple from same profile
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrgId || !selectedJobId || !selectedStageId) {
      toast.error('Please select organization, job, and stage');
      return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter candidate name');
      return;
    }

    setIsSubmitting(true);

    const payload: CandidatePayload = {
      organization_id: selectedOrgId,
      job_id: selectedJobId,
      stage_id: selectedStageId,
      candidate_name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      phone: phone.trim(),
      linkedin_url: linkedinUrl.trim(),
      company_current: currentCompany.trim(),
      role_current: currentRole.trim(),
      location_city: city.trim(),
      location_country: country.trim(),
      profile_summary: summary.trim(),
      skills: skills.trim() ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      notes: notes.trim(),
    };

    try {
      const result = await apiClient.submitCandidate(payload);
      
      // Check for duplicate and set banner state
      if (result.was_duplicate) {
        setDuplicateResult({
          action: result.action || 'attached',
          candidateName: payload.candidate_name,
          existingJobs: result.existing_jobs?.map(job => ({
            jobTitle: job.job_title,
            stageName: job.stage_name,
            candidateUrl: job.candidate_url,
          })) || [],
        });
      } else {
        setDuplicateResult(null);
      }
      
      // Determine toast message based on action
      const getSuccessMessage = () => {
        if (result.was_duplicate) {
          if (result.action === 'attached') return 'Existing candidate added to pipeline';
          if (result.action === 'updated') return 'Existing candidate info updated';
        }
        return 'Candidate added to GoGio!';
      };
      
      // Upload resume if pending (auto-detected or manual)
      const hasResume = (hasPendingResume && pendingResume) || manualResume;
      if (hasResume && result.candidate_id) {
        try {
          let resumeData: { data: string; filename: string };

          if (manualResume) {
            // Use manually selected file
            resumeData = { data: manualResume.data, filename: manualResume.filename };
          } else {
            // Use auto-detected LinkedIn download
            const fileData = await readDownloadedFile(pendingResume!.downloadId);
            resumeData = { data: fileData.data, filename: pendingResume!.filename };
          }

          await apiClient.uploadResume({
            candidate_id: result.candidate_id,
            filename: resumeData.filename,
            file_data: resumeData.data,
          });
          toast.success(result.was_duplicate ? getSuccessMessage() + ' with resume!' : 'Candidate added with resume!', {
            icon: <CheckCircle2 className="h-4 w-4" style={{ color: '#12B886' }} />,
          });
          if (manualResume) setManualResume(null);
          if (hasPendingResume) clearPendingResume();
        } catch (resumeErr) {
          console.error('[GoGio] Resume upload failed:', resumeErr);
          toast.warning(getSuccessMessage() + ', but resume upload failed', {
            description: resumeErr instanceof Error ? resumeErr.message : 'Unknown error',
          });
          if (manualResume) setManualResume(null);
          if (hasPendingResume) clearPendingResume();
        }
      } else {
        toast.success(getSuccessMessage(), {
          icon: <CheckCircle2 className="h-4 w-4" style={{ color: '#12B886' }} />,
        });
      }
      
      // Reset form but keep duplicate banner visible
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCurrentCompany('');
      setCurrentRole('');
      setCity('');
      setCountry('');
      setSummary('');
      setSkills('');
      setNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedOrgId && selectedJobId && selectedStageId && firstName.trim() && lastName.trim();

  // Candidate preview data
  const hasPreviewData = firstName || lastName || currentRole || currentCompany;

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header showing connection status */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E7E8EE',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#5A6072',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '200px',
        }}>
          {userEmail}
        </span>
        <button
          onClick={onSettingsClick}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#5A6072',
          }}
        >
          <Settings style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Scrollable Form Content */}
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: 16,
        }}
      >
        {/* Duplicate Candidate Banner - shows after submission when candidate already exists */}
        {duplicateResult && (
          <div className="gogio-duplicate-banner">
            <div className="gogio-duplicate-icon">
              {/* Inline SVG for UserCheck icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <polyline points="16 11 18 13 22 9"/>
              </svg>
            </div>
            <div className="gogio-duplicate-info">
              <span className="gogio-duplicate-title">Candidate Already Exists</span>
              <span className="gogio-duplicate-message">
                {duplicateResult.action === 'attached' 
                  ? 'Added to the selected job pipeline'
                  : 'Candidate information was updated'}
              </span>
              {duplicateResult.existingJobs.length > 0 && (
                <span className="gogio-duplicate-job-stage">
                  {duplicateResult.existingJobs[0].jobTitle} | {duplicateResult.existingJobs[0].stageName}
                </span>
              )}
            </div>
            {duplicateResult.existingJobs.length > 0 && (
              <button
                type="button"
                className="gogio-duplicate-open"
                onClick={() => window.open(
                  `https://app.gogio.io${duplicateResult.existingJobs[0].candidateUrl}`,
                  '_blank'
                )}
                title="Open in GoGio"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
            )}
            <button 
              type="button"
              className="gogio-duplicate-dismiss"
              onClick={() => setDuplicateResult(null)}
              title="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Resume Banner - shows when a LinkedIn PDF was downloaded */}
        {hasPendingResume && pendingResume && (
          <div className="gogio-resume-banner">
            <div className="gogio-resume-icon">
              {/* Inline SVG for FileText icon (Lucide icons don't work in content script) */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>
            <div className="gogio-resume-info">
              <span className="gogio-resume-filename">{pendingResume.filename}</span>
              <span className="gogio-resume-hint">Will attach when you add candidate</span>
            </div>
            <button 
              type="button"
              className="gogio-resume-dismiss"
              onClick={clearPendingResume}
              title="Don't attach this resume"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Manual Resume Banner - shows when user manually selected a PDF */}
        {manualResume && !hasPendingResume && (
          <div className="gogio-resume-banner">
            <div className="gogio-resume-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>
            <div className="gogio-resume-info">
              <span className="gogio-resume-filename">{manualResume.filename}</span>
              <span className="gogio-resume-hint">Will attach when you add candidate</span>
            </div>
            <button 
              type="button"
              className="gogio-resume-dismiss"
              onClick={() => setManualResume(null)}
              title="Remove attached resume"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Candidate Preview Card */}
        {hasPreviewData && (
          <div className="gogio-candidate-preview" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="gogio-candidate-avatar">
              <User style={{ width: 20, height: 20, color: '#6F3FF5' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="gogio-candidate-name">
                {firstName} {lastName}
              </div>
              {currentRole && (
                <div className="gogio-candidate-title">{currentRole}</div>
              )}
              {currentCompany && (
                <div className="gogio-candidate-company">@ {currentCompany}</div>
              )}
            </div>
          </div>
        )}

        {/* Card 1: Job Selection */}
        <div className="gogio-card">
          <div className="gogio-card-title">
            <Briefcase style={{ width: 14, height: 14 }} />
            Job Selection
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="gogio-label">Organization</label>
              <SidebarSearchableSelect
                options={organizations.map((org) => ({ id: org.id, label: org.name }))}
                value={selectedOrgId}
                onValueChange={setSelectedOrgId}
                placeholder="Select organization"
                searchPlaceholder="Search organizations..."
                emptyMessage="No organizations found"
                disabled={isLoadingOrgs}
                isLoading={isLoadingOrgs}
              />
            </div>

            <div>
              <label className="gogio-label">Job</label>
              <SidebarSearchableSelect
                options={jobs.map((job) => ({ id: job.id, label: job.title }))}
                value={selectedJobId}
                onValueChange={setSelectedJobId}
                placeholder="Select job"
                searchPlaceholder="Search jobs..."
                emptyMessage="No jobs found"
                disabled={!selectedOrgId || isLoadingJobs}
                isLoading={isLoadingJobs}
              />
            </div>

            <div>
              <label className="gogio-label">Pipeline Stage</label>
              <SidebarSearchableSelect
                options={stages.map((stage) => ({ id: stage.id, label: stage.stage_name }))}
                value={selectedStageId}
                onValueChange={setSelectedStageId}
                placeholder="Select stage"
                searchPlaceholder="Search stages..."
                emptyMessage="No stages found"
                disabled={!selectedJobId || isLoadingStages}
                isLoading={isLoadingStages}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Candidate Information */}
        <div className="gogio-card">
          <div className="gogio-card-title">
            <User style={{ width: 14, height: 14 }} />
            Candidate Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="gogio-label">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="gogio-input"
                  style={{ height: 36 }}
                />
              </div>
              <div>
                <label className="gogio-label">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="gogio-input"
                  style={{ height: 36 }}
                />
              </div>
            </div>

            {/* Email with Fetch Contact button */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="gogio-label" style={{ marginBottom: 0 }}>
                  <Mail style={{ width: 12, height: 12 }} /> Email
                </label>
                {isContentScriptContext() && (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsFetchingContact(true);
                      try {
                        // Step 1: Free DOM scrape
                        const contactData = await extractContactInfo();
                        let foundCount = 0;
                        
                        if (contactData.email && !email) {
                          setEmail(contactData.email);
                          foundCount++;
                        }
                        if (contactData.phone && !phone) {
                          setPhone(contactData.phone);
                          foundCount++;
                        }
                        
                        if (foundCount > 0) {
                          toast.success(`Found ${foundCount} contact field${foundCount > 1 ? 's' : ''}`);
                          return;
                        }
                        
                        if (contactData.email || contactData.phone) {
                          toast.info('Contact info already filled');
                          return;
                        }
                        
                        // Step 2: API enrichment fallback (1 credit)
                        if (!linkedinUrl) {
                          toast.warning('LinkedIn URL required to fetch contact info');
                          return;
                        }
                        
                        const enrichResult = await apiClient.enrichContact(linkedinUrl);
                        
                        if (!enrichResult.success) {
                          toast.warning(enrichResult.message || 'No contact info found for this profile');
                          return;
                        }
                        
                        let enrichedCount = 0;
                        if (enrichResult.email && !email) {
                          setEmail(enrichResult.email);
                          enrichedCount++;
                        }
                        if (enrichResult.phone && !phone) {
                          setPhone(enrichResult.phone);
                          enrichedCount++;
                        }
                        
                        if (enrichedCount > 0) {
                          toast.success(`Found ${enrichedCount} contact field${enrichedCount > 1 ? 's' : ''}`);
                        } else {
                          toast.info('Contact info already filled');
                        }
                      } catch (err: any) {
                        const parsed = (() => { try { return JSON.parse(err.message); } catch { return null; } })();
                        if (parsed?.error_code === 'CREDITS_EXHAUSTED') {
                          toast.warning('Contact lookup limit reached for this month');
                        } else {
                          toast.error('Failed to fetch contact info');
                        }
                      } finally {
                        setIsFetchingContact(false);
                      }
                    }}
                    disabled={isFetchingContact}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      color: '#6F3FF5',
                      background: '#F5F0FF',
                      border: '1px solid #E0D4FF',
                      borderRadius: 6,
                      cursor: isFetchingContact ? 'wait' : 'pointer',
                      opacity: isFetchingContact ? 0.7 : 1,
                    }}
                  >
                    {isFetchingContact ? (
                      <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Plus style={{ width: 12, height: 12 }} />
                    )}
                    Fetch Contact
                  </button>
                )}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="gogio-label">
                <Phone style={{ width: 12, height: 12 }} /> Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="gogio-label">
                <Linkedin style={{ width: 12, height: 12 }} /> LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

            {/* Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="gogio-label">
                  <MapPin style={{ width: 12, height: 12 }} /> City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="gogio-input"
                  style={{ height: 36 }}
                />
              </div>
              <div>
                <label className="gogio-label">
                  <Globe style={{ width: 12, height: 12 }} /> Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="USA"
                  className="gogio-input"
                  style={{ height: 36 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Work Information */}
        <div className="gogio-card">
          <div className="gogio-card-title">
            <Building2 style={{ width: 14, height: 14 }} />
            Work Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Summary/Headline */}
            <div>
              <label className="gogio-label">
                <FileText style={{ width: 12, height: 12 }} /> Headline / Summary
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief professional summary..."
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

            {/* Current Company */}
            <div>
              <label className="gogio-label">Current Company</label>
              <input
                type="text"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="Company Inc."
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

            {/* Current Role */}
            <div>
              <label className="gogio-label">Current Role</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="Software Engineer"
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

            {/* Skills */}
            <div>
              <label className="gogio-label">
                <Tag style={{ width: 12, height: 12 }} /> Skills (comma separated)
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, TypeScript, Node.js..."
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Notes */}
        <div className="gogio-card">
          <div className="gogio-card-title">
            <FileText style={{ width: 14, height: 14 }} />
            Notes
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this candidate..."
            className="gogio-textarea"
          />
        </div>

        {/* Resume Upload Button */}
        {!hasPendingResume && !manualResume && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: '#6F3FF5',
                background: '#F5F0FF',
                border: '1px dashed #D0C0FF',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Attach Resume (PDF)
            </button>
          </>
        )}
        {/* Submit Button */}
        <button
          type="submit"
          className="gogio-btn-primary"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
              Adding...
            </>
          ) : (
            <>
              <Plus style={{ width: 16, height: 16 }} />
              Add to GoGio
            </>
          )}
        </button>
      </form>
    </div>
  );
};
