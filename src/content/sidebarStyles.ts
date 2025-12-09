// CSS styles for the GoGio sidebar injected into LinkedIn pages
// These styles are self-contained and won't conflict with LinkedIn's styles

export const SIDEBAR_STYLES = `
/* Google Fonts for GoGio branding */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

/* GoGio Sidebar Container */
#gogio-sidebar-root {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 2147483647;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Full Sidebar - GoGio Design Spec: 368px width (15% wider) */
.gogio-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 368px;
  height: 100vh;
  background: #FFFFFF;
  border-left: 1px solid #E7E8EE;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2147483647;
}

/* Sidebar Header - GoGio Design Spec: 48px height */
.gogio-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #E7E8EE;
  background: #FFFFFF;
  flex-shrink: 0;
}

.gogio-collapse-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #5A6072;
  cursor: pointer;
  transition: background 0.15s ease;
}

.gogio-collapse-button:hover {
  background: #F8F9FA;
}

/* Sidebar Content - scrollable */
.gogio-sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: #FFFFFF;
}

/* Floating Button */
.gogio-floating-button {
  position: fixed;
  right: 16px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 2147483647;
  overflow: hidden;
  background: #6F3FF5;
}

.gogio-floating-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.12);
}

.gogio-floating-button:active {
  transform: scale(0.95);
}

.gogio-floating-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Reset styles for GoGio components inside LinkedIn */
#gogio-sidebar-root *,
#gogio-sidebar-root *::before,
#gogio-sidebar-root *::after {
  box-sizing: border-box;
}

#gogio-sidebar-root button {
  font-family: inherit;
}
`;

