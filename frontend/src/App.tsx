import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Loader2 } from "lucide-react";
import Landing from "./pages/Landing";
import KidsLanding from "./pages/KidsLanding";
import TotemsLanding from "./pages/TotemsLanding";
import CustomLanding from "./pages/CustomLanding";
import Shop from "./pages/Shop";
import Index from "./pages/Index";
import Ideas from "./pages/Ideas";
import Diagnostic from "./pages/Diagnostic";
import Application from "./pages/Application";
import Production from "./pages/Production";
// Admin component removed - using lazy loaded admin routes instead
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Oferta from "./pages/Oferta";
import Privacy from "./pages/Privacy";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";
import NotFound from "./pages/NotFound";

// Lazy load admin components for code splitting
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const ApplicationsTab = lazy(() => import("./pages/admin/ApplicationsTab"));
const GenerationsTab = lazy(() => import("./pages/admin/GenerationsTab"));
const SettingsTab = lazy(() => import("./pages/admin/SettingsTab"));
const ClientsTab = lazy(() => import("./components/admin/ClientsTab").then(m => ({ default: m.ClientsTab })));
const OrdersTab = lazy(() => import("./components/admin/OrdersTab").then(m => ({ default: m.OrdersTab })));
const PaymentsTab = lazy(() => import("./components/admin/PaymentsTab").then(m => ({ default: m.PaymentsTab })));
const GemsTab = lazy(() => import("./components/admin/GemsTab").then(m => ({ default: m.GemsTab })));
const ProductsTab = lazy(() => import("./components/admin/ProductsTab").then(m => ({ default: m.ProductsTab })));
const ExamplesTab = lazy(() => import("./components/admin/ExamplesTab").then(m => ({ default: m.ExamplesTab })));

function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
          <Route path="/diagnostic" element={<Diagnostic />} />
          <Route path="/application/:id" element={<Application />} />
          <Route path="/production" element={<Production />} />
          {/* Admin routes with lazy loading */}
          <Route path="/admin" element={
            <Suspense fallback={<AdminLoading />}>
              <AdminLayout />
            </Suspense>
          }>
            <Route path="applications" element={
              <Suspense fallback={<AdminLoading />}>
                <ApplicationsTab />
              </Suspense>
            } />
            <Route path="orders" element={
              <Suspense fallback={<AdminLoading />}>
                <OrdersTab />
              </Suspense>
            } />
            <Route path="clients" element={
              <Suspense fallback={<AdminLoading />}>
                <ClientsTab />
              </Suspense>
            } />
            <Route path="generations" element={
              <Suspense fallback={<AdminLoading />}>
                <GenerationsTab />
              </Suspense>
            } />
            <Route path="payments" element={
              <Suspense fallback={<AdminLoading />}>
                <PaymentsTab />
              </Suspense>
            } />
            <Route path="gems" element={
              <Suspense fallback={<AdminLoading />}>
                <GemsTab />
              </Suspense>
            } />
            <Route path="products" element={
              <Suspense fallback={<AdminLoading />}>
                <ProductsTab />
              </Suspense>
            } />
            <Route path="examples" element={
              <Suspense fallback={<AdminLoading />}>
                <ExamplesTab />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<AdminLoading />}>
                <SettingsTab />
              </Suspense>
            } />
          </Route>
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
