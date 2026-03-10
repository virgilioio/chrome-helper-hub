// LinkedIn Profile Data Extraction - Multi-Strategy Reactive Architecture
// Resilient to DOM class changes by using structural, meta, and content-based strategies

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

interface StrategyResult {
  value: string | null;
  source: string;
  confidence: number;
}

// ============================================================================
// Utility Helpers
// ============================================================================

function cleanText(el: Element | null): string | null {
  if (!el) return null;
  const text = (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || null;
  return text && text.length > 0 ? text : null;
}

/** Strip LinkedIn artifacts from extracted name text */
function cleanName(text: string | null): string | null {
  if (!text) return null;
  let cleaned = text;
  // Remove pronoun patterns like (He/Him), (She/Her), (They/Them), etc.
  cleaned = cleaned.replace(/\s*\([^)]*\/[^)]*\)\s*/g, ' ');
  // Remove connection degree indicators
  cleaned = cleaned.replace(/\b(1st|2nd|3rd)\b(\s*(degree\s*)?connection)?/gi, '');
  // Remove verification badges (Unicode checkmarks and text)
  cleaned = cleaned.replace(/[\u2713\u2714\u2705\u2611\u2B50\uD83D\uDD35\uD83D\uDFE2]/gu, '');
  cleaned = cleaned.replace(/\bVerified\b/gi, '');
  // Remove "· " prefix sometimes prepended
  cleaned = cleaned.replace(/^[·•–-]\s*/, '');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

function looksLikeLocation(text: string): boolean {
  if (!text || text.length < 2) return false;
  const lower = text.toLowerCase();
  if (/connection|follower|mutual|message|\bconnect\b/i.test(lower)) return false;
  if (/^\d[\d,+.\s]*$/.test(text.trim())) return false;
  if (text.length < 3 && !text.includes(',')) return false;
  return true;
}

