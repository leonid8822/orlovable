import { Suspense } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Box,
  Users,
  History,
  CreditCard,
  Package,
  Image,
  Settings,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'applications', label: 'Заявки', icon: FileText },
  { id: 'orders', label: 'Заказы', icon: Box },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'generations', label: 'Генерации', icon: History },
  { id: 'payments', label: 'Платежи', icon: CreditCard },
  { id: 'gems', label: 'Камни', icon: () => <span className="text-base">💎</span> },
  { id: 'products', label: 'Товары', icon: Package },
  { id: 'examples', label: 'Примеры', icon: Image },
  { id: 'settings', label: 'Настройки', icon: Settings },
] as const;

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const currentTab = location.pathname.split('/admin/')[1] || 'applications';

  // Redirect /admin to /admin/applications
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to="/admin/applications" replace />;
  }

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

        {/* Navigation */}
        <nav className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Link key={id} to={`/admin/${id}`}>
              <Button
                variant={currentTab === id ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'gap-2',
                  currentTab === id && 'bg-background shadow-sm'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Content */}
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
