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

/* Full Sidebar */
.gogio-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: hsl(0 0% 100%);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12), -1px 0 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2147483647;
}

/* Sidebar Header */
.gogio-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid hsl(230 20% 92%);
  background: hsl(0 0% 100%);
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
  color: hsl(228 45% 10%);
  cursor: pointer;
  transition: background 0.15s ease;
}

.gogio-collapse-button:hover {
  background: hsl(240 5% 96%);
}

/* Sidebar Content - scrollable */
.gogio-sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: hsl(0 0% 98%);
}

/* Floating Button */
.gogio-floating-button {
  position: fixed;
  right: 20px;
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
  background: hsl(180 50% 85%);
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

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .gogio-sidebar {
    background: hsl(230 25% 12%);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
  }

  .gogio-sidebar-header {
    background: hsl(230 25% 12%);
    border-bottom-color: hsl(230 20% 20%);
  }

  .gogio-sidebar-content {
    background: hsl(230 25% 10%);
  }

  .gogio-collapse-button {
    color: hsl(0 0% 95%);
  }

  .gogio-collapse-button:hover {
    background: hsl(230 20% 18%);
  }
}

/* Responsive - narrower on smaller screens */
@media (max-width: 1400px) {
  .gogio-sidebar {
    width: 380px;
  }
}

