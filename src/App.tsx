import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExtensionPopup } from "./components/extension/ExtensionPopup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="shadow-elevated rounded-card overflow-hidden border border-border">
          <ExtensionPopup />
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
