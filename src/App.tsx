
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SharedResume from "./pages/SharedResume";
import { PiPVideoProvider } from "@/contexts/PiPVideoContext";
import { PiPVideoPlayer } from "@/components/PiPVideoPlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PiPVideoProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/resume/:id" element={<SharedResume />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
          <PiPVideoPlayer />
        </BrowserRouter>
      </TooltipProvider>
    </PiPVideoProvider>
  </QueryClientProvider>
);

export default App;