@media (max-width: 1200px) {
  .gogio-sidebar {
    width: 360px;
  }
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
export const APP_STYLES = `
/* CSS Variables for GoGio theme */
#gogio-sidebar-root {
  /* GoGio/Virgilio Brand Colors */
  --virgilio-purple: 267 89% 60%;
  --virgilio-purple-dark: 267 89% 50%;
  --virgilio-purple-light: 267 89% 70%;
  --virgilio-text: 228 45% 10%;
  --text-secondary: 0 0% 40%;
  --text-tertiary: 0 0% 60%;
  --virgilio-border: 230 20% 92%;
  --lilac-frost: 267 84% 87%;
  
  /* Semantic Colors */
  --success: 158 64% 40%;
  --success-foreground: 0 0% 100%;
  --warning: 48 100% 60%;
  --warning-foreground: 40 100% 20%;
  --info: 180 70% 45%;
  --info-foreground: 0 0% 100%;

  /* Core Theme */
  --background: 0 0% 98%;
  --foreground: 228 45% 10%;
  --card: 0 0% 100%;
  --card-foreground: 228 45% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 228 45% 10%;
  --primary: 267 89% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 5% 96%;
  --secondary-foreground: 228 45% 10%;
  --muted: 240 5% 96%;
  --muted-foreground: 0 0% 40%;
  --accent: 267 84% 87%;
  --accent-foreground: 267 100% 40%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --destructive-bg: 0 100% 88%;
  --border: 230 20% 92%;
  --input: 230 20% 92%;
  --ring: 267 89% 60%;
  --radius: 0.5rem;
}

/* Base styles for GoGio components */
#gogio-sidebar-root {
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#gogio-sidebar-root h1,
#gogio-sidebar-root h2,
#gogio-sidebar-root h3,
#gogio-sidebar-root h4,
#gogio-sidebar-root h5,
#gogio-sidebar-root h6 {
  font-family: 'Poppins', sans-serif;
}

/* Tailwind-like utility classes scoped to GoGio */

/* Display */
#gogio-sidebar-root .flex { display: flex; }
#gogio-sidebar-root .inline-flex { display: inline-flex; }
#gogio-sidebar-root .block { display: block; }
#gogio-sidebar-root .inline-block { display: inline-block; }
#gogio-sidebar-root .hidden { display: none; }
#gogio-sidebar-root .grid { display: grid; }

/* Flex direction */
#gogio-sidebar-root .flex-col { flex-direction: column; }
#gogio-sidebar-root .flex-row { flex-direction: row; }

/* Flex wrap */
#gogio-sidebar-root .flex-wrap { flex-wrap: wrap; }
#gogio-sidebar-root .flex-nowrap { flex-wrap: nowrap; }

/* Justify content */
#gogio-sidebar-root .justify-start { justify-content: flex-start; }
#gogio-sidebar-root .justify-end { justify-content: flex-end; }
#gogio-sidebar-root .justify-center { justify-content: center; }
#gogio-sidebar-root .justify-between { justify-content: space-between; }

/* Align items */
#gogio-sidebar-root .items-start { align-items: flex-start; }
#gogio-sidebar-root .items-end { align-items: flex-end; }
#gogio-sidebar-root .items-center { align-items: center; }
#gogio-sidebar-root .items-stretch { align-items: stretch; }

/* Gap */
#gogio-sidebar-root .gap-1 { gap: 0.25rem; }
#gogio-sidebar-root .gap-2 { gap: 0.5rem; }
#gogio-sidebar-root .gap-3 { gap: 0.75rem; }
#gogio-sidebar-root .gap-4 { gap: 1rem; }
#gogio-sidebar-root .gap-6 { gap: 1.5rem; }
#gogio-sidebar-root .gap-8 { gap: 2rem; }

/* Flex grow/shrink */
#gogio-sidebar-root .flex-1 { flex: 1 1 0%; }
#gogio-sidebar-root .flex-auto { flex: 1 1 auto; }
#gogio-sidebar-root .flex-none { flex: none; }
#gogio-sidebar-root .flex-shrink-0 { flex-shrink: 0; }
#gogio-sidebar-root .grow { flex-grow: 1; }

/* Width */
#gogio-sidebar-root .w-full { width: 100%; }
#gogio-sidebar-root .w-auto { width: auto; }
#gogio-sidebar-root .w-4 { width: 1rem; }
#gogio-sidebar-root .w-5 { width: 1.25rem; }
#gogio-sidebar-root .w-6 { width: 1.5rem; }
#gogio-sidebar-root .w-8 { width: 2rem; }
#gogio-sidebar-root .w-10 { width: 2.5rem; }
#gogio-sidebar-root .w-12 { width: 3rem; }
#gogio-sidebar-root .min-w-0 { min-width: 0; }

/* Height */
#gogio-sidebar-root .h-full { height: 100%; }
#gogio-sidebar-root .h-auto { height: auto; }
#gogio-sidebar-root .h-4 { height: 1rem; }
#gogio-sidebar-root .h-5 { height: 1.25rem; }
#gogio-sidebar-root .h-6 { height: 1.5rem; }
#gogio-sidebar-root .h-8 { height: 2rem; }
#gogio-sidebar-root .h-9 { height: 2.25rem; }
#gogio-sidebar-root .h-10 { height: 2.5rem; }
#gogio-sidebar-root .h-12 { height: 3rem; }
#gogio-sidebar-root .min-h-0 { min-height: 0; }
#gogio-sidebar-root .min-h-screen { min-height: 100vh; }

/* Padding */
#gogio-sidebar-root .p-0 { padding: 0; }
#gogio-sidebar-root .p-1 { padding: 0.25rem; }
#gogio-sidebar-root .p-2 { padding: 0.5rem; }
#gogio-sidebar-root .p-3 { padding: 0.75rem; }
#gogio-sidebar-root .p-4 { padding: 1rem; }
#gogio-sidebar-root .p-5 { padding: 1.25rem; }
#gogio-sidebar-root .p-6 { padding: 1.5rem; }
#gogio-sidebar-root .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
#gogio-sidebar-root .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
#gogio-sidebar-root .px-4 { padding-left: 1rem; padding-right: 1rem; }
#gogio-sidebar-root .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
#gogio-sidebar-root .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
#gogio-sidebar-root .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
#gogio-sidebar-root .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
#gogio-sidebar-root .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
#gogio-sidebar-root .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
#gogio-sidebar-root .pt-0 { padding-top: 0; }
#gogio-sidebar-root .pt-2 { padding-top: 0.5rem; }
#gogio-sidebar-root .pt-4 { padding-top: 1rem; }
#gogio-sidebar-root .pb-2 { padding-bottom: 0.5rem; }
#gogio-sidebar-root .pb-4 { padding-bottom: 1rem; }
#gogio-sidebar-root .pl-2 { padding-left: 0.5rem; }
#gogio-sidebar-root .pl-3 { padding-left: 0.75rem; }
#gogio-sidebar-root .pr-2 { padding-right: 0.5rem; }
#gogio-sidebar-root .pr-3 { padding-right: 0.75rem; }

/* Margin */
#gogio-sidebar-root .m-0 { margin: 0; }
#gogio-sidebar-root .m-1 { margin: 0.25rem; }
#gogio-sidebar-root .m-2 { margin: 0.5rem; }
#gogio-sidebar-root .m-4 { margin: 1rem; }
#gogio-sidebar-root .mx-auto { margin-left: auto; margin-right: auto; }
#gogio-sidebar-root .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
#gogio-sidebar-root .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
#gogio-sidebar-root .mt-0 { margin-top: 0; }
#gogio-sidebar-root .mt-1 { margin-top: 0.25rem; }
#gogio-sidebar-root .mt-2 { margin-top: 0.5rem; }
#gogio-sidebar-root .mt-3 { margin-top: 0.75rem; }
#gogio-sidebar-root .mt-4 { margin-top: 1rem; }
#gogio-sidebar-root .mt-6 { margin-top: 1.5rem; }
#gogio-sidebar-root .mb-0 { margin-bottom: 0; }
#gogio-sidebar-root .mb-1 { margin-bottom: 0.25rem; }
#gogio-sidebar-root .mb-2 { margin-bottom: 0.5rem; }
#gogio-sidebar-root .mb-3 { margin-bottom: 0.75rem; }
#gogio-sidebar-root .mb-4 { margin-bottom: 1rem; }
#gogio-sidebar-root .ml-1 { margin-left: 0.25rem; }
#gogio-sidebar-root .ml-2 { margin-left: 0.5rem; }
#gogio-sidebar-root .ml-auto { margin-left: auto; }
#gogio-sidebar-root .mr-1 { margin-right: 0.25rem; }
#gogio-sidebar-root .mr-2 { margin-right: 0.5rem; }
#gogio-sidebar-root .mr-auto { margin-right: auto; }

/* Space between (using gap instead for flex containers) */
#gogio-sidebar-root .space-y-1 > * + * { margin-top: 0.25rem; }
#gogio-sidebar-root .space-y-2 > * + * { margin-top: 0.5rem; }
#gogio-sidebar-root .space-y-3 > * + * { margin-top: 0.75rem; }
#gogio-sidebar-root .space-y-4 > * + * { margin-top: 1rem; }
#gogio-sidebar-root .space-y-6 > * + * { margin-top: 1.5rem; }
#gogio-sidebar-root .space-x-2 > * + * { margin-left: 0.5rem; }
#gogio-sidebar-root .space-x-4 > * + * { margin-left: 1rem; }

/* Background colors */
#gogio-sidebar-root .bg-background { background-color: hsl(var(--background)); }
#gogio-sidebar-root .bg-card { background-color: hsl(var(--card)); }
#gogio-sidebar-root .bg-primary { background-color: hsl(var(--primary)); }
#gogio-sidebar-root .bg-secondary { background-color: hsl(var(--secondary)); }
#gogio-sidebar-root .bg-muted { background-color: hsl(var(--muted)); }
#gogio-sidebar-root .bg-destructive { background-color: hsl(var(--destructive)); }
#gogio-sidebar-root .bg-accent { background-color: hsl(var(--accent)); }
#gogio-sidebar-root .bg-transparent { background-color: transparent; }
#gogio-sidebar-root .bg-white { background-color: #ffffff; }

/* Text colors */
#gogio-sidebar-root .text-foreground { color: hsl(var(--foreground)); }
#gogio-sidebar-root .text-muted-foreground { color: hsl(var(--muted-foreground)); }
#gogio-sidebar-root .text-primary { color: hsl(var(--primary)); }
#gogio-sidebar-root .text-primary-foreground { color: hsl(var(--primary-foreground)); }
#gogio-sidebar-root .text-destructive { color: hsl(var(--destructive)); }
#gogio-sidebar-root .text-accent-foreground { color: hsl(var(--accent-foreground)); }
#gogio-sidebar-root .text-secondary-foreground { color: hsl(var(--secondary-foreground)); }

/* Text size */
#gogio-sidebar-root .text-xs { font-size: 0.75rem; line-height: 1rem; }
#gogio-sidebar-root .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
#gogio-sidebar-root .text-base { font-size: 1rem; line-height: 1.5rem; }
#gogio-sidebar-root .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
#gogio-sidebar-root .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
#gogio-sidebar-root .text-2xl { font-size: 1.5rem; line-height: 2rem; }

/* Font weight */
#gogio-sidebar-root .font-normal { font-weight: 400; }
#gogio-sidebar-root .font-medium { font-weight: 500; }
#gogio-sidebar-root .font-semibold { font-weight: 600; }
#gogio-sidebar-root .font-bold { font-weight: 700; }

/* Text alignment */
#gogio-sidebar-root .text-left { text-align: left; }
#gogio-sidebar-root .text-center { text-align: center; }
#gogio-sidebar-root .text-right { text-align: right; }

/* Text decoration */
#gogio-sidebar-root .underline { text-decoration: underline; }
#gogio-sidebar-root .no-underline { text-decoration: none; }
#gogio-sidebar-root .line-through { text-decoration: line-through; }

/* Text overflow */
#gogio-sidebar-root .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#gogio-sidebar-root .whitespace-nowrap { white-space: nowrap; }

/* Border */
#gogio-sidebar-root .border { border-width: 1px; border-style: solid; }
#gogio-sidebar-root .border-0 { border-width: 0; }
#gogio-sidebar-root .border-2 { border-width: 2px; }
#gogio-sidebar-root .border-t { border-top-width: 1px; border-style: solid; }
#gogio-sidebar-root .border-b { border-bottom-width: 1px; border-style: solid; }
#gogio-sidebar-root .border-l { border-left-width: 1px; border-style: solid; }
#gogio-sidebar-root .border-r { border-right-width: 1px; border-style: solid; }
#gogio-sidebar-root .border-border { border-color: hsl(var(--border)); }
#gogio-sidebar-root .border-input { border-color: hsl(var(--input)); }
#gogio-sidebar-root .border-primary { border-color: hsl(var(--primary)); }
#gogio-sidebar-root .border-destructive { border-color: hsl(var(--destructive)); }
#gogio-sidebar-root .border-transparent { border-color: transparent; }

/* Border radius */
#gogio-sidebar-root .rounded { border-radius: 0.25rem; }
#gogio-sidebar-root .rounded-sm { border-radius: 0.125rem; }
#gogio-sidebar-root .rounded-md { border-radius: 0.375rem; }
#gogio-sidebar-root .rounded-lg { border-radius: 0.5rem; }
#gogio-sidebar-root .rounded-xl { border-radius: 0.75rem; }
#gogio-sidebar-root .rounded-2xl { border-radius: 1rem; }
#gogio-sidebar-root .rounded-full { border-radius: 9999px; }
#gogio-sidebar-root .rounded-none { border-radius: 0; }

/* Shadow */
#gogio-sidebar-root .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06); }
#gogio-sidebar-root .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
#gogio-sidebar-root .shadow-md { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
#gogio-sidebar-root .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
#gogio-sidebar-root .shadow-none { box-shadow: none; }

/* Opacity */
#gogio-sidebar-root .opacity-0 { opacity: 0; }
#gogio-sidebar-root .opacity-50 { opacity: 0.5; }
#gogio-sidebar-root .opacity-75 { opacity: 0.75; }
#gogio-sidebar-root .opacity-100 { opacity: 1; }

/* Overflow */
#gogio-sidebar-root .overflow-hidden { overflow: hidden; }
#gogio-sidebar-root .overflow-auto { overflow: auto; }
#gogio-sidebar-root .overflow-y-auto { overflow-y: auto; }
#gogio-sidebar-root .overflow-x-hidden { overflow-x: hidden; }

/* Position */
#gogio-sidebar-root .relative { position: relative; }
#gogio-sidebar-root .absolute { position: absolute; }
#gogio-sidebar-root .fixed { position: fixed; }
#gogio-sidebar-root .sticky { position: sticky; }
#gogio-sidebar-root .inset-0 { inset: 0; }
#gogio-sidebar-root .top-0 { top: 0; }
#gogio-sidebar-root .right-0 { right: 0; }
#gogio-sidebar-root .bottom-0 { bottom: 0; }
#gogio-sidebar-root .left-0 { left: 0; }

/* Z-index */
#gogio-sidebar-root .z-10 { z-index: 10; }
#gogio-sidebar-root .z-20 { z-index: 20; }
#gogio-sidebar-root .z-50 { z-index: 50; }

/* Cursor */
#gogio-sidebar-root .cursor-pointer { cursor: pointer; }
#gogio-sidebar-root .cursor-default { cursor: default; }
#gogio-sidebar-root .cursor-not-allowed { cursor: not-allowed; }

/* Pointer events */
#gogio-sidebar-root .pointer-events-none { pointer-events: none; }
#gogio-sidebar-root .pointer-events-auto { pointer-events: auto; }

/* User select */
#gogio-sidebar-root .select-none { user-select: none; }
#gogio-sidebar-root .select-text { user-select: text; }

/* Transitions */
#gogio-sidebar-root .transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
#gogio-sidebar-root .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
#gogio-sidebar-root .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
#gogio-sidebar-root .duration-200 { transition-duration: 200ms; }
#gogio-sidebar-root .duration-300 { transition-duration: 300ms; }

/* Transform */
#gogio-sidebar-root .transform { transform: translateX(var(--tw-translate-x, 0)) translateY(var(--tw-translate-y, 0)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1)); }

/* Ring (focus) */
#gogio-sidebar-root .ring-0 { box-shadow: none; }
#gogio-sidebar-root .ring-1 { box-shadow: 0 0 0 1px hsl(var(--ring)); }
#gogio-sidebar-root .ring-2 { box-shadow: 0 0 0 2px hsl(var(--ring)); }
#gogio-sidebar-root .ring-offset-2 { --tw-ring-offset-width: 2px; }
#gogio-sidebar-root .focus\\:ring-2:focus { box-shadow: 0 0 0 2px hsl(var(--ring)); }

/* Disabled state */
#gogio-sidebar-root .disabled\\:opacity-50:disabled { opacity: 0.5; }
#gogio-sidebar-root .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
#gogio-sidebar-root .disabled\\:pointer-events-none:disabled { pointer-events: none; }

/* Hover states */
#gogio-sidebar-root .hover\\:bg-muted:hover { background-color: hsl(var(--muted)); }
#gogio-sidebar-root .hover\\:bg-accent:hover { background-color: hsl(var(--accent)); }
#gogio-sidebar-root .hover\\:bg-primary:hover { background-color: hsl(var(--primary)); }
#gogio-sidebar-root .hover\\:bg-secondary:hover { background-color: hsl(var(--secondary)); }
#gogio-sidebar-root .hover\\:bg-destructive:hover { background-color: hsl(var(--destructive)); }
#gogio-sidebar-root .hover\\:text-foreground:hover { color: hsl(var(--foreground)); }
#gogio-sidebar-root .hover\\:text-primary:hover { color: hsl(var(--primary)); }
#gogio-sidebar-root .hover\\:text-accent-foreground:hover { color: hsl(var(--accent-foreground)); }
#gogio-sidebar-root .hover\\:underline:hover { text-decoration: underline; }
#gogio-sidebar-root .hover\\:opacity-100:hover { opacity: 1; }

/* Focus states */
#gogio-sidebar-root .focus\\:outline-none:focus { outline: none; }
#gogio-sidebar-root .focus-visible\\:outline-none:focus-visible { outline: none; }
#gogio-sidebar-root .focus-visible\\:ring-2:focus-visible { box-shadow: 0 0 0 2px hsl(var(--ring)); }
#gogio-sidebar-root .focus-visible\\:ring-offset-2:focus-visible { outline-offset: 2px; }

/* Shrink on icon buttons */
#gogio-sidebar-root .shrink-0 { flex-shrink: 0; }

#gogio-sidebar-root .border-border { border-color: hsl(var(--border)); }
#gogio-sidebar-root .border-input { border-color: hsl(var(--input)); }

/* Card component styles */
#gogio-sidebar-root [class*="shadow-card"] {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
}

#gogio-sidebar-root [class*="rounded-card"] {
  border-radius: 0.5rem;
}

/* GoGio Brand Color Classes */
#gogio-sidebar-root .bg-virgilio-purple { background-color: hsl(267 89% 60%); }
#gogio-sidebar-root .bg-virgilio-purple\/90 { background-color: hsl(267 89% 60% / 0.9); }
#gogio-sidebar-root .text-virgilio-purple { color: hsl(267 89% 60%); }
#gogio-sidebar-root .text-lilac-frost { color: hsl(267 84% 87%); }
#gogio-sidebar-root .text-text-secondary { color: hsl(0 0% 40%); }
#gogio-sidebar-root .bg-destructive-bg { background-color: hsl(0 100% 95%); }
#gogio-sidebar-root .text-card-foreground { color: hsl(228 45% 10%); }

/* Shadow utilities */
#gogio-sidebar-root .shadow-button { box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06); }

/* Spacing utilities */
#gogio-sidebar-root .tracking-wide { letter-spacing: 0.025em; }
#gogio-sidebar-root .tracking-tight { letter-spacing: -0.025em; }
#gogio-sidebar-root .leading-none { line-height: 1; }
#gogio-sidebar-root .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
#gogio-sidebar-root .max-w-\\[340px\\] { max-width: 340px; }

/* Ring offset */
#gogio-sidebar-root .ring-offset-background { --tw-ring-offset-color: hsl(var(--background)); }

/* Virgilio Button Hover/Active States */
#gogio-sidebar-root .hover\\:bg-virgilio-purple\\/90:hover { background-color: hsl(267 89% 60% / 0.9); }
#gogio-sidebar-root .hover\\:-translate-y-0\\.5:hover { transform: translateY(-0.125rem); }
#gogio-sidebar-root .hover\\:shadow-md:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
#gogio-sidebar-root .active\\:scale-95:active { transform: scale(0.95); }
#gogio-sidebar-root .active\\:shadow-sm:active { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

/* Font family */
#gogio-sidebar-root .font-heading { font-family: 'Poppins', sans-serif; }

/* Animate spin for loader */
@keyframes gogio-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
#gogio-sidebar-root .animate-spin { animation: gogio-spin 1s linear infinite; }

/* SVG sizing in buttons */
#gogio-sidebar-root [class*="[&_svg]:size-4"] svg,
#gogio-sidebar-root button svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

#gogio-sidebar-root [class*="[&_svg]:shrink-0"] svg {
  flex-shrink: 0;
}

/* Button base styles */
#gogio-sidebar-root button {
  cursor: pointer;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* Virgilio button specific styling */
#gogio-sidebar-root button.bg-virgilio-purple,
#gogio-sidebar-root .virgilio-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: hsl(267 89% 60%);
  color: white;
  padding: 0.5rem 0.75rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

#gogio-sidebar-root button.bg-virgilio-purple:hover,
#gogio-sidebar-root .virgilio-button:hover {
  background-color: hsl(267 89% 55%);
  transform: translateY(-0.125rem);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
}

#gogio-sidebar-root button.bg-virgilio-purple:active,
#gogio-sidebar-root .virgilio-button:active {
  transform: scale(0.95);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

#gogio-sidebar-root button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

#gogio-sidebar-root button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Input styles */
#gogio-sidebar-root input,
#gogio-sidebar-root textarea,
#gogio-sidebar-root select {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 8px 12px;
  width: 100%;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

#gogio-sidebar-root input:focus,
#gogio-sidebar-root textarea:focus,
#gogio-sidebar-root select:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

#gogio-sidebar-root input::placeholder,
#gogio-sidebar-root textarea::placeholder {
  color: hsl(var(--muted-foreground));
}

/* Label styles */
#gogio-sidebar-root label {
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--foreground));
  display: block;
  margin-bottom: 4px;
}

/* Scrollbar styling */
#gogio-sidebar-root ::-webkit-scrollbar {
  width: 6px;
}

#gogio-sidebar-root ::-webkit-scrollbar-track {
  background: transparent;
}

#gogio-sidebar-root ::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

#gogio-sidebar-root ::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground));
}

/* Animation */
@keyframes gogio-fade-in {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

#gogio-sidebar-root .animate-fade-in {
  animation: gogio-fade-in 0.2s ease-out;
}

/* Toast/Sonner positioning fix */
#gogio-sidebar-root [data-sonner-toaster] {
  position: fixed !important;
  z-index: 2147483647 !important;
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
