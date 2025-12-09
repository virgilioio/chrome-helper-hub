import React from 'react';
import { CandidatePanelApp } from './CandidatePanelApp';

/**
 * Popup shell wrapper for the Chrome extension popup.
 * Adds fixed width constraint for popup context.
 */
export const ExtensionPopup: React.FC = () => {
  return (
    <div className="w-[360px] min-h-[400px] bg-background">
      <CandidatePanelApp />
    </div>
  );
};
