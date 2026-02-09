// LinkedIn Profile Data Extraction - Shared Module
// Can be used by both content script and sidebar

export interface LinkedInProfileData {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  profileUrl: string;
}

export interface ContactInfoData {
  email: string | null;
  phone: string | null;
  website: string | null;
  twitter: string | null;
}

function getTextFromSelectors(selectors: string[], label: string): string | null {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      const text = el?.textContent?.trim() || null;
      if (text) {
        console.log(`[GoGio][Extract] ${label} matched: "${selector}" → "${text.substring(0, 60)}"`);
        return text;
      }
    } catch (e) {
      // Invalid selector, skip
    }
  }
  console.log(`[GoGio][Extract] ${label}: no selector matched`);
  return null;
}

/**
 * Parse headline for role and company as fallback
 * Handles patterns like:
 * - "Software Engineer at Google"
 * - "Senior PM @ Microsoft"
 * - "CTO | Startup Inc"
 */
function parseHeadlineForRoleCompany(headline: string | null): { role: string | null; company: string | null } {
  if (!headline) return { role: null, company: null };

  // Pattern: "Role at Company" (case insensitive)
  const atMatch = headline.match(/^(.+?)\s+at\s+(.+?)(?:\s*[|·•–-]|$)/i);
  if (atMatch) {
    return { role: atMatch[1].trim(), company: atMatch[2].trim() };
  }

  // Pattern: "Role @ Company"
  const atSymbolMatch = headline.match(/^(.+?)\s*@\s*(.+?)(?:\s*[|·•–-]|$)/i);
  if (atSymbolMatch) {
    return { role: atSymbolMatch[1].trim(), company: atSymbolMatch[2].trim() };
  }

  // Pattern: "Role | Company" or "Role · Company"
  const separatorMatch = headline.match(/^(.+?)\s*[|·•–-]\s*(.+?)$/);
  if (separatorMatch) {
    return { role: separatorMatch[1].trim(), company: separatorMatch[2].trim() };
  }

  return { role: null, company: null };
}

/**
 * Extract profile data from the current LinkedIn page DOM
 * Works in both content script and sidebar context since both have access to the same DOM
 */
