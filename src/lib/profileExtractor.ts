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

function getText(selector: string): string | null {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() || null;
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
  // Try multiple selectors for name (LinkedIn changes DOM frequently)
  const fullName =
    getText('h1.text-heading-xlarge') ||
    getText('h1.inline.t-24') ||
    getText('h1') ||
    null;

  // Headline - usually below name
  const headline =
    getText('div.text-body-medium.break-words') ||
    getText('.pv-text-details__left-panel .text-body-medium') ||
    getText('[data-generated-suggestion-target]') ||
    null;

  // Location
  const location =
    getText('span.text-body-small.inline.t-black--light.break-words') ||
    getText('.pv-text-details__left-panel .text-body-small.inline') ||
    null;

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
      // Find section that contains "Experience" heading
      Array.from(document.querySelectorAll('section')).find(section => {
        const heading = section.querySelector('h2, [class*="title"]');
        return heading?.textContent?.toLowerCase().includes('experience');
      });

    if (experienceSection) {
      // Get first experience item (most recent)
      const firstExp = 
        experienceSection.querySelector('li.artdeco-list__item') ||
        experienceSection.querySelector('li[class*="artdeco"]') ||
        experienceSection.querySelector('.pvs-entity') ||
        experienceSection.querySelector('li');
      
      if (firstExp) {
        // Role/title selectors - try multiple patterns
        const roleEl = 
          firstExp.querySelector('div.display-flex.align-items-center.mr1 span[aria-hidden="true"]') ||
          firstExp.querySelector('span.mr1.t-bold span[aria-hidden="true"]') ||
          firstExp.querySelector('.t-bold span[aria-hidden="true"]') ||
          firstExp.querySelector('[data-anonymize="title"]') ||
          firstExp.querySelector('.hoverable-link-text.t-bold span') ||
          firstExp.querySelector('.t-bold > span') ||
          firstExp.querySelector('span.t-bold');
        
        currentRole = roleEl?.textContent?.trim() || null;

        // Company name selectors - try multiple patterns
        const companyEl = 
          firstExp.querySelector('span.t-14.t-normal span[aria-hidden="true"]') ||
          firstExp.querySelector('.t-14.t-normal span[aria-hidden="true"]') ||
          firstExp.querySelector('[data-anonymize="company-name"]') ||
          firstExp.querySelector('.t-normal:not(.t-black--light) span[aria-hidden="true"]') ||
          firstExp.querySelector('.hoverable-link-text:not(.t-bold) span');
        
        if (companyEl) {
          // Company text might include " · Full-time", clean it up
          const companyText = companyEl.textContent?.trim() || '';
          currentCompany = companyText.split('·')[0].trim() || null;
        }
      }
    }
  } catch (e) {
    // Silently fail - DOM extraction is best-effort
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
    }
    if (!currentCompany && parsed.company) {
      currentCompany = parsed.company;
    }
  }

  const profileUrl = window.location.href;

  return {
    fullName,
    headline,
    location,
    currentCompany,
    currentRole,
    profileUrl,
  };
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
  const emptyResult: ContactInfoData = { email: null, phone: null, website: null, twitter: null };

  try {
    // Find the contact info link/button
    const contactLink = 
      document.querySelector('a[href*="contact-info"]') ||
      document.querySelector('#top-card-text-details-contact-info') ||
      document.querySelector('[data-control-name="contact_see_more"]');

    if (!contactLink) {
      console.log('[GoGio] Contact info link not found');
      return emptyResult;
    }

    // Click to open modal
    (contactLink as HTMLElement).click();

    // Wait for modal to appear
    const modal = await waitForElement('.pv-contact-info, .artdeco-modal__content', 3000);

    if (!modal) {
      console.log('[GoGio] Contact info modal did not open');
      return emptyResult;
    }

    // Small delay to ensure content is loaded
    await new Promise(resolve => setTimeout(resolve, 300));

    // Extract email
    const emailLink = modal.querySelector('a[href^="mailto:"]');
    const email = emailLink?.textContent?.trim() || 
                  emailLink?.getAttribute('href')?.replace('mailto:', '') || null;

    // Extract phone
    const phoneSection = modal.querySelector('section.ci-phone, [class*="ci-phone"]');
    const phoneLink = phoneSection?.querySelector('a[href^="tel:"]') || modal.querySelector('a[href^="tel:"]');
    const phone = phoneLink?.textContent?.trim() || 
                  phoneLink?.getAttribute('href')?.replace('tel:', '') || null;

    // Extract website (exclude linkedin, twitter, mailto, tel links)
    const websiteLinks = modal.querySelectorAll('a[href]');
    let website: string | null = null;
    websiteLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!website && 
          !href.includes('linkedin.com') && 
          !href.includes('twitter.com') && 
          !href.includes('x.com') &&
          !href.startsWith('mailto:') && 
          !href.startsWith('tel:') &&
          (href.startsWith('http://') || href.startsWith('https://'))) {
        website = href;
      }
    });

    // Extract Twitter/X
    const twitterLink = modal.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
    const twitter = twitterLink?.getAttribute('href') || null;

    // Close the modal
    const closeButton = 
      modal.closest('.artdeco-modal')?.querySelector('button[aria-label="Dismiss"], button.artdeco-modal__dismiss') ||
      document.querySelector('.artdeco-modal button[aria-label="Dismiss"]') ||
      document.querySelector('.artdeco-modal__dismiss');
    
    if (closeButton) {
      (closeButton as HTMLElement).click();
    }

    console.log('[GoGio] Extracted contact info:', { email, phone, website, twitter });
    return { email, phone, website, twitter };

  } catch (error) {
    console.error('[GoGio] Error extracting contact info:', error);
    return emptyResult;
  }
}
