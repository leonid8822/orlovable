import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  UserPlus,
  User,
  Check,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
    user_id: "" as string,
  });

  // Client selector state
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [clientSearching, setClientSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    email: "",
    name: "",
    telegram_username: "",
  });
  const [creatingClient, setCreatingClient] = useState(false);
  const clientSearchTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // Client search with debounce
  useEffect(() => {
    if (clientSearchTimeout.current) {
      clearTimeout(clientSearchTimeout.current);
    }

    if (clientSearch.length < 2) {
      setClientResults([]);
      return;
    }

    setClientSearching(true);
    clientSearchTimeout.current = setTimeout(async () => {
      const { data, error } = await api.searchClients(clientSearch);
      setClientSearching(false);
      if (error) {
        console.error("Client search error:", error);
        return;
      }
      setClientResults(data?.clients || []);
    }, 300);

    return () => {
      if (clientSearchTimeout.current) {
        clearTimeout(clientSearchTimeout.current);
      }
    };
  }, [clientSearch]);

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    const displayName = client.first_name || client.last_name
      ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
      : client.name || client.email.split("@")[0];

    setNewOrder((prev) => ({
      ...prev,
      customer_name: displayName,
      customer_email: client.email || "",
      customer_telegram: client.telegram_username || "",
      user_id: client.id,
    }));
    setClientSearch("");
    setClientResults([]);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setNewOrder((prev) => ({
      ...prev,
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_telegram: "",
      user_id: "",
    }));
  };

  const handleCreateClient = async () => {
    if (!newClientData.email.trim()) {
      toast.error("Email обязателен");
      return;
    }

    setCreatingClient(true);
    try {
      const { data, error } = await api.createClient(newClientData);
      if (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка создания клиента");
        return;
      }

      toast.success("Клиент создан");
      // Auto-select the newly created client
      handleSelectClient(data);
      setShowCreateClient(false);
      setNewClientData({ email: "", name: "", telegram_username: "" });
    } catch (e) {
      toast.error("Ошибка создания клиента");
    }
    setCreatingClient(false);
  };

  const resetCreateOrderDialog = () => {
    setNewOrder({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_telegram: "",
      product_type: "pendant",
      material: "silver",
      size: "m",
      special_requirements: "",
      user_id: "",
    });
    setSelectedClient(null);
    setClientSearch("");
    setClientResults([]);
    setShowCreateClient(false);
    setNewClientData({ email: "", name: "", telegram_username: "" });
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name.trim()) {
      toast.error("Введите имя клиента");
      return;
    }

    setCreating(true);
    try {
      const orderPayload: any = { ...newOrder };
      // Don't send empty user_id
      if (!orderPayload.user_id) {
        delete orderPayload.user_id;
      }

      const { error } = await api.adminCreateOrder(orderPayload);
      if (error) throw error;

      toast.success("Заказ создан");
      setCreateOrderOpen(false);
      resetCreateOrderDialog();
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
      <Dialog open={createOrderOpen} onOpenChange={(open) => {
        setCreateOrderOpen(open);
        if (!open) resetCreateOrderDialog();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый заказ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Client Selector Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Клиент *
              </Label>

              {selectedClient ? (
                /* Selected client display */
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{newOrder.customer_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{newOrder.customer_email}</p>
                    {newOrder.customer_telegram && (
                      <p className="text-xs text-muted-foreground truncate">{newOrder.customer_telegram}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleClearClient}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : showCreateClient ? (
                /* Create new client form */
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      Новый клиент
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateClient(false)}
                    >
                      Назад
                    </Button>
                  </div>
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  />
                  <Input
                    placeholder="Имя"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  />
                  <Input
                    placeholder="@telegram"
                    value={newClientData.telegram_username}
                    onChange={(e) => setNewClientData({ ...newClientData, telegram_username: e.target.value })}
                  />
                  <Button
                    type="button"
                    onClick={handleCreateClient}
                    disabled={creatingClient || !newClientData.email.trim()}
                    className="w-full"
                    size="sm"
                  >
                    {creatingClient ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Создать и выбрать
                  </Button>
                </div>
              ) : (
                /* Client search */
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по email, имени, telegram..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Search results dropdown */}
                  {(clientSearching || clientResults.length > 0 || clientSearch.length >= 2) && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {clientSearching ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : clientResults.length > 0 ? (
                        <div className="divide-y">
                          {clientResults.map((client: any) => {
                            const displayName = client.first_name || client.last_name
                              ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                              : client.name || client.email.split("@")[0];
                            return (
                              <button
                                key={client.id}
                                type="button"
                                className="w-full p-2.5 text-left hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelectClient(client)}
                              >
                                <p className="text-sm font-medium">{displayName}</p>
                                <p className="text-xs text-muted-foreground">{client.email}</p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          Клиент не найден
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create new client button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setShowCreateClient(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Создать нового клиента
                  </Button>
                </div>
              )}
            </div>

            {/* Customer details (editable when client selected or manual entry) */}
            {(selectedClient || showCreateClient === false) && !showCreateClient && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Имя клиента *</Label>
                  <Input
                    id="customer_name"
                    value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                    placeholder="Иван Иванов"
                    disabled={!!selectedClient}
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
                      disabled={!!selectedClient}
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
                    disabled={!!selectedClient}
                  />
                </div>
              </>
            )}

            {/* Product details */}
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

            <div className="space-y-2">
              <Label htmlFor="special_requirements">Описание / Договорённости</Label>
              <Textarea
                id="special_requirements"
                value={newOrder.special_requirements}
                onChange={(e) => setNewOrder({ ...newOrder, special_requirements: e.target.value })}
                placeholder="Описание изделия, пожелания клиента, договорённости..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateOrderOpen(false);
              resetCreateOrderDialog();
            }}>
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
