// LinkedIn Profile Content Script
// Runs on linkedin.com/in/* pages and extracts profile data

interface LinkedInProfileData {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  profileUrl: string;
}

function getText(selector: string): string | null {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() || null;
}

function extractProfileData(): LinkedInProfileData {
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
    // Try to find the experience section
    const experienceSection = 
      document.querySelector('#experience') || 
      document.querySelector('[id^="experience"]') ||
      document.querySelector('section[id*="experience"]');

    if (experienceSection) {
      // Get first experience item (most recent)
      const firstExp = experienceSection.querySelector('li.artdeco-list__item') ||
                       experienceSection.querySelector('li');
      
      if (firstExp) {
        // Role title is usually in a span with specific styling
        const roleEl = firstExp.querySelector('div.display-flex.align-items-center.mr1 span[aria-hidden="true"]') ||
                       firstExp.querySelector('span.mr1.t-bold span[aria-hidden="true"]') ||
                       firstExp.querySelector('.t-bold span[aria-hidden="true"]');
        currentRole = roleEl?.textContent?.trim() || null;

        // Company name
        const companyEl = firstExp.querySelector('span.t-14.t-normal span[aria-hidden="true"]') ||
                          firstExp.querySelector('.t-14.t-normal span[aria-hidden="true"]');
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
      // The intro card sometimes shows current position
      const introSection = document.querySelector('.pv-text-details__right-panel');
      if (introSection) {
        const buttons = introSection.querySelectorAll('button');
        buttons.forEach(btn => {
          const text = btn.textContent?.trim() || '';
          // Usually formatted as "Company Name"
          if (!currentCompany && text && !text.includes('Contact') && !text.includes('connection')) {
            currentCompany = text;
          }
        });
      }
    } catch (e) {
      // Silently fail
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

// Get the Chrome runtime API
const getChromeRuntime = () => (globalThis as any).chrome?.runtime;

// Listen for messages from the popup
getChromeRuntime()?.onMessage?.addListener((msg: any, _sender: any, sendResponse: (response: any) => void) => {
  if (msg?.type === 'GET_LINKEDIN_PROFILE_DATA') {
    try {
      const data = extractProfileData();
      console.log('[GoGio] Profile data extracted:', {
        hasName: !!data.fullName,
        hasHeadline: !!data.headline,
        hasLocation: !!data.location,
        hasCompany: !!data.currentCompany,
        hasRole: !!data.currentRole,
      });
      sendResponse(data);
    } catch (e) {
      console.warn('[GoGio] Failed to extract LinkedIn profile data', e);
      sendResponse(null);
    }
  }
  return true; // Keep channel open for async response
});

console.log('[GoGio] LinkedIn content script loaded');
