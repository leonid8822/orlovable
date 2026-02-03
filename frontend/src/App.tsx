import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Landing from "./pages/Landing";
import KidsLanding from "./pages/KidsLanding";
import TotemsLanding from "./pages/TotemsLanding";
import CustomLanding from "./pages/CustomLanding";
import Shop from "./pages/Shop";
import Index from "./pages/Index";
import Ideas from "./pages/Ideas";
import Application from "./pages/Application";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Oferta from "./pages/Oferta";
import Privacy from "./pages/Privacy";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/kids" element={<KidsLanding />} />
          <Route path="/totems" element={<TotemsLanding />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/custom" element={<CustomLanding />} />
          <Route path="/create" element={<Index />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/application/:id" element={<Application />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/oferta" element={<Oferta />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/fail" element={<PaymentFail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
