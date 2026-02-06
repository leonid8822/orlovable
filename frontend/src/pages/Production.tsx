import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  Mail,
  Lock,
  Factory,
  RefreshCw,
  Plus,
  Package,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/production/KanbanBoard";
import { OrderDetailModal } from "@/components/production/OrderDetailModal";

// Types
interface Order {
  id: string;
  order_number?: string;
  status: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_telegram?: string;
  product_type: string;
  material: string;
  size?: string;
  form_factor?: string;
  reference_images?: string[];
  generated_images?: string[];
  final_photos?: string[];
  stage_photos?: Record<string, string[]>;
  final_price?: number;
  quoted_price?: number;
  total_cost?: number;
  printing_cost?: number;
  metal_cost?: number;
  casting_cost?: number;
  polishing_cost?: number;
  gems_cost?: number;
  chain_cost?: number;
  labor_cost?: number;
  packaging_cost?: number;
  other_costs?: number;
  engraving_text?: string;
  special_requirements?: string;
  internal_notes?: string;
  created_at: string;
  status_entered_at?: string;
  time_in_status_seconds?: number;
  status_durations?: Record<string, number>;
}

interface Status {
  value: string;
  label: string;
  color: string;
}

interface Metrics {
  total_orders: number;
  orders_new: number;
  orders_in_progress: number;
  orders_ready: number;
  orders_completed: number;
  orders_by_status: Record<string, number>;
  total_revenue: number;
  total_cost: number;
  profit: number;
  avg_completion_time_seconds: number;
}

const PRODUCT_TYPES = [
  { value: "pendant", label: "Кулон" },
  { value: "bracelet", label: "Браслет" },
  { value: "ring", label: "Кольцо" },
  { value: "earrings", label: "Серьги" },
  { value: "brooch", label: "Брошь" },
  { value: "other", label: "Другое" },
];

const MATERIALS = [
  { value: "silver", label: "Серебро 925" },
  { value: "gold", label: "Золото 585" },
  { value: "gold_white", label: "Белое золото" },
  { value: "platinum", label: "Платина" },
];

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}ч`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days}д`;
}

