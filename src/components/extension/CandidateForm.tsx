import React, { useState, useEffect } from 'react';
import { SidebarSearchableSelect } from './SidebarSearchableSelect';
import { GoGioLogo } from './GoGioLogo';
import { useDropdownData } from '@/hooks/useDropdownData';
import { getLinkedInUrl } from '@/lib/chromeStorage';
import { apiClient, CandidatePayload } from '@/lib/api';
import { extractProfileData, isLinkedInProfilePage } from '@/lib/profileExtractor';
import { isContentScriptContext } from '@/lib/oauthBridge';
import { sendMessageToActiveTab, getActiveTabUrl } from '@/lib/chromeApi';
import { toast } from 'sonner';
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
  Plus
} from 'lucide-react';

interface CandidateFormProps {
  userEmail: string;
  onSettingsClick: () => void;
}

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
    const fetchLinkedInData = () => {
      // Check if we're in content script context (sidebar on LinkedIn)
      if (isContentScriptContext()) {
        // We're in the sidebar - directly extract from DOM
        if (isLinkedInProfilePage()) {
          console.log('[GoGio] Sidebar context - extracting profile data directly');
          const data = extractProfileData();
          applyProfileData(data);
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
              if (response) {
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

    // Small delay to ensure DOM is ready
    const timer = setTimeout(fetchLinkedInData, 300);
    return () => clearTimeout(timer);
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
      await apiClient.submitCandidate(payload);
      toast.success('Candidate added to GoGio!', {
        icon: <CheckCircle2 className="h-4 w-4" style={{ color: '#12B886' }} />,
      });
      resetForm();
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

        {/* Selection Dropdowns Card */}
        <div className="gogio-card" style={{ padding: 12, marginBottom: 16 }}>
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

        {/* Candidate Information Card */}
        <div className="gogio-card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="gogio-label">
                  <User style={{ width: 12, height: 12 }} /> First Name *
                </label>
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

            {/* Contact */}
            <div>
              <label className="gogio-label">
                <Mail style={{ width: 12, height: 12 }} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

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

            {/* Current Position */}
            <div>
              <label className="gogio-label">
                <Building2 style={{ width: 12, height: 12 }} /> Current Company
              </label>
              <input
                type="text"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="Company Inc."
                className="gogio-input"
                style={{ height: 36 }}
              />
            </div>

            <div>
              <label className="gogio-label">
                <Briefcase style={{ width: 12, height: 12 }} /> Current Role
              </label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="Software Engineer"
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

            {/* Summary */}
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

            {/* Notes */}
            <div>
              <label className="gogio-label">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this candidate..."
                className="gogio-textarea"
              />
            </div>
          </div>
        </div>

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
