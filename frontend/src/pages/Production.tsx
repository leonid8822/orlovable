import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Box,
  Search,
  Loader2,
  Mail,
  Lock,
  Factory,
  Calculator,
  TrendingUp,
  Package,
  FileImage,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Truck,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Types
interface Order {
  id: string;
  order_number: string | null;
  status: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_telegram: string | null;
  product_type: string;
  material: string;
  size: string | null;
  form_factor: string | null;
  reference_images: string[];
  generated_images: string[];
  model_3d_url: string | null;
  final_photos: string[];
  production_artifacts: string[];
  // Production costs
  printing_cost: number;
  printing_weight_g: number | null;
  printing_notes: string | null;
  metal_weight_g: number | null;
  metal_price_per_g: number | null;
  metal_cost: number;
  casting_cost: number;
  casting_notes: string | null;
  polishing_cost: number;
  plating_cost: number;
  plating_type: string | null;
  gems_cost: number;
  gems_setting_cost: number;
  gems_details: Array<{ name: string; count: number; price_each: number }>;
  chain_type: string | null;
  chain_length_cm: number | null;
  chain_cost: number;
  packaging_cost: number;
  engraving_cost: number;
  other_costs: number;
  other_costs_notes: string | null;
  labor_hours: number | null;
  labor_rate_per_hour: number | null;
  labor_cost: number;
  total_cost: number;
  margin_percent: number | null;
  calculated_price: number | null;
  // Client pricing
  quoted_price: number | null;
  deposit_amount: number | null;
  deposit_paid_at: string | null;
  final_price: number | null;
  final_paid_at: string | null;
  currency: string;
  // Production details
  gems_config: any[];
  engraving_text: string | null;
  special_requirements: string | null;
  internal_notes: string | null;
  // Delivery
  delivery_address: string | null;
  delivery_service: string | null;
  tracking_number: string | null;
  delivery_cost: number;
  // Timestamps
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

const ORDER_STATUSES = [
  { value: "new", label: "Новый", color: "bg-blue-500" },
  { value: "design", label: "Дизайн", color: "bg-purple-500" },
  { value: "modeling", label: "3D Модель", color: "bg-indigo-500" },
  { value: "printing", label: "3D Печать", color: "bg-cyan-500" },
  { value: "casting", label: "Литьё", color: "bg-orange-500" },
  { value: "polishing", label: "Полировка", color: "bg-yellow-500" },
  { value: "assembly", label: "Сборка", color: "bg-pink-500" },
  { value: "ready", label: "Готов", color: "bg-green-500" },
  { value: "shipped", label: "Отправлен", color: "bg-teal-500" },
  { value: "delivered", label: "Доставлен", color: "bg-emerald-500" },
  { value: "cancelled", label: "Отменён", color: "bg-red-500" },
];

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Production() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit dialog
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsCheckingAuth(true);
    try {
      const { data, error } = await api.productionVerifySession();
      if (!error && data?.is_production) {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    }
    setIsCheckingAuth(false);
  };

  // Request verification code
  const handleRequestCode = async () => {
    if (!email.trim()) {
      toast.error("Введите email");
      return;
    }

    setIsRequestingCode(true);
    try {
      const { error } = await api.productionRequestCode(email.trim());
      if (error) {
        toast.error("Ошибка отправки кода");
      } else {
        setCodeSent(true);
        toast.success("Код отправлен на email");
      }
    } catch (e) {
      toast.error("Ошибка отправки кода");
    }
    setIsRequestingCode(false);
  };