export default function Production() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Data state
  const [kanban, setKanban] = useState<Record<string, Order[]>>({});
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New order form
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_telegram: "",
    product_type: "pendant",
    material: "silver",
    size: "m",
    special_requirements: "",
  });

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsCheckingAuth(true);
    try {
      const token = localStorage.getItem("production_session");
      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      const { data, error } = await api.productionVerifySession();
      if (error || !data?.is_production) {
        localStorage.removeItem("production_session");
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
    setIsCheckingAuth(false);
  };

  const handleRequestCode = async () => {
    if (!email.trim()) {
      toast.error("Введите email");
      return;
    }
    setIsLoggingIn(true);
    try {
      const { error } = await api.productionRequestCode(email);
      if (error) throw error;
      setCodeSent(true);
      toast.success("Код отправлен на email");
    } catch (e) {
      toast.error("Ошибка отправки кода");
    }
    setIsLoggingIn(false);
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      toast.error("Введите код");
      return;
    }
    setIsLoggingIn(true);
    try {
      const { data, error } = await api.productionVerifyCode(email, code);
      if (error) throw error;
      if (data?.token) {
        localStorage.setItem("production_session", data.token);
        setIsAuthenticated(true);
        toast.success("Вход выполнен");
      }
    } catch (e) {
      toast.error("Неверный код");
    }
    setIsLoggingIn(false);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load kanban and metrics in parallel
      const [kanbanRes, metricsRes] = await Promise.all([
        api.productionGetKanban(),
        api.productionGetMetrics(),
      ]);

      if (kanbanRes.error) throw kanbanRes.error;
      if (metricsRes.error) throw metricsRes.error;

      setKanban(kanbanRes.data?.kanban || {});
      setStatuses(kanbanRes.data?.statuses || []);
      setMetrics(metricsRes.data || null);
    } catch (e) {
      console.error("Failed to load data:", e);
      toast.error("Ошибка загрузки данных");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleMoveOrder = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await api.productionMoveOrder(orderId, newStatus);
      if (error) throw error;

      // Optimistically update the UI
      setKanban((prev) => {
        const newKanban = { ...prev };

        // Find and remove order from old status
        for (const status in newKanban) {
          const idx = newKanban[status].findIndex((o) => o.id === orderId);
          if (idx !== -1) {
            const [order] = newKanban[status].splice(idx, 1);
            // Add to new status
            if (!newKanban[newStatus]) newKanban[newStatus] = [];
            newKanban[newStatus].unshift({ ...order, status: newStatus });
            break;
          }
        }

        return newKanban;
      });

      toast.success("Статус обновлён");
    } catch (e) {
      toast.error("Ошибка обновления статуса");
      // Reload data on error
      loadData();
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name.trim()) {
      toast.error("Введите имя клиента");
      return;
    }

    setCreating(true);
    try {
      const { error } = await api.adminCreateOrder(newOrder);
      if (error) throw error;

      toast.success("Заказ создан");
      setCreateOrderOpen(false);
      setNewOrder({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_telegram: "",
        product_type: "pendant",
        material: "silver",
        size: "m",
        special_requirements: "",
      });
      loadData();
    } catch (e) {
      toast.error("Ошибка создания заказа");
    }
    setCreating(false);
  };

  // Filter orders by search
  const filteredKanban = searchQuery
    ? Object.fromEntries(
        Object.entries(kanban).map(([status, orders]) => [
          status,
          orders.filter(
            (o) =>
              o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        ])
      )
    : kanban;

  // Auth screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Factory className="w-12 h-12 mx-auto text-primary mb-4" />
              <h1 className="text-2xl font-bold">Production Workspace</h1>
              <p className="text-muted-foreground">Вход для сотрудников</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={codeSent}
                  />
                </div>
              </div>

              {codeSent && (
                <div className="space-y-2">
                  <Label htmlFor="code">Код подтверждения</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="pl-10"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={codeSent ? handleVerifyCode : handleRequestCode}
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {codeSent ? "Войти" : "Получить код"}
              </Button>

              {codeSent && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                  }}
                >
                  Изменить email
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Factory className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Production</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>

              <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>

              <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Новый заказ</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics */}
      {metrics && (
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Package className="w-4 h-4" />
                  Новых
                </div>
                <div className="text-2xl font-bold">{metrics.orders_new}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="w-4 h-4" />
                  В работе
                </div>
                <div className="text-2xl font-bold">{metrics.orders_in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Package className="w-4 h-4" />
                  Готовых
                </div>
                <div className="text-2xl font-bold">{metrics.orders_ready}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="w-4 h-4" />
                  Выручка
                </div>
                <div className="text-2xl font-bold">{formatPrice(metrics.total_revenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  Ср. время
                </div>
                <div className="text-2xl font-bold">
                  {formatDuration(metrics.avg_completion_time_seconds)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="container mx-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <KanbanBoard
            kanban={filteredKanban}
            statuses={statuses}
            onMoveOrder={handleMoveOrder}
            onOrderClick={handleOrderClick}
          />
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        statuses={statuses}
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onStatusChange={handleMoveOrder}
        onRefresh={loadData}
      />

      {/* Create Order Dialog */}
      <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новый заказ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Имя клиента *</Label>
              <Input
                id="customer_name"
                value={newOrder.customer_name}
                onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                placeholder="Иван Иванов"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={newOrder.customer_email}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Телефон</Label>
                <Input
                  id="customer_phone"
                  value={newOrder.customer_phone}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                  placeholder="+7 999 123 45 67"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_telegram">Telegram</Label>
              <Input
                id="customer_telegram"
                value={newOrder.customer_telegram}
                onChange={(e) => setNewOrder({ ...newOrder, customer_telegram: e.target.value })}
                placeholder="@username"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип изделия</Label>
                <Select
                  value={newOrder.product_type}
                  onValueChange={(v) => setNewOrder({ ...newOrder, product_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Материал</Label>
                <Select
                  value={newOrder.material}
                  onValueChange={(v) => setNewOrder({ ...newOrder, material: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Размер</Label>
              <Select
                value={newOrder.size}
                onValueChange={(v) => setNewOrder({ ...newOrder, size: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s">S</SelectItem>
                  <SelectItem value="m">M</SelectItem>
                  <SelectItem value="l">L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOrderOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateOrder} disabled={creating}>
              {creating ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
