import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, RefreshCw, Package, Search, Factory, ExternalLink, Eye } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_telegram?: string;
  product_type: string;
  material: string;
  size?: string;
  form_factor?: string;
  total_cost?: number;
  quoted_price?: number;
  final_price?: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

const ORDER_STATUSES = [
  { value: 'new', label: 'Новый', color: 'bg-blue-500' },
  { value: 'design', label: 'Дизайн', color: 'bg-purple-500' },
  { value: 'modeling', label: '3D Модель', color: 'bg-indigo-500' },
  { value: 'printing', label: '3D Печать', color: 'bg-cyan-500' },
  { value: 'casting', label: 'Литьё', color: 'bg-orange-500' },
  { value: 'polishing', label: 'Полировка', color: 'bg-yellow-500' },
  { value: 'assembly', label: 'Сборка', color: 'bg-pink-500' },
  { value: 'ready', label: 'Готов', color: 'bg-green-500' },
  { value: 'shipped', label: 'Отправлен', color: 'bg-teal-500' },
  { value: 'delivered', label: 'Доставлен', color: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Отменён', color: 'bg-red-500' },
];

const PRODUCT_TYPES = [
  { value: 'pendant', label: 'Кулон' },
  { value: 'bracelet', label: 'Браслет' },
  { value: 'ring', label: 'Кольцо' },
  { value: 'earrings', label: 'Серьги' },
  { value: 'brooch', label: 'Брошь' },
  { value: 'other', label: 'Другое' },
];

const MATERIALS = [
  { value: 'silver', label: 'Серебро 925' },
  { value: 'gold', label: 'Золото 585' },
  { value: 'gold_white', label: 'Белое золото' },
  { value: 'platinum', label: 'Платина' },
];

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create order dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_telegram: '',
    product_type: 'pendant',
    material: 'silver',
    size: 'm',
    special_requirements: '',
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.adminGetOrders();
    if (error) {
      console.error('Failed to load orders:', error);
      toast.error('Ошибка загрузки заказов');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name.trim()) {
      toast.error('Введите имя клиента');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await api.adminCreateOrder(newOrder);
      if (error) throw error;

      toast.success('Заказ создан');
      setCreateDialogOpen(false);
      setNewOrder({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_telegram: '',
        product_type: 'pendant',
        material: 'silver',
        size: 'm',
        special_requirements: '',
      });
      loadOrders();
    } catch (e) {
      toast.error('Ошибка создания заказа');
    }
    setCreating(false);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || { label: status, color: 'bg-gray-500' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Заказы</h2>
          <Badge variant="outline">{orders.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/production">
            <Button variant="outline" className="gap-2">
              <Factory className="w-4 h-4" />
              Production Workspace
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={loadOrders}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Новый заказ
          </Button>
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold">
            {orders.filter(o => o.status === 'new').length}
          </div>
          <div className="text-sm text-muted-foreground">Новых</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold">
            {orders.filter(o => ['design', 'modeling', 'printing', 'casting', 'polishing', 'assembly'].includes(o.status)).length}
          </div>
          <div className="text-sm text-muted-foreground">В работе</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold">
            {orders.filter(o => o.status === 'ready').length}
          </div>
          <div className="text-sm text-muted-foreground">Готовых</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold">
            {formatPrice(orders.reduce((sum, o) => sum + (o.final_price || o.quoted_price || 0), 0))}
          </div>
          <div className="text-sm text-muted-foreground">Сумма</div>
        </div>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Загрузка...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Заказов не найдено</p>
          <p className="text-sm mt-2">Создайте первый заказ или перейдите в Production Workspace</p>
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
                <TableHead className="text-right">Цена</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">
                        {order.order_number || order.id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customer_email || order.customer_telegram || order.customer_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {PRODUCT_TYPES.find(t => t.value === order.product_type)?.label || order.product_type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {MATERIALS.find(m => m.value === order.material)?.label || order.material}
                        {order.size && `, ${order.size.toUpperCase()}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(order.final_price || order.quoted_price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.created_at), 'd MMM', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <Link to="/production">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateOrder} disabled={creating}>
              {creating ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