  // Verify code
  const handleVerifyCode = async () => {
    if (!code.trim()) {
      toast.error("Введите код");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await api.productionVerifyCode(email.trim(), code.trim());
      if (error) {
        toast.error("Неверный код или нет доступа");
      } else if (data?.success) {
        setIsAuthenticated(true);
        toast.success("Добро пожаловать!");
        loadOrders();
      } else {
        toast.error("Нет доступа к Production");
      }
    } catch (e) {
      toast.error("Ошибка верификации");
    }
    setIsVerifying(false);
  };

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.adminGetOrders();
    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, loadOrders]);

  // Open order for editing
  const openEditDialog = (order: Order) => {
    setEditingOrder({ ...order });
    setDialogOpen(true);
  };

  // Update order field
  const updateOrderField = (field: keyof Order, value: any) => {
    if (!editingOrder) return;
    setEditingOrder({ ...editingOrder, [field]: value });
  };

  // Calculate total cost
  const calculateTotalCost = (order: Order): number => {
    return (
      (order.printing_cost || 0) +
      (order.metal_cost || 0) +
      (order.casting_cost || 0) +
      (order.polishing_cost || 0) +
      (order.plating_cost || 0) +
      (order.gems_cost || 0) +
      (order.gems_setting_cost || 0) +
      (order.chain_cost || 0) +
      (order.packaging_cost || 0) +
      (order.engraving_cost || 0) +
      (order.other_costs || 0) +
      (order.labor_cost || 0) +
      (order.delivery_cost || 0)
    );
  };

  // Save order
  const handleSave = async () => {
    if (!editingOrder) return;
    setSaving(true);

    // Calculate total cost before saving
    const totalCost = calculateTotalCost(editingOrder);
    const dataToSave = {
      ...editingOrder,
      total_cost: totalCost,
    };

    const { error } = await api.adminUpdateOrder(editingOrder.id, dataToSave);
    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      toast.success("Заказ обновлён");
      setDialogOpen(false);
      loadOrders();
    }
    setSaving(false);
  };

  // Upload file
  const handleFileUpload = async (
    orderId: string,
    file: File,
    type: "reference" | "artifact" | "model" | "final"
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/admin/orders/${orderId}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      // Update local state
      if (editingOrder && editingOrder.id === orderId) {
        if (type === "reference") {
          updateOrderField("reference_images", [...(editingOrder.reference_images || []), data.url]);
        } else if (type === "artifact") {
          updateOrderField("production_artifacts", [...(editingOrder.production_artifacts || []), data.url]);
        } else if (type === "model") {
          updateOrderField("model_3d_url", data.url);
        } else if (type === "final") {
          updateOrderField("final_photos", [...(editingOrder.final_photos || []), data.url]);
        }
      }

      toast.success("Файл загружен");
    } catch (e) {
      toast.error("Ошибка загрузки файла");
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Factory className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Production Workspace</CardTitle>
            <p className="text-muted-foreground mt-2">
              Войдите для доступа к производственному воркспейсу
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {codeSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Код из письма</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="pl-10"
                      maxLength={6}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyCode}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Войти
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setCodeSent(false)}
                >
                  Изменить email
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={handleRequestCode}
                disabled={isRequestingCode}
              >
                {isRequestingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Получить код
              </Button>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">
                Вернуться на главную
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main production workspace
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
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Factory className="h-8 w-8" />
                Production Workspace
              </h1>
              <p className="text-muted-foreground">
                Управление производством заказов
              </p>
            </div>
          </div>
          <Button onClick={loadOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {orders.filter((o) => o.status === "new").length}
              </div>
              <div className="text-sm text-muted-foreground">Новых</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {orders.filter((o) => ["design", "modeling", "printing", "casting", "polishing", "assembly"].includes(o.status)).length}
              </div>
              <div className="text-sm text-muted-foreground">В работе</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {orders.filter((o) => o.status === "ready").length}
              </div>
              <div className="text-sm text-muted-foreground">Готовых</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {formatPrice(orders.reduce((sum, o) => sum + (o.total_cost || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Себестоимость</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру, имени, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Заказов не найдено</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заказ</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Изделие</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Себестоимость</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusInfo = ORDER_STATUSES.find((s) => s.value === order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">
                          {order.order_number || order.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.customer_email || order.customer_telegram}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{order.product_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.material}, {order.size}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo?.color}>
                          {statusInfo?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(order.total_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(order.final_price || order.quoted_price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              {editingOrder?.order_number || "Заказ"}
              {editingOrder && (
                <Badge className={ORDER_STATUSES.find((s) => s.value === editingOrder.status)?.color}>
                  {ORDER_STATUSES.find((s) => s.value === editingOrder.status)?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {editingOrder && (
            <Tabs defaultValue="production" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="files" className="gap-1">
                  <FileImage className="h-4 w-4" />
                  <span className="hidden sm:inline">Файлы</span>
                </TabsTrigger>
                <TabsTrigger value="production" className="gap-1">
                  <Factory className="h-4 w-4" />
                  <span className="hidden sm:inline">Производство</span>
                </TabsTrigger>
                <TabsTrigger value="pricing" className="gap-1">
                  <Calculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Цены</span>
                </TabsTrigger>
                <TabsTrigger value="customer" className="gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Клиент</span>
                </TabsTrigger>
                <TabsTrigger value="status" className="gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Статус</span>
                </TabsTrigger>
              </TabsList>

              {/* Files Tab */}
              <TabsContent value="files" className="space-y-6 mt-4">
                {/* Reference Images */}
                <div className="space-y-3">
                  <Label>Референсы</Label>
                  <div className="flex flex-wrap gap-2">
                    {(editingOrder.reference_images || []).map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`ref-${i}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newImages = [...editingOrder.reference_images];
                            newImages.splice(i, 1);
                            updateOrderField("reference_images", newImages);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(editingOrder.id, file, "reference");
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* 3D Model */}
                <div className="space-y-3">
                  <Label>3D Модель</Label>
                  {editingOrder.model_3d_url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={editingOrder.model_3d_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {editingOrder.model_3d_url.split("/").pop()}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateOrderField("model_3d_url", null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="block">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить STL/OBJ
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".stl,.obj,.glb,.gltf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(editingOrder.id, file, "model");
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Production Artifacts */}
                <div className="space-y-3">
                  <Label>Артефакты производства</Label>
                  <div className="flex flex-wrap gap-2">
                    {(editingOrder.production_artifacts || []).map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`artifact-${i}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newImages = [...editingOrder.production_artifacts];
                            newImages.splice(i, 1);
                            updateOrderField("production_artifacts", newImages);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(editingOrder.id, file, "artifact");
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Final Photos */}
                <div className="space-y-3">
                  <Label>Финальные фото</Label>
                  <div className="flex flex-wrap gap-2">
                    {(editingOrder.final_photos || []).map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`final-${i}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newImages = [...editingOrder.final_photos];
                            newImages.splice(i, 1);
                            updateOrderField("final_photos", newImages);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(editingOrder.id, file, "final");
                        }}
                      />
                    </label>
                  </div>
                </div>
              </TabsContent>

              {/* Production Tab */}
              <TabsContent value="production" className="space-y-6 mt-4">
                {/* 3D Printing */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">3D Печать</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Стоимость печати (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.printing_cost || ""}
                        onChange={(e) => updateOrderField("printing_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Вес печати (г)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={editingOrder.printing_weight_g || ""}
                        onChange={(e) => updateOrderField("printing_weight_g", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Заметки</Label>
                      <Textarea
                        value={editingOrder.printing_notes || ""}
                        onChange={(e) => updateOrderField("printing_notes", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Metal & Casting */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Металл и литьё</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Вес металла (г)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={editingOrder.metal_weight_g || ""}
                        onChange={(e) => updateOrderField("metal_weight_g", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Цена за грамм (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.metal_price_per_g || ""}
                        onChange={(e) => updateOrderField("metal_price_per_g", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Стоимость металла (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.metal_cost || ""}
                        onChange={(e) => updateOrderField("metal_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Стоимость литья (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.casting_cost || ""}
                        onChange={(e) => updateOrderField("casting_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Заметки по литью</Label>
                      <Textarea
                        value={editingOrder.casting_notes || ""}
                        onChange={(e) => updateOrderField("casting_notes", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Finishing */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Финишная обработка</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Полировка (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.polishing_cost || ""}
                        onChange={(e) => updateOrderField("polishing_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Покрытие (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.plating_cost || ""}
                        onChange={(e) => updateOrderField("plating_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Тип покрытия</Label>
                      <Input
                        value={editingOrder.plating_type || ""}
                        onChange={(e) => updateOrderField("plating_type", e.target.value)}
                        placeholder="Родий, позолота..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Гравировка (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.engraving_cost || ""}
                        onChange={(e) => updateOrderField("engraving_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Gems */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Камни</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Стоимость камней (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.gems_cost || ""}
                        onChange={(e) => updateOrderField("gems_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Закрепка камней (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.gems_setting_cost || ""}
                        onChange={(e) => updateOrderField("gems_setting_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Chain & Other */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Цепочка и другое</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Тип цепочки</Label>
                      <Input
                        value={editingOrder.chain_type || ""}
                        onChange={(e) => updateOrderField("chain_type", e.target.value)}
                        placeholder="Якорная, панцирная..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Длина (см)</Label>
                      <Input
                        type="number"
                        value={editingOrder.chain_length_cm || ""}
                        onChange={(e) => updateOrderField("chain_length_cm", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Стоимость цепочки (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.chain_cost || ""}
                        onChange={(e) => updateOrderField("chain_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Упаковка (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.packaging_cost || ""}
                        onChange={(e) => updateOrderField("packaging_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Прочие расходы (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.other_costs || ""}
                        onChange={(e) => updateOrderField("other_costs", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Описание прочих расходов</Label>
                      <Input
                        value={editingOrder.other_costs_notes || ""}
                        onChange={(e) => updateOrderField("other_costs_notes", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Labor */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Работа</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Часы работы</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editingOrder.labor_hours || ""}
                        onChange={(e) => updateOrderField("labor_hours", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ставка (₽/час)</Label>
                      <Input
                        type="number"
                        value={editingOrder.labor_rate_per_hour || ""}
                        onChange={(e) => updateOrderField("labor_rate_per_hour", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Стоимость работы (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.labor_cost || ""}
                        onChange={(e) => updateOrderField("labor_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-6 mt-4">
                {/* Cost Summary */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Итого себестоимость
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(calculateTotalCost(editingOrder))}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>3D печать:</span>
                        <span>{formatPrice(editingOrder.printing_cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Металл + литьё:</span>
                        <span>{formatPrice((editingOrder.metal_cost || 0) + (editingOrder.casting_cost || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Обработка:</span>
                        <span>{formatPrice((editingOrder.polishing_cost || 0) + (editingOrder.plating_cost || 0) + (editingOrder.engraving_cost || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Камни:</span>
                        <span>{formatPrice((editingOrder.gems_cost || 0) + (editingOrder.gems_setting_cost || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Цепочка + упаковка:</span>
                        <span>{formatPrice((editingOrder.chain_cost || 0) + (editingOrder.packaging_cost || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Работа:</span>
                        <span>{formatPrice(editingOrder.labor_cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Доставка:</span>
                        <span>{formatPrice(editingOrder.delivery_cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Прочее:</span>
                        <span>{formatPrice(editingOrder.other_costs)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Pricing */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Цены для клиента</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Озвученная цена (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.quoted_price || ""}
                        onChange={(e) => updateOrderField("quoted_price", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Финальная цена (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.final_price || ""}
                        onChange={(e) => updateOrderField("final_price", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Предоплата (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.deposit_amount || ""}
                        onChange={(e) => updateOrderField("deposit_amount", parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Маржа (%)</Label>
                      <Input
                        type="number"
                        value={editingOrder.margin_percent || ""}
                        onChange={(e) => updateOrderField("margin_percent", parseFloat(e.target.value) || null)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Profit Summary */}
                {editingOrder.final_price && (
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Прибыль</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice((editingOrder.final_price || 0) - calculateTotalCost(editingOrder))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Маржа: {(((editingOrder.final_price || 0) - calculateTotalCost(editingOrder)) / (editingOrder.final_price || 1) * 100).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Customer Tab */}
              <TabsContent value="customer" className="space-y-6 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Контакты</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Имя
                      </Label>
                      <Input
                        value={editingOrder.customer_name || ""}
                        onChange={(e) => updateOrderField("customer_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={editingOrder.customer_email || ""}
                        onChange={(e) => updateOrderField("customer_email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Телефон
                      </Label>
                      <Input
                        value={editingOrder.customer_phone || ""}
                        onChange={(e) => updateOrderField("customer_phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Telegram
                      </Label>
                      <Input
                        value={editingOrder.customer_telegram || ""}
                        onChange={(e) => updateOrderField("customer_telegram", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Доставка
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Адрес
                      </Label>
                      <Textarea
                        value={editingOrder.delivery_address || ""}
                        onChange={(e) => updateOrderField("delivery_address", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Служба доставки</Label>
                        <Input
                          value={editingOrder.delivery_service || ""}
                          onChange={(e) => updateOrderField("delivery_service", e.target.value)}
                          placeholder="СДЭК, Почта России..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Трек-номер</Label>
                        <Input
                          value={editingOrder.tracking_number || ""}
                          onChange={(e) => updateOrderField("tracking_number", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Стоимость доставки (₽)</Label>
                      <Input
                        type="number"
                        value={editingOrder.delivery_cost || ""}
                        onChange={(e) => updateOrderField("delivery_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Заметки</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Особые требования</Label>
                      <Textarea
                        value={editingOrder.special_requirements || ""}
                        onChange={(e) => updateOrderField("special_requirements", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Внутренние заметки</Label>
                      <Textarea
                        value={editingOrder.internal_notes || ""}
                        onChange={(e) => updateOrderField("internal_notes", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-6 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Статус заказа</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={editingOrder.status}
                      onValueChange={(value) => updateOrderField("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${s.color}`} />
                              {s.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Даты</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Создан:</span>
                      <span>{formatDate(editingOrder.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Обновлён:</span>
                      <span>{formatDate(editingOrder.updated_at)}</span>
                    </div>
                    {editingOrder.started_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Начат:</span>
                        <span>{formatDate(editingOrder.started_at)}</span>
                      </div>
                    )}
                    {editingOrder.completed_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Завершён:</span>
                        <span>{formatDate(editingOrder.completed_at)}</span>
                      </div>
                    )}
                    {editingOrder.shipped_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Отправлен:</span>
                        <span>{formatDate(editingOrder.shipped_at)}</span>
                      </div>
                    )}
                    {editingOrder.delivered_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Доставлен:</span>
                        <span>{formatDate(editingOrder.delivered_at)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
