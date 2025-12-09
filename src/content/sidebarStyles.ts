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
#gogio-sidebar-root .bg-background { background-color: hsl(var(--background)); }
#gogio-sidebar-root .bg-card { background-color: hsl(var(--card)); }
#gogio-sidebar-root .bg-primary { background-color: hsl(var(--primary)); }
#gogio-sidebar-root .bg-secondary { background-color: hsl(var(--secondary)); }
#gogio-sidebar-root .bg-muted { background-color: hsl(var(--muted)); }
#gogio-sidebar-root .bg-destructive { background-color: hsl(var(--destructive)); }

#gogio-sidebar-root .text-foreground { color: hsl(var(--foreground)); }
#gogio-sidebar-root .text-muted-foreground { color: hsl(var(--muted-foreground)); }
#gogio-sidebar-root .text-primary { color: hsl(var(--primary)); }
#gogio-sidebar-root .text-primary-foreground { color: hsl(var(--primary-foreground)); }
#gogio-sidebar-root .text-destructive { color: hsl(var(--destructive)); }

#gogio-sidebar-root .border-border { border-color: hsl(var(--border)); }
#gogio-sidebar-root .border-input { border-color: hsl(var(--input)); }

/* Card component styles */
#gogio-sidebar-root [class*="shadow-card"] {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
}

#gogio-sidebar-root [class*="rounded-card"] {
  border-radius: 0.5rem;
}

/* Button base styles */
#gogio-sidebar-root button {
  cursor: pointer;
  border: none;
  outline: none;
  font-family: inherit;
  transition: all 0.15s ease;
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