export function extractProfileData(): LinkedInProfileData {
  console.log('[GoGio][Extract] Starting profile extraction...');

  // Name selectors - broadest partial-match first, then structural, then exact legacy
  const fullName = getTextFromSelectors([
    'h1[class*="text-heading"]',
    '.pv-top-card h1',
    '.ph5 h1',
    'h1.text-heading-xlarge',
    'h1.inline.t-24',
    '.pv-top-card--list h1',
    'section.pv-top-card h1',
    'h1',
  ], 'Name');

  // Headline selectors
  const headline = getTextFromSelectors([
    '.pv-top-card .text-body-medium',
    '.ph5 .text-body-medium',
    '.text-body-medium',
    'div.text-body-medium.break-words',
    '.pv-text-details__left-panel .text-body-medium',
    '[data-generated-suggestion-target]',
  ], 'Headline');

  // Location selectors
  const location = getTextFromSelectors([
    '.pv-top-card--list-bullet .text-body-small',
    '.pb2 .text-body-small',
    '.pv-top-card .text-body-small',
    '.ph5 .text-body-small',
    'span.text-body-small.inline.t-black--light.break-words',
    '.pv-text-details__left-panel .text-body-small.inline',
    'span.text-body-small[class*="t-black--light"]',
  ], 'Location');

  // Experience section for current role/company
  let currentCompany: string | null = null;
  let currentRole: string | null = null;

  try {
    // Try multiple ways to find the experience section
    const experienceSection = 
      document.querySelector('#experience') || 
      document.querySelector('[id^="experience"]') ||
      document.querySelector('section[id*="experience"]') ||
      document.querySelector('[data-section="experience"]') ||
      document.querySelector('.pvs-list__outer-container')?.closest('section') ||
      // Find by profilePagedListComponent pattern
      document.querySelector('[id*="profilePagedListComponent"]')?.closest('section') ||
      // Find section that contains "Experience" heading
      Array.from(document.querySelectorAll('section')).find(section => {
        const heading = section.querySelector('h2, [class*="title"], span[aria-hidden="true"]');
        return heading?.textContent?.toLowerCase().includes('experience');
      });

    if (experienceSection) {
      console.log('[GoGio][Extract] Found experience section');
      
      // Get first experience item (most recent)
      const firstExp = 
        experienceSection.querySelector('.pvs-entity--padded') ||
        experienceSection.querySelector('.pvs-entity') ||
        experienceSection.querySelector('li.artdeco-list__item') ||
        experienceSection.querySelector('li[class*="artdeco"]') ||
        experienceSection.querySelector('li');
      
      if (firstExp) {
        console.log('[GoGio][Extract] Found first experience entry');
        
        // Role/title selectors - try multiple patterns
        const roleEl = 
          firstExp.querySelector('.pvs-entity__path-node ~ div span[aria-hidden="true"]') ||
          firstExp.querySelector('div.display-flex.align-items-center.mr1 span[aria-hidden="true"]') ||
          firstExp.querySelector('span.mr1.t-bold span[aria-hidden="true"]') ||
          firstExp.querySelector('.t-bold span[aria-hidden="true"]') ||
          firstExp.querySelector('[data-anonymize="title"]') ||
          firstExp.querySelector('.hoverable-link-text.t-bold span') ||
          firstExp.querySelector('.t-bold > span') ||
          firstExp.querySelector('span.t-bold');
        
        currentRole = roleEl?.textContent?.trim() || null;
        if (currentRole) {
          console.log('[GoGio][Extract] Role:', currentRole);
        }

        // Company name selectors - try multiple patterns
        const companyEl = 
          firstExp.querySelector('.t-14.t-normal span[aria-hidden="true"]') ||
          firstExp.querySelector('span.t-14.t-normal span[aria-hidden="true"]') ||
          firstExp.querySelector('[data-anonymize="company-name"]') ||
          firstExp.querySelector('.t-normal:not(.t-black--light) span[aria-hidden="true"]') ||
          firstExp.querySelector('.hoverable-link-text:not(.t-bold) span');
        
        if (companyEl) {
          // Company text might include " · Full-time", clean it up
          const companyText = companyEl.textContent?.trim() || '';
          currentCompany = companyText.split('·')[0].trim() || null;
          if (currentCompany) {
            console.log('[GoGio][Extract] Company:', currentCompany);
          }
        }
      }
    } else {
      console.log('[GoGio][Extract] Experience section not found');
    }
  } catch (e) {
    console.warn('[GoGio][Extract] Experience extraction error:', e);
  }

  // Fallback: try to get company/role from the intro card
  if (!currentRole || !currentCompany) {
    try {
      const introSection = document.querySelector('.pv-text-details__right-panel');
      if (introSection) {
        const buttons = introSection.querySelectorAll('button');
        buttons.forEach(btn => {
          const text = btn.textContent?.trim() || '';
          if (!currentCompany && text && !text.includes('Contact') && !text.includes('connection')) {
            currentCompany = text;
          }
        });
      }
    } catch (e) {
      // Silently fail
    }
  }

  // Fallback: parse headline for role and company
  if (!currentRole || !currentCompany) {
    const parsed = parseHeadlineForRoleCompany(headline);
    if (!currentRole && parsed.role) {
      currentRole = parsed.role;
      console.log('[GoGio][Extract] Role from headline:', currentRole);
    }
    if (!currentCompany && parsed.company) {
      currentCompany = parsed.company;
      console.log('[GoGio][Extract] Company from headline:', currentCompany);
    }
  }

  const profileUrl = window.location.href;

  const result = { fullName, headline, location, currentCompany, currentRole, profileUrl };
  console.log('[GoGio][Extract] Extraction result:', {
    hasName: !!fullName,
    hasHeadline: !!headline,
    hasLocation: !!location,
    hasCompany: !!currentCompany,
    hasRole: !!currentRole,
  });

  return result;
}

/**
 * Extract profile data with retry logic for LinkedIn SPA rendering
 * Attempts extraction up to 3 times with increasing delays
 */
export async function extractProfileDataWithRetry(): Promise<LinkedInProfileData> {
  const delays = [500, 1500, 3000];

  for (let attempt = 0; attempt < delays.length; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    
    console.log(`[GoGio][Extract] Attempt ${attempt + 1}/${delays.length}...`);
    const data = extractProfileData();
    
    if (data.fullName) {
      console.log(`[GoGio][Extract] Success on attempt ${attempt + 1}`);
      return data;
    }
  }

  console.warn('[GoGio][Extract] All retry attempts exhausted, returning last result');
  return extractProfileData();
}