function looksLikeName(text: string): boolean {
  if (!text || text.length < 2 || text.length > 80) return false;
  const words = text.split(/\s+/);
  if (words.length < 1 || words.length > 6) return false;
  // Reject if it contains special chars typical of non-names
  if (/[<>{}[\]|\\=+*#@$%^&]/.test(text)) return false;
  // Reject if it looks like a button label or nav item
  if (/^(home|messaging|notifications|jobs|my network|sign in|join now)$/i.test(text)) return false;
  return true;
}

/** Pick best result from multiple strategies */
function pickBest(results: StrategyResult[]): string | null {
  const valid = results.filter(r => r.value != null && r.value.length > 0);
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.confidence - a.confidence);
  console.log(`[GoGio][Extract] Winner: "${valid[0].value?.substring(0, 60)}" via ${valid[0].source} (${valid[0].confidence})`);
  return valid[0].value;
}

// Experience section heading terms (multi-locale)
const EXPERIENCE_HEADINGS = [
  'experience', 'experiencia', 'expérience', 'erfahrung', 'esperienza',
  'experiência', 'ervaring', 'deneyim', 'опыт', 'doświadczenie',
];

function findExperienceSection(): Element | null {
  // Strategy 1: id-based
  const byId = document.querySelector('#experience') ||
    document.querySelector('[id^="experience"]') ||
    document.querySelector('section[id*="experience"]');
  if (byId) return byId.closest('section') || byId;

  // Strategy 2: heading text scan
  const sections = document.querySelectorAll('main section, section');
  for (const section of sections) {
    const headings = section.querySelectorAll('h2, [class*="title"], span[aria-hidden="true"]');
    for (const h of headings) {
      const text = (h.textContent || '').toLowerCase().trim();
      if (EXPERIENCE_HEADINGS.some(term => text === term || text.startsWith(term))) {
        return section;
      }
    }
  }
  return null;
}

function getFirstExperienceItem(section: Element): Element | null {
  return section.querySelector('li') || null;
}

// ============================================================================
// Multi-Strategy Field Extractors
// ============================================================================

function extractFullName(): StrategyResult[] {
  const results: StrategyResult[] = [];

  // Strategy 1: main > first section h1 (most stable structural anchor)
  try {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      const sections = mainEl.querySelectorAll('section');
      for (const section of sections) {
        const h1 = section.querySelector('h1');
        const text = cleanName(cleanText(h1));
        if (text && looksLikeName(text)) {
          results.push({ value: text, source: 'main-section-h1', confidence: 0.95 });
          break;
        }
      }
      // Also try direct h1 child of main
      if (!results.length) {
        const h1 = mainEl.querySelector('h1');
        const text = cleanName(cleanText(h1));
        if (text && looksLikeName(text)) {
          results.push({ value: text, source: 'main-h1', confidence: 0.9 });
        }
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 2: document.title parsing — "FirstName LastName - Headline | LinkedIn"
  try {
    const title = document.title;
    if (title && title.includes('LinkedIn')) {
      // Split on common separators
      let namePart = title.split(' - ')[0]?.trim() ||
        title.split(' | ')[0]?.trim() ||
        title.split('–')[0]?.trim();
      // Remove leading/trailing parens like "(1) John Doe"
      namePart = namePart?.replace(/^\(\d+\)\s*/, '').trim();
      if (namePart && looksLikeName(namePart) && namePart !== 'LinkedIn') {
        results.push({ value: namePart, source: 'document-title', confidence: 0.8 });
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 3: og:title meta tag
  try {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) {
      const namePart = ogTitle.split(' - ')[0]?.trim();
      if (namePart && looksLikeName(namePart)) {
        results.push({ value: namePart, source: 'og-title', confidence: 0.75 });
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 4: any h1 on page that looks name-like
  try {
    const allH1s = document.querySelectorAll('h1');
    for (const h1 of allH1s) {
      const text = cleanName(cleanText(h1));
      if (text && looksLikeName(text)) {
        results.push({ value: text, source: 'any-h1', confidence: 0.6 });
        break;
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 5: profile slug fallback — /in/john-doe-123/ → "John Doe"
  try {
    const match = window.location.pathname.match(/\/in\/([^/]+)/);
    if (match) {
      const slug = match[1]
        .replace(/-\w{4,}$/, '') // remove trailing hash
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      if (slug && slug.length > 2) {
        results.push({ value: slug, source: 'url-slug', confidence: 0.4 });
      }
    }
  } catch (e) { /* skip */ }

  return results;
}

function extractHeadline(): StrategyResult[] {
  const results: StrategyResult[] = [];

  // Blocklist for headline candidates
  const headlineBlocklist = /\bconnection|follower|mutual|message\b/i;

  // Strategy 1: sibling of h1 in main — walk from name h1 to next text element
  try {
    const mainEl = document.querySelector('main');
    const h1 = mainEl?.querySelector('h1');
    if (h1) {
      // Walk siblings and parent's siblings
      let candidate = h1.nextElementSibling;
      for (let i = 0; i < 5 && candidate; i++) {
        // Prefer direct child text node or first div's text to avoid grabbing entire containers
        const directDiv = candidate.querySelector('div');
        const rawText = directDiv ? cleanText(directDiv) : cleanText(candidate);
        if (rawText && rawText.length > 10 && rawText.length < 150 && !headlineBlocklist.test(rawText) && !looksLikeLocation(rawText)) {
          results.push({ value: rawText, source: 'h1-sibling', confidence: 0.85 });
          break;
        }
        candidate = candidate.nextElementSibling;
      }

      // Also check parent container's next sibling
      if (!results.length) {
        const parentDiv = h1.closest('div');
        if (parentDiv) {
          let nextDiv = parentDiv.nextElementSibling;
          for (let i = 0; i < 3 && nextDiv; i++) {
            const directDiv = nextDiv.querySelector('div');
            const rawText = directDiv ? cleanText(directDiv) : cleanText(nextDiv);
            if (rawText && rawText.length > 10 && rawText.length < 150 && !headlineBlocklist.test(rawText)) {
              results.push({ value: rawText, source: 'h1-parent-sibling', confidence: 0.8 });
              break;
            }
            nextDiv = nextDiv.nextElementSibling;
          }
        }
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 2: document.title — text between first " - " and " | "
  try {
    const title = document.title;
    const dashIdx = title.indexOf(' - ');
    const pipeIdx = title.lastIndexOf(' | ');
    if (dashIdx > 0 && pipeIdx > dashIdx) {
      const headline = title.substring(dashIdx + 3, pipeIdx).trim();
      if (headline && headline.length > 5) {
        results.push({ value: headline, source: 'document-title', confidence: 0.7 });
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 3: meta description
  try {
    const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    if (desc) {
      // LinkedIn meta descriptions often start with the headline
      const firstSentence = desc.split('.')[0]?.trim();
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 200) {
        results.push({ value: firstSentence, source: 'meta-description', confidence: 0.6 });
      }
    }
  } catch (e) { /* skip */ }

  return results;
}

function extractLocationField(): StrategyResult[] {
  const results: StrategyResult[] = [];

  // Blocklist for location scan
  const locationBlocklist = /\bconnection|follower|mutual|message|\bmore\b|\bconnect\b/i;

  // Strategy 1: walk elements near the h1, find location-like text
  try {
    const mainEl = document.querySelector('main');
    const h1 = mainEl?.querySelector('h1');
    if (h1) {
      // Narrow scan: only within the h1's parent container (intro card), not entire section
      const container = h1.parentElement?.parentElement || h1.closest('div[class]');
      if (container) {
        const textEls = container.querySelectorAll('span, div');
        const extractedName = cleanName(cleanText(h1));
        for (const el of textEls) {
          if (el.contains(h1) || h1.contains(el)) continue;
          const text = cleanText(el);
          if (!text || text.length >= 100 || text.length < 3) continue;
          // Skip if it matches name or headline-like content
          if (extractedName && text === extractedName) continue;
          if (locationBlocklist.test(text)) continue;
          if (!looksLikeLocation(text)) continue;
          const hasComma = text.includes(',');
          const hasGeoWords = /\b(area|region|city|metro|greater|county|state|province)\b/i.test(text);
          const looksGeo = hasComma || hasGeoWords || /^[A-Z][a-z]/.test(text);
          if (looksGeo) {
            results.push({ value: text, source: 'near-h1-scan', confidence: 0.7 });
            break;
          }
        }
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 2: meta geo.region or geo.placename
  try {
    const geoPlace = document.querySelector('meta[name="geo.placename"]')?.getAttribute('content');
    if (geoPlace) {
      results.push({ value: geoPlace, source: 'meta-geo', confidence: 0.5 });
    }
  } catch (e) { /* skip */ }

  return results;
}

function extractCurrentCompany(): StrategyResult[] {
  const results: StrategyResult[] = [];

  // Strategy 1: first company link in main (a[href*="/company/"])
  try {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      const companyLinks = mainEl.querySelectorAll('a[href*="/company/"]');
      for (const link of companyLinks) {
        const text = cleanText(link);
        if (text && text.length > 1 && text.length < 100) {
          results.push({ value: text, source: 'company-link', confidence: 0.85 });
          break;
        }
      }
    }
  } catch (e) { /* skip */ }

  // Strategy 2: experience section — first entry, non-bold text
  try {
    const expSection = findExperienceSection();
    if (expSection) {
      const firstItem = getFirstExperienceItem(expSection);
      if (firstItem) {
        // Company is typically in a non-bold span with "· Full-time" suffix
        const spans = firstItem.querySelectorAll('span[aria-hidden="true"]');
        for (const span of spans) {
          const text = cleanText(span);
          if (text && text.length > 1) {
            // Check if this is NOT the role (roles are usually bold)
            const isBold = span.closest('[class*="bold"]') ||
              span.closest('strong') ||
              (span.parentElement?.style?.fontWeight && parseInt(span.parentElement.style.fontWeight) >= 600);
            if (!isBold) {
              const company = text.split('·')[0].trim();
              if (company && company.length > 1) {
                results.push({ value: company, source: 'experience-section', confidence: 0.75 });
                break;
              }
            }
          }
        }
      }
    }
  } catch (e) { /* skip */ }

  return results;
}

function extractCurrentRole(): StrategyResult[] {
  const results: StrategyResult[] = [];

  // Strategy 1: experience section — first entry, bold text
  try {
    const expSection = findExperienceSection();
    if (expSection) {
      const firstItem = getFirstExperienceItem(expSection);
      if (firstItem) {
        // Role is typically in a bold span
        const boldEls = firstItem.querySelectorAll('[class*="bold"] span[aria-hidden="true"], strong span, [class*="t-bold"] span[aria-hidden="true"]');
        for (const el of boldEls) {
          const text = cleanText(el);
          if (text && text.length > 1 && text.length < 100) {
            results.push({ value: text, source: 'experience-bold', confidence: 0.75 });
            break;
          }
        }
        // Fallback: first visible span in the first item
        if (!results.length) {
          const spans = firstItem.querySelectorAll('span[aria-hidden="true"]');
          if (spans.length > 0) {
            const text = cleanText(spans[0]);
            if (text && text.length > 1) {
              results.push({ value: text, source: 'experience-first-span', confidence: 0.6 });
            }
          }
        }
      }
    }
  } catch (e) { /* skip */ }

  return results;
}

function parseHeadlineForRoleCompany(headline: string | null): { role: string | null; company: string | null } {
  if (!headline) return { role: null, company: null };
  const atMatch = headline.match(/^(.+?)\s+at\s+(.+?)(?:\s*[|·•–-]|$)/i);
  if (atMatch) return { role: atMatch[1].trim(), company: atMatch[2].trim() };
  const atSymbolMatch = headline.match(/^(.+?)\s*@\s*(.+?)(?:\s*[|·•–-]|$)/i);
  if (atSymbolMatch) return { role: atSymbolMatch[1].trim(), company: atSymbolMatch[2].trim() };
  const separatorMatch = headline.match(/^(.+?)\s*[|·•–-]\s*(.+?)$/);
  if (separatorMatch) return { role: separatorMatch[1].trim(), company: separatorMatch[2].trim() };
  return { role: null, company: null };
}

// ============================================================================
// Main Extraction (synchronous, single-pass)
// ============================================================================

export function extractProfileData(): LinkedInProfileData {
  console.log('[GoGio][Extract] Starting multi-strategy extraction...');

  const fullName = pickBest(extractFullName());
  const headline = pickBest(extractHeadline());
  const location = pickBest(extractLocationField());

  let currentCompany = pickBest(extractCurrentCompany());
  let currentRole = pickBest(extractCurrentRole());

  // Headline fallback for role/company
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

  // Clean profile URL (remove overlay paths like /overlay/contact-info/)
  let profileUrl = window.location.href;
  const overlayIdx = profileUrl.indexOf('/overlay/');
  if (overlayIdx > 0) profileUrl = profileUrl.substring(0, overlayIdx) + '/';

  const result = { fullName, headline, location, currentCompany, currentRole, profileUrl };
  console.log('[GoGio][Extract] Result:', {
    hasName: !!fullName,
    hasHeadline: !!headline,
    hasLocation: !!location,
    hasCompany: !!currentCompany,
    hasRole: !!currentRole,
  });

  return result;
}

// ============================================================================
// Reactive Extraction (MutationObserver + retry schedule)
// ============================================================================

/**
 * Reactive profile extractor with retry schedule + MutationObserver.
 * Calls onResult whenever extraction improves. Stabilizes when two
 * consecutive passes produce the same fullName.
 * 
 * Returns a cleanup function to cancel.
 */
export function extractProfileDataReactive(
  onResult: (data: LinkedInProfileData, stable: boolean) => void,
  signal?: AbortSignal
): () => void {
  let lastResult: LinkedInProfileData | null = null;
  let lastFullName: string | null = null;
  let stabilized = false;
  let observer: MutationObserver | null = null;
  const timers: number[] = [];

  function isAborted() {
    return signal?.aborted === true;
  }

  function countFields(data: LinkedInProfileData): number {
    let count = 0;
    if (data.fullName) count++;
    if (data.headline) count++;
    if (data.location) count++;
    if (data.currentCompany) count++;
    if (data.currentRole) count++;
    return count;
  }

  function runExtraction() {
    if (isAborted() || stabilized) return;

    const data = extractProfileData();
    const currentFields = countFields(data);
    const previousFields = lastResult ? countFields(lastResult) : 0;

    // Only emit if we have more data than before, or first run
    if (currentFields > previousFields || !lastResult) {
      lastResult = data;
      onResult(data, false);
    }

    // Stability check: fullName matched twice in a row and we have core fields
    if (data.fullName && data.fullName === lastFullName && currentFields >= 2) {
      stabilized = true;
      console.log('[GoGio][Extract] Extraction stabilized');
      onResult(lastResult!, true);
      cleanup();
      return;
    }

    lastFullName = data.fullName;
  }

  function cleanup() {
    timers.forEach(t => clearTimeout(t));
    timers.length = 0;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // Retry schedule: immediate, then increasing delays
  const delays = [0, 150, 400, 900, 1800];
  delays.forEach(delay => {
    const t = window.setTimeout(() => {
      if (!isAborted()) runExtraction();
    }, delay);
    timers.push(t);
  });

  // MutationObserver on <main> or <body>
  try {
    const target = document.querySelector('main') || document.body;
    let debounceTimer: number | null = null;

    observer = new MutationObserver(() => {
      if (isAborted() || stabilized) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        runExtraction();
      }, 500);
    });

    observer.observe(target, { childList: true, subtree: true });

    // Auto-disconnect after 10 seconds
    const autoDisconnect = window.setTimeout(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
        console.log('[GoGio][Extract] MutationObserver auto-disconnected (10s)');
        // Final extraction attempt
        if (!stabilized && !isAborted()) {
          runExtraction();
          if (lastResult) {
            stabilized = true;
            onResult(lastResult, true);
          }
        }
      }
    }, 10000);
    timers.push(autoDisconnect);
  } catch (e) {
    console.warn('[GoGio][Extract] MutationObserver setup failed:', e);
  }

  // Listen for abort
  signal?.addEventListener('abort', cleanup);

  return cleanup;
}

/**
 * Legacy API — kept for backward compatibility with content script message handler.
 * Uses retry schedule without MutationObserver.
 */
export async function extractProfileDataWithRetry(): Promise<LinkedInProfileData> {
  const delays = [0, 150, 400, 900, 1800];

  let best: LinkedInProfileData | null = null;
  let bestCount = 0;

  for (const delay of delays) {
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    const data = extractProfileData();
    let count = 0;
    if (data.fullName) count++;
    if (data.headline) count++;
    if (data.location) count++;
    if (data.currentCompany) count++;
    if (data.currentRole) count++;

    if (count > bestCount) {
      best = data;
      bestCount = count;
    }

    // Early exit if we got everything
    if (count >= 4) {
      console.log(`[GoGio][Extract] Got ${count} fields on attempt with delay ${delay}ms`);
      return data;
    }
  }

  return best || extractProfileData();
}

// ============================================================================
// Existing utilities (unchanged)
// ============================================================================

export function isLinkedInProfilePage(): boolean {
  return window.location.href.includes('linkedin.com/in/');
}

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

export async function extractContactInfo(): Promise<ContactInfoData> {
  console.log('[GoGio] Starting contact info extraction...');
  
  const contactLink = document.querySelector('#top-card-text-details-contact-info') ||
                      document.querySelector('a[href*="contact-info"]') ||
                      document.querySelector('[data-control-name="contact_see_more"]');
  
  if (!contactLink) {
    console.log('[GoGio] No contact info link found');
    return { email: null, phone: null, website: null, twitter: null };
  }
  
  (contactLink as HTMLElement).click();
  
  const modalSelectors = [
    '.pv-contact-info',
    '.artdeco-modal[role="dialog"]',
    '[data-test-modal]',
    '.artdeco-modal--layer-default'
  ];
  
  let modal: Element | null = null;
  for (const selector of modalSelectors) {
    modal = await waitForElement(selector, 2000);
    if (modal) break;
  }
  
  if (!modal) {
    return { email: null, phone: null, website: null, twitter: null };
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let email: string | null = null;
  let phone: string | null = null;
  let website: string | null = null;
  let twitter: string | null = null;
  
  const emailLink = modal.querySelector('a[href^="mailto:"]');
  if (emailLink) {
    email = emailLink.getAttribute('href')?.replace('mailto:', '')?.trim() || 
            emailLink.textContent?.trim() || null;
  }
  
  const phoneLink = modal.querySelector('a[href^="tel:"]');
  if (phoneLink) {
    phone = phoneLink.getAttribute('href')?.replace('tel:', '')?.trim() ||
            phoneLink.textContent?.trim() || null;
  }
  
  const allLinks = modal.querySelectorAll('a[href]');
  allLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes('twitter.com') || href.includes('x.com')) {
      twitter = href;
    } else if (!href.startsWith('mailto:') && 
               !href.startsWith('tel:') && 
               !href.includes('linkedin.com') &&
               href.startsWith('http')) {
      website = href;
    }
  });
  
  if (!email || !phone) {
    const modalText = modal.textContent || '';
    if (!email) {
      const emailMatch = modalText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
    }
    if (!phone) {
      const phoneMatch = modalText.match(/(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
      if (phoneMatch) phone = phoneMatch[0].trim();
    }
  }
  
  const closeButton = modal.querySelector('button[aria-label="Dismiss"]') ||
                      modal.querySelector('.artdeco-modal__dismiss') ||
                      modal.querySelector('button.artdeco-button--circle');
  
  if (closeButton) {
    (closeButton as HTMLElement).click();
  } else {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }
  
  return { email, phone, website, twitter };
}
