import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoGioLogo } from './GoGioLogo';
import { useDropdownData } from '@/hooks/useDropdownData';
import { getLinkedInUrl } from '@/lib/chromeStorage';
import { sendMessageToActiveTab, getActiveTabUrl } from '@/lib/chromeApi';
import { apiClient, CandidatePayload } from '@/lib/api';
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
  Tag 
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

  // Auto-fill from LinkedIn profile content script
  useEffect(() => {
    const fetchLinkedInData = () => {
      // First check if we're on a LinkedIn profile page
      getActiveTabUrl((url) => {
        if (!url?.includes('linkedin.com/in/')) {
          return;
        }

        // Request profile data from content script
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
            if (!response) {
              return;
            }

            const { fullName, headline, location, profileUrl } = response;

            // Only fill empty fields (non-destructive)
            if (fullName && !firstName && !lastName) {
              const parts = fullName.split(' ');
              setFirstName(parts[0] || '');
              setLastName(parts.slice(1).join(' ') || '');
            }

            if (response.currentRole && !currentRole) {
              setCurrentRole(response.currentRole);
            }

            if (response.currentCompany && !currentCompany) {
              setCurrentCompany(response.currentCompany);
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
          }
        );
      });
    };

    // Small delay to ensure content script is loaded
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
        icon: <CheckCircle2 className="h-4 w-4 text-success" />,
      });
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedOrgId && selectedJobId && selectedStageId && firstName.trim() && lastName.trim();

  return (
    <div className="w-[360px] max-h-[600px] overflow-y-auto bg-background animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <GoGioLogo size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {userEmail}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Selection Dropdowns */}
        <Card className="shadow-card rounded-card">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId} disabled={isLoadingOrgs}>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder={isLoadingOrgs ? "Loading..." : "Select organization"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Job</Label>
              <Select 
                value={selectedJobId} 
                onValueChange={setSelectedJobId} 
                disabled={!selectedOrgId || isLoadingJobs}
              >
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder={isLoadingJobs ? "Loading..." : "Select job"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Stage</Label>
              <Select 
                value={selectedStageId} 
                onValueChange={setSelectedStageId} 
                disabled={!selectedJobId || isLoadingStages}
              >
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder={isLoadingStages ? "Loading..." : "Select stage"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.stage_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Information */}
        <Card className="shadow-card rounded-card">
          <CardContent className="p-4 space-y-3">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> First Name *
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Last Name *</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="h-9 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="h-9 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Linkedin className="h-3 w-3" /> LinkedIn URL
              </Label>
              <Input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="h-9 rounded-lg text-sm"
              />
            </div>

            {/* Current Position */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Current Company
              </Label>
              <Input
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="Company Inc."
                className="h-9 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Current Role
              </Label>
              <Input
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="Software Engineer"
                className="h-9 rounded-lg text-sm"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> City
                </Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Country
                </Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="USA"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> Headline / Summary
              </Label>
              <Input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief professional summary..."
                className="h-9 rounded-lg text-sm"
              />
            </div>

            {/* Skills */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Skills (comma separated)
              </Label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, TypeScript, Node.js..."
                className="h-9 rounded-lg text-sm"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the candidate..."
                className="min-h-[60px] rounded-lg text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-button font-bold text-lg"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add to GoGio'
          )}
        </Button>
      </form>
    </div>
  );
};