/**
 * Check if we're on a LinkedIn profile page
 */
export function isLinkedInProfilePage(): boolean {
  return window.location.href.includes('linkedin.com/in/');
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector: string, timeout: number): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const foundEl = document.querySelector(selector);
      if (foundEl) {
        observer.disconnect();
        resolve(foundEl);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Extract contact info from LinkedIn's Contact Info modal
 * Opens the modal, extracts data, then closes it
 */
export async function extractContactInfo(): Promise<ContactInfoData> {
  console.log('[GoGio] Starting contact info extraction...');
  
  // Find the contact info link/button - try multiple selectors
  const contactLink = document.querySelector('#top-card-text-details-contact-info') ||
                      document.querySelector('a[href*="contact-info"]') ||
                      document.querySelector('[data-control-name="contact_see_more"]');
  
  if (!contactLink) {
    console.log('[GoGio] No contact info link found');
    return { email: null, phone: null, website: null, twitter: null };
  }
  
  console.log('[GoGio] Found contact link, clicking...');
  (contactLink as HTMLElement).click();
  
  // Wait for modal to appear - try multiple selectors
  const modalSelectors = [
    '.pv-contact-info',
    '.artdeco-modal[role="dialog"]',
    '[data-test-modal]',
    '.artdeco-modal--layer-default'
  ];
  
  let modal: Element | null = null;
  for (const selector of modalSelectors) {
    modal = await waitForElement(selector, 2000);
    if (modal) {
      console.log('[GoGio] Found modal with selector:', selector);
      break;
    }
  }
  
  if (!modal) {
    console.log('[GoGio] Contact info modal did not appear');
    return { email: null, phone: null, website: null, twitter: null };
  }
  
  // Give the modal content a moment to fully load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('[GoGio] Modal content preview:', modal.textContent?.substring(0, 500));
  
  let email: string | null = null;
  let phone: string | null = null;
  let website: string | null = null;
  let twitter: string | null = null;
  
  // Try to extract from mailto/tel links first
  const emailLink = modal.querySelector('a[href^="mailto:"]');
  if (emailLink) {
    email = emailLink.getAttribute('href')?.replace('mailto:', '')?.trim() || 
            emailLink.textContent?.trim() || null;
    console.log('[GoGio] Found email from link:', email);
  }
  
  const phoneLink = modal.querySelector('a[href^="tel:"]');
  if (phoneLink) {
    phone = phoneLink.getAttribute('href')?.replace('tel:', '')?.trim() ||
            phoneLink.textContent?.trim() || null;
    console.log('[GoGio] Found phone from link:', phone);
  }
  
  // Look for website links (exclude mailto, tel, linkedin, twitter/x)
  const allLinks = modal.querySelectorAll('a[href]');
  allLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes('twitter.com') || href.includes('x.com')) {
      twitter = href;
      console.log('[GoGio] Found twitter:', twitter);
    } else if (!href.startsWith('mailto:') && 
               !href.startsWith('tel:') && 
               !href.includes('linkedin.com') &&
               href.startsWith('http')) {
      website = href;
      console.log('[GoGio] Found website:', website);
    }
  });
  
  // Fallback: regex extraction from modal text content
  if (!email || !phone) {
    const modalText = modal.textContent || '';
    
    if (!email) {
      const emailMatch = modalText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        email = emailMatch[0];
        console.log('[GoGio] Found email via regex:', email);
      }
    }
    
    if (!phone) {
      // Match various phone formats
      const phoneMatch = modalText.match(/(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
      if (phoneMatch) {
        phone = phoneMatch[0].trim();
        console.log('[GoGio] Found phone via regex:', phone);
      }
    }
  }
  
  // Close the modal
  const closeButton = modal.querySelector('button[aria-label="Dismiss"]') ||
                      modal.querySelector('.artdeco-modal__dismiss') ||
                      modal.querySelector('button.artdeco-button--circle');
  
  if (closeButton) {
    console.log('[GoGio] Closing modal...');
    (closeButton as HTMLElement).click();
  } else {
    // Try pressing Escape as fallback
    console.log('[GoGio] No close button found, pressing Escape');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }
  
  console.log('[GoGio] Extracted contact info:', { email, phone, website, twitter });
  return { email, phone, website, twitter };
}
