import { ExtensionPopup } from '@/components/extension/ExtensionPopup';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="shadow-elevated rounded-card overflow-hidden border border-border">
        <ExtensionPopup />
      </div>
    </div>
  );
};

export default Index;
