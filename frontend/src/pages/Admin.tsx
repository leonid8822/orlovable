import { useState, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, History, FileText, Image, CreditCard, Users, Package, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminAuth } from '@/components/AdminAuth';

// Lazy load admin tabs to improve initial load time
const ApplicationsTab = lazy(() => import('@/components/admin/ApplicationsTab').then(m => ({ default: m.ApplicationsTab })));
const GenerationsTab = lazy(() => import('@/components/admin/GenerationsTab').then(m => ({ default: m.GenerationsTab })));
const SettingsTab = lazy(() => import('@/components/admin/SettingsTab').then(m => ({ default: m.SettingsTab })));
const ClientsTab = lazy(() => import('@/components/admin/ClientsTab').then(m => ({ default: m.ClientsTab })));
const PaymentsTab = lazy(() => import('@/components/admin/PaymentsTab').then(m => ({ default: m.PaymentsTab })));
const GemsTab = lazy(() => import('@/components/admin/GemsTab').then(m => ({ default: m.GemsTab })));
const ProductsTab = lazy(() => import('@/components/admin/ProductsTab').then(m => ({ default: m.ProductsTab })));
const ExamplesTab = lazy(() => import('@/components/admin/ExamplesTab').then(m => ({ default: m.ExamplesTab })));

// Loading fallback component
const TabLoader = () => (
  <div className="flex justify-center items-center py-20">
    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface SettingsState {
  form_factors: Record<string, { label: string }>;
  materials: Record<string, { label: string }>;
}

const Admin = () => {
  // Settings state for sharing with ApplicationsTab
  const [settings, setSettings] = useState<SettingsState>({
    form_factors: {},
    materials: {},
  });

  const handleSettingsChange = useCallback((newSettings: SettingsState) => {
    setSettings(prev => ({
      ...prev,
      form_factors: newSettings.form_factors || prev.form_factors,
      materials: newSettings.materials || prev.materials,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Админ-панель
              </h1>
              <p className="text-muted-foreground">
                Управление заявками, генерациями и настройками
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-8">
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="h-4 w-4" />
              Заявки
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              Клиенты
            </TabsTrigger>
            <TabsTrigger value="generations" className="gap-2">
              <History className="h-4 w-4" />
              Генерации
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Платежи
            </TabsTrigger>
            <TabsTrigger value="gems" className="gap-2">
              <span className="text-base">💎</span>
              Камни
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Товары
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-2">
              <Image className="h-4 w-4" />
              Примеры
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <ApplicationsTab settings={settings} />
            </Suspense>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <ClientsTab />
            </Suspense>
          </TabsContent>

          {/* Generations Tab */}
          <TabsContent value="generations" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <GenerationsTab />
            </Suspense>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <PaymentsTab />
            </Suspense>
          </TabsContent>

          {/* Gems Tab */}
          <TabsContent value="gems" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <GemsTab />
            </Suspense>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <ProductsTab />
            </Suspense>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <ExamplesTab />
            </Suspense>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Suspense fallback={<TabLoader />}>
              <SettingsTab onSettingsChange={handleSettingsChange} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Wrap with authentication
const AdminWithAuth = () => (
  <AdminAuth>
    <Admin />
  </AdminAuth>
);

export default AdminWithAuth;