export const injectSidebarStyles = (): HTMLStyleElement | null => {
  // Check if styles already injected
  const existingStyle = document.getElementById('gogio-sidebar-styles');
  if (existingStyle) {
    return existingStyle as HTMLStyleElement;
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'gogio-sidebar-styles';
  styleEl.textContent = SIDEBAR_STYLES;
  document.head.appendChild(styleEl);
  console.log('[GoGio][Sidebar] Styles injected');
  return styleEl;
};

export const removeSidebarStyles = (): void => {
  const styleEl = document.getElementById('gogio-sidebar-styles');
  if (styleEl) {
    styleEl.remove();
    console.log('[GoGio][Sidebar] Styles removed');
  }
};

// App component styles (shadcn/tailwind equivalent for content script context)
// Following GoGio Design Specification
export const APP_STYLES = `
/* ========================================
   GoGio Design System - CSS Variables
   ======================================== */
#gogio-sidebar-root {
  /* Primary Colors */
  --gogio-primary: #6F3FF5;
  --gogio-primary-dark: #5A32C9;
  --gogio-lilac-frost: #d7c5fb;
  
  /* Text Colors */
  --gogio-text-primary: #0F1222;
  --gogio-text-secondary: #5A6072;
  
  /* Surface Colors */
  --gogio-background: #FFFFFF;
  --gogio-surface-secondary: #F8F9FA;
  --gogio-border: #E7E8EE;
  
  /* Semantic Colors */
  --gogio-success: #12B886;
  --gogio-error: #FA5252;
  
  /* Shadows - GoGio Spec */
  --gogio-shadow-card: 0 4px 12px rgba(15, 18, 34, 0.08);
  --gogio-shadow-button: 0 2px 4px -1px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.06);
  --gogio-shadow-button-hover: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --gogio-shadow-dropdown: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  
  /* Border Radius - GoGio Spec */
  --gogio-radius-button: 8px;
  --gogio-radius-input: 8px;
  --gogio-radius-card: 12px;
  --gogio-radius-pill: 9999px;
  
  /* Semantic variables for shadcn compatibility */
  --background: 0 0% 100%;
  --foreground: 228 45% 10%;
  --card: 0 0% 100%;
  --card-foreground: 228 45% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 228 45% 10%;
  --primary: 264 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 96%;
  --secondary-foreground: 228 45% 10%;
  --muted: 220 14% 96%;
  --muted-foreground: 224 8% 46%;
  --accent: 264 84% 87%;
  --accent-foreground: 264 100% 37%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 230 20% 92%;
  --input: 230 20% 92%;
  --ring: 264 91% 60%;
}

/* Base styles */
#gogio-sidebar-root {
  font-size: 13px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--gogio-text-primary);
}

#gogio-sidebar-root h1,
#gogio-sidebar-root h2,
#gogio-sidebar-root h3,
#gogio-sidebar-root h4,
#gogio-sidebar-root h5,
#gogio-sidebar-root h6 {
  font-family: 'Poppins', sans-serif;
  letter-spacing: -0.02em;
}

/* ========================================
   Connect to GoGio View Styles
   ======================================== */

/* Logo Container - 64x64 circle with 10% purple bg */
.gogio-logo-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(111, 63, 245, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.gogio-logo-container img {
  width: 40px;
  height: 40px;
}

/* Title with purple period */
.gogio-title {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--gogio-text-primary);
  letter-spacing: -0.06em;
  text-align: center;
  margin-bottom: 8px;
}

.gogio-title-period {
  color: var(--gogio-lilac-frost);
}

/* Description text */
.gogio-description {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--gogio-text-secondary);
  line-height: 1.5;
  text-align: center;
  max-width: 240px;
  margin: 0 auto;
}

/* Primary Connect Button - Lilac Frost background */
.gogio-btn-connect {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  background: var(--gogio-lilac-frost);
  color: var(--gogio-primary);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: var(--gogio-radius-button);
  box-shadow: var(--gogio-shadow-button);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;
}

.gogio-btn-connect:hover {
  background: rgba(215, 197, 251, 0.9);
  box-shadow: var(--gogio-shadow-button-hover);
  transform: translateY(-1px);
}

.gogio-btn-connect:active {
  transform: scale(0.95);
}

.gogio-btn-connect:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Error state icon container */
.gogio-error-icon-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(250, 82, 82, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

/* Success state icon container */
.gogio-success-icon-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(18, 184, 134, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

/* Link text */
.gogio-link-text {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: var(--gogio-text-secondary);
  text-align: center;
  margin-top: 16px;
}

.gogio-link-text a {
  color: var(--gogio-primary);
  text-decoration: none;
}

.gogio-link-text a:hover {
  text-decoration: underline;
}

/* ========================================
   Main Form View Styles
   ======================================== */

/* Card Section Title */
.gogio-card-title {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--gogio-text-secondary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gogio-card-title svg {
  width: 14px;
  height: 14px;
  color: var(--gogio-primary);
}

/* Card styling */
.gogio-card {
  background: #FFFFFF;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-card);
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--gogio-shadow-card);
}

/* Candidate Preview Card */
.gogio-candidate-preview {
  background: var(--gogio-surface-secondary);
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-button);
  padding: 12px;
  margin-bottom: 16px;
}

.gogio-candidate-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(111, 63, 245, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gogio-candidate-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--gogio-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gogio-candidate-title {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: var(--gogio-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gogio-candidate-company {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: var(--gogio-text-secondary);
}

/* Form Labels - GoGio Spec */
.gogio-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--gogio-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

/* Form Inputs/Selects - GoGio Spec: 36px height */
.gogio-input,
.gogio-select-trigger {
  height: 36px;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-input);
  padding: 0 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--gogio-text-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.gogio-input::placeholder,
.gogio-select-trigger.placeholder {
  color: var(--gogio-text-secondary);
}

.gogio-input:hover,
.gogio-select-trigger:hover {
  border-color: rgba(111, 63, 245, 0.5);
  transform: translateY(-0.5px);
}

.gogio-input:focus,
.gogio-select-trigger:focus {
  outline: none;
  border-color: var(--gogio-primary);
  box-shadow: 0 0 0 2px rgba(111, 63, 245, 0.2);
}

.gogio-input:disabled,
.gogio-select-trigger:disabled {
  background: var(--gogio-surface-secondary);
  opacity: 0.5;
  cursor: not-allowed;
}

/* Textarea - GoGio Spec: min-height 72px */
.gogio-textarea {
  min-height: 72px;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-input);
  padding: 8px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--gogio-text-primary);
  resize: vertical;
  transition: all 0.2s ease;
}

.gogio-textarea::placeholder {
  color: var(--gogio-text-secondary);
}

.gogio-textarea:hover {
  border-color: rgba(111, 63, 245, 0.5);
}

.gogio-textarea:focus {
  outline: none;
  border-color: var(--gogio-primary);
  box-shadow: 0 0 0 2px rgba(111, 63, 245, 0.2);
}

/* Primary Action Button - GoGio Spec: Purple, 40px height */
.gogio-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 40px;
  background: var(--gogio-primary);
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: var(--gogio-radius-button);
  box-shadow: var(--gogio-shadow-button);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
}

.gogio-btn-primary:hover {
  background: var(--gogio-primary-dark);
  box-shadow: var(--gogio-shadow-button-hover);
  transform: translateY(-0.5px);
}

.gogio-btn-primary:active {
  transform: scale(0.95);
}

.gogio-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Secondary/Outline Button */
.gogio-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 36px;
  background: transparent;
  color: var(--gogio-text-secondary);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-button);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.gogio-btn-secondary:hover {
  background: rgba(111, 63, 245, 0.05);
  border-color: rgba(111, 63, 245, 0.5);
}

/* ========================================
   Custom Dropdown Styles (No Portal)
   ======================================== */

.gogio-dropdown-container {
  position: relative;
  width: 100%;
}

.gogio-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-input);
  padding: 0 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--gogio-text-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gogio-dropdown-trigger.placeholder {
  color: var(--gogio-text-secondary);
}

.gogio-dropdown-trigger:hover:not(:disabled) {
  border-color: rgba(111, 63, 245, 0.5);
  transform: translateY(-0.5px);
}

.gogio-dropdown-trigger:focus {
  outline: none;
  border-color: var(--gogio-primary);
  box-shadow: 0 0 0 2px rgba(111, 63, 245, 0.2);
}

.gogio-dropdown-trigger:disabled {
  background: var(--gogio-surface-secondary);
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.gogio-dropdown-chevron {
  width: 16px;
  height: 16px;
  color: var(--gogio-text-secondary);
  opacity: 0.5;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.gogio-dropdown-trigger[data-state="open"] .gogio-dropdown-chevron {
  transform: rotate(180deg);
}

/* Dropdown Menu - renders inside sidebar, no portal */
.gogio-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-input);
  box-shadow: var(--gogio-shadow-dropdown);
  max-height: 200px;
  overflow: hidden;
  z-index: 100;
  animation: gogio-dropdown-in 0.15s ease;
}

@keyframes gogio-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dropdown Search Input */
.gogio-dropdown-search {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gogio-border);
  gap: 8px;
}

.gogio-dropdown-search-icon {
  width: 14px;
  height: 14px;
  color: var(--gogio-text-secondary);
  opacity: 0.5;
  flex-shrink: 0;
}

.gogio-dropdown-search input {
  flex: 1;
  border: none;
  background: none;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--gogio-text-primary);
  outline: none;
}

.gogio-dropdown-search input::placeholder {
  color: var(--gogio-text-secondary);
}

/* Dropdown List */
.gogio-dropdown-list {
  max-height: 156px;
  overflow-y: auto;
  padding: 4px;
}

/* Dropdown Item - 32px height */
.gogio-dropdown-item {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px 0 32px;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--gogio-text-primary);
  cursor: pointer;
  transition: background 0.1s ease;
  position: relative;
}

.gogio-dropdown-item:hover {
  background: var(--gogio-lilac-frost);
}

.gogio-dropdown-item.selected {
  background: rgba(111, 63, 245, 0.08);
}

.gogio-dropdown-item-check {
  position: absolute;
  left: 8px;
  width: 16px;
  height: 16px;
  color: var(--gogio-primary);
}

.gogio-dropdown-empty {
  padding: 24px 12px;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--gogio-text-secondary);
}

/* ========================================
   Utility Classes
   ======================================== */

/* Display */
#gogio-sidebar-root .flex { display: flex; }
#gogio-sidebar-root .inline-flex { display: inline-flex; }
#gogio-sidebar-root .block { display: block; }
#gogio-sidebar-root .hidden { display: none; }
#gogio-sidebar-root .grid { display: grid; }

/* Flex */
#gogio-sidebar-root .flex-col { flex-direction: column; }
#gogio-sidebar-root .flex-row { flex-direction: row; }
#gogio-sidebar-root .justify-start { justify-content: flex-start; }
#gogio-sidebar-root .justify-end { justify-content: flex-end; }
#gogio-sidebar-root .justify-center { justify-content: center; }
#gogio-sidebar-root .justify-between { justify-content: space-between; }
#gogio-sidebar-root .items-start { align-items: flex-start; }
#gogio-sidebar-root .items-center { align-items: center; }
#gogio-sidebar-root .items-stretch { align-items: stretch; }
#gogio-sidebar-root .flex-1 { flex: 1 1 0%; }
#gogio-sidebar-root .flex-shrink-0 { flex-shrink: 0; }
#gogio-sidebar-root .shrink-0 { flex-shrink: 0; }

/* Gap */
#gogio-sidebar-root .gap-1 { gap: 4px; }
#gogio-sidebar-root .gap-2 { gap: 8px; }
#gogio-sidebar-root .gap-3 { gap: 12px; }
#gogio-sidebar-root .gap-4 { gap: 16px; }
#gogio-sidebar-root .gap-5 { gap: 20px; }
#gogio-sidebar-root .gap-6 { gap: 24px; }

/* Width/Height */
#gogio-sidebar-root .w-full { width: 100%; }
#gogio-sidebar-root .w-auto { width: auto; }
#gogio-sidebar-root .h-full { height: 100%; }
#gogio-sidebar-root .h-auto { height: auto; }
#gogio-sidebar-root .h-4 { height: 16px; }
#gogio-sidebar-root .h-5 { height: 20px; }
#gogio-sidebar-root .w-4 { width: 16px; }
#gogio-sidebar-root .w-5 { width: 20px; }
#gogio-sidebar-root .min-w-0 { min-width: 0; }

/* Padding - 4px grid */
#gogio-sidebar-root .p-3 { padding: 12px; }
#gogio-sidebar-root .p-4 { padding: 16px; }
#gogio-sidebar-root .px-3 { padding-left: 12px; padding-right: 12px; }
#gogio-sidebar-root .px-4 { padding-left: 16px; padding-right: 16px; }
#gogio-sidebar-root .py-3 { padding-top: 12px; padding-bottom: 12px; }
#gogio-sidebar-root .py-4 { padding-top: 16px; padding-bottom: 16px; }
#gogio-sidebar-root .pt-4 { padding-top: 16px; }
#gogio-sidebar-root .pb-3 { padding-bottom: 12px; }

/* Margin */
#gogio-sidebar-root .m-0 { margin: 0; }
#gogio-sidebar-root .mx-auto { margin-left: auto; margin-right: auto; }
#gogio-sidebar-root .mt-1 { margin-top: 4px; }
#gogio-sidebar-root .mt-2 { margin-top: 8px; }
#gogio-sidebar-root .mt-3 { margin-top: 12px; }
#gogio-sidebar-root .mt-4 { margin-top: 16px; }
#gogio-sidebar-root .mt-5 { margin-top: 20px; }
#gogio-sidebar-root .mt-6 { margin-top: 24px; }
#gogio-sidebar-root .mb-1 { margin-bottom: 4px; }
#gogio-sidebar-root .mb-2 { margin-bottom: 8px; }
#gogio-sidebar-root .mb-3 { margin-bottom: 12px; }
#gogio-sidebar-root .mb-4 { margin-bottom: 16px; }
#gogio-sidebar-root .ml-2 { margin-left: 8px; }
#gogio-sidebar-root .mr-2 { margin-right: 8px; }

/* Space between */
#gogio-sidebar-root .space-y-3 > * + * { margin-top: 12px; }
#gogio-sidebar-root .space-y-4 > * + * { margin-top: 16px; }

/* Text */
#gogio-sidebar-root .text-xs { font-size: 11px; line-height: 1.4; }
#gogio-sidebar-root .text-sm { font-size: 12px; line-height: 1.4; }
#gogio-sidebar-root .text-base { font-size: 13px; line-height: 1.4; }
#gogio-sidebar-root .text-lg { font-size: 14px; line-height: 1.4; }
#gogio-sidebar-root .text-xl { font-size: 16px; line-height: 1.2; }
#gogio-sidebar-root .font-normal { font-weight: 400; }
#gogio-sidebar-root .font-medium { font-weight: 500; }
#gogio-sidebar-root .font-semibold { font-weight: 600; }
#gogio-sidebar-root .font-bold { font-weight: 700; }
#gogio-sidebar-root .text-center { text-align: center; }
#gogio-sidebar-root .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Colors */
#gogio-sidebar-root .text-foreground { color: var(--gogio-text-primary); }
#gogio-sidebar-root .text-muted-foreground { color: var(--gogio-text-secondary); }
#gogio-sidebar-root .text-primary { color: var(--gogio-primary); }
#gogio-sidebar-root .text-destructive { color: var(--gogio-error); }
#gogio-sidebar-root .bg-background { background-color: #FFFFFF; }
#gogio-sidebar-root .bg-card { background-color: #FFFFFF; }
#gogio-sidebar-root .bg-muted { background-color: var(--gogio-surface-secondary); }
#gogio-sidebar-root .bg-primary { background-color: var(--gogio-primary); }
#gogio-sidebar-root .bg-destructive { background-color: var(--gogio-error); }

/* Border */
#gogio-sidebar-root .border { border: 1px solid var(--gogio-border); }
#gogio-sidebar-root .border-b { border-bottom: 1px solid var(--gogio-border); }
#gogio-sidebar-root .border-t { border-top: 1px solid var(--gogio-border); }
#gogio-sidebar-root .border-border { border-color: var(--gogio-border); }
#gogio-sidebar-root .rounded { border-radius: var(--gogio-radius-button); }
#gogio-sidebar-root .rounded-lg { border-radius: var(--gogio-radius-card); }
#gogio-sidebar-root .rounded-full { border-radius: 9999px; }

/* Shadow */
#gogio-sidebar-root .shadow-card { box-shadow: var(--gogio-shadow-card); }
#gogio-sidebar-root .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

/* Position */
#gogio-sidebar-root .relative { position: relative; }
#gogio-sidebar-root .absolute { position: absolute; }
#gogio-sidebar-root .sticky { position: sticky; }
#gogio-sidebar-root .top-0 { top: 0; }
#gogio-sidebar-root .z-10 { z-index: 10; }

/* Overflow */
#gogio-sidebar-root .overflow-hidden { overflow: hidden; }
#gogio-sidebar-root .overflow-y-auto { overflow-y: auto; }

/* Cursor */
#gogio-sidebar-root .cursor-pointer { cursor: pointer; }
#gogio-sidebar-root .cursor-not-allowed { cursor: not-allowed; }

/* Opacity */
#gogio-sidebar-root .opacity-50 { opacity: 0.5; }

/* Grid */
#gogio-sidebar-root .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

/* Animation */
@keyframes gogio-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
#gogio-sidebar-root .animate-spin { animation: gogio-spin 1s linear infinite; }

@keyframes gogio-fade-in {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}
#gogio-sidebar-root .animate-fade-in { animation: gogio-fade-in 0.2s ease-out; }

/* Input/Button base resets */
#gogio-sidebar-root input,
#gogio-sidebar-root textarea {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-input);
  background: #FFFFFF;
  color: var(--gogio-text-primary);
  padding: 8px 12px;
  width: 100%;
  transition: all 0.2s ease;
}

#gogio-sidebar-root input:focus,
#gogio-sidebar-root textarea:focus {
  outline: none;
  border-color: var(--gogio-primary);
  box-shadow: 0 0 0 2px rgba(111, 63, 245, 0.2);
}

#gogio-sidebar-root input::placeholder,
#gogio-sidebar-root textarea::placeholder {
  color: var(--gogio-text-secondary);
}

#gogio-sidebar-root input:hover:not(:focus):not(:disabled),
#gogio-sidebar-root textarea:hover:not(:focus):not(:disabled) {
  border-color: rgba(111, 63, 245, 0.5);
}

#gogio-sidebar-root input:disabled,
#gogio-sidebar-root textarea:disabled {
  background: var(--gogio-surface-secondary);
  opacity: 0.5;
  cursor: not-allowed;
}

/* Label styling */
#gogio-sidebar-root label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--gogio-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

/* Button base */
#gogio-sidebar-root button {
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

#gogio-sidebar-root button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#gogio-sidebar-root button:focus-visible {
  outline: 2px solid var(--gogio-primary);
  outline-offset: 2px;
}

/* SVG in buttons */
#gogio-sidebar-root button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Card component */
#gogio-sidebar-root .gogio-card {
  background: #FFFFFF;
  border: 1px solid var(--gogio-border);
  border-radius: var(--gogio-radius-card);
  box-shadow: var(--gogio-shadow-card);
}

/* Scrollbar styling */
#gogio-sidebar-root ::-webkit-scrollbar {
  width: 6px;
}

#gogio-sidebar-root ::-webkit-scrollbar-track {
  background: transparent;
}

#gogio-sidebar-root ::-webkit-scrollbar-thumb {
  background: var(--gogio-border);
  border-radius: 3px;
}

#gogio-sidebar-root ::-webkit-scrollbar-thumb:hover {
  background: var(--gogio-text-secondary);
}

/* Toast positioning */
#gogio-sidebar-root [data-sonner-toaster] {
  position: fixed !important;
  z-index: 2147483647 !important;
}

/* Error message box */
.gogio-error-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(250, 82, 82, 0.08);
  border-radius: var(--gogio-radius-button);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--gogio-error);
}

.gogio-error-box svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ========================================
   Toast Notification Styles - GoGio Spec
   ======================================== */

/* Toast Container - Centered inside sidebar */
.gogio-sidebar [data-sonner-toaster] {
  position: absolute !important;
  bottom: 16px !important;
  left: 50% !important;
  right: auto !important;
  top: auto !important;
  transform: translateX(-50%) !important;
  width: calc(100% - 32px) !important;
  max-width: 336px !important;
  z-index: 2147483648 !important;
  pointer-events: auto !important;
}

/* Toast Item Styling */
#gogio-sidebar-root [data-sonner-toast] {
  max-width: 100% !important;
  width: 100% !important;
  padding: 16px 32px 16px 16px !important;
  border-radius: 12px !important;
  background: #FFFFFF !important;
  border: 1px solid #E7E8EE !important;
  box-shadow: 0 8px 24px rgba(15, 18, 34, 0.08) !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  gap: 12px !important;
}

/* Toast Title */
#gogio-sidebar-root [data-sonner-toast] [data-title] {
  font-family: 'Poppins', -apple-system, sans-serif !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  color: #0F1222 !important;
  line-height: 1.4 !important;
}

/* Toast Description */
#gogio-sidebar-root [data-sonner-toast] [data-description] {
  font-family: 'Inter', -apple-system, sans-serif !important;
  font-size: 12px !important;
  color: #5A6072 !important;
  line-height: 1.4 !important;
  margin-top: 2px !important;
}

/* Success Toast */
#gogio-sidebar-root [data-sonner-toast][data-type="success"] {
  border-left: 3px solid #12B886 !important;
}

#gogio-sidebar-root [data-sonner-toast][data-type="success"] [data-icon] svg {
  color: #12B886 !important;
}

/* Error/Destructive Toast */
#gogio-sidebar-root [data-sonner-toast][data-type="error"] {
  background: #FA5252 !important;
  border: 1px solid #FA5252 !important;
  border-left: 3px solid #C83E3E !important;
}

#gogio-sidebar-root [data-sonner-toast][data-type="error"] [data-title] {
  color: #FFFFFF !important;
}

#gogio-sidebar-root [data-sonner-toast][data-type="error"] [data-description] {
  color: rgba(255, 255, 255, 0.9) !important;
}

#gogio-sidebar-root [data-sonner-toast][data-type="error"] [data-icon] svg {
  color: #FFFFFF !important;
}

#gogio-sidebar-root [data-sonner-toast][data-type="error"] [data-close-button] {
  color: rgba(255, 255, 255, 0.7) !important;
}

#gogio-sidebar-root [data-sonner-toast][data-type="error"] [data-close-button]:hover {
  color: #FFFFFF !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Warning Toast */
#gogio-sidebar-root [data-sonner-toast][data-type="warning"] {
  border-left: 3px solid #F59E0B !important;
}

/* Info Toast */
#gogio-sidebar-root [data-sonner-toast][data-type="info"] {
  border-left: 3px solid #6F3FF5 !important;
}

#gogio-sidebar-root [data-sonner-toast][data-type="info"] [data-icon] svg {
  color: #6F3FF5 !important;
}

/* Close Button */
#gogio-sidebar-root [data-sonner-toast] [data-close-button] {
  position: absolute !important;
  right: 8px !important;
  top: 8px !important;
  width: 20px !important;
  height: 20px !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  color: #5A6072 !important;
  opacity: 0 !important;
  cursor: pointer !important;
  border-radius: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.15s ease !important;
}

#gogio-sidebar-root [data-sonner-toast]:hover [data-close-button] {
  opacity: 1 !important;
}

#gogio-sidebar-root [data-sonner-toast] [data-close-button]:hover {
  background: rgba(0, 0, 0, 0.05) !important;
  color: #0F1222 !important;
}

/* Toast Icon */
#gogio-sidebar-root [data-sonner-toast] [data-icon] {
  width: 20px !important;
  height: 20px !important;
  flex-shrink: 0 !important;
}

#gogio-sidebar-root [data-sonner-toast] [data-icon] svg {
  width: 20px !important;
  height: 20px !important;
}

/* Toast Action Button */
#gogio-sidebar-root [data-sonner-toast] [data-button] {
  height: 32px !important;
  padding: 0 12px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  font-family: 'Inter', sans-serif !important;
  border-radius: 8px !important;
  background: transparent !important;
  border: 1px solid #E7E8EE !important;
  color: #0F1222 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

#gogio-sidebar-root [data-sonner-toast] [data-button]:hover {
  background: #F8F9FA !important;
  border-color: #D1D5DB !important;
}

/* Toast Content Layout */
#gogio-sidebar-root [data-sonner-toast] [data-content] {
  flex: 1 !important;
  min-width: 0 !important;
}
`;

export const injectAppStyles = (): HTMLStyleElement | null => {
  const existingStyle = document.getElementById('gogio-app-styles');
  if (existingStyle) {
    return existingStyle as HTMLStyleElement;
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'gogio-app-styles';
  styleEl.textContent = APP_STYLES;
  document.head.appendChild(styleEl);
  console.log('[GoGio][Sidebar] App styles injected');
  return styleEl;
};

export const removeAppStyles = (): void => {
  const styleEl = document.getElementById('gogio-app-styles');
  if (styleEl) {
    styleEl.remove();
  }
};
