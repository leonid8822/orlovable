import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, RefreshCw, Package, Trash2, Eye, Edit2, Clock, CheckCircle2, Truck, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  quoted_price?: number;
  final_price?: number;
  currency: string;
  special_requirements?: string;
  internal_notes?: string;
  reference_images?: string[];
  generated_images?: string[];
  model_3d_url?: string;
  final_photos?: string[];
  gems_config?: any[];
  engraving_text?: string;
  delivery_address?: string;
  delivery_service?: string;
  tracking_number?: string;
  application_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface OrderHistory {
  id: string;
  status: string;
  comment?: string;
  changed_by: string;
  created_at: string;
}

const ORDER_STATUSES = [
  { value: 'new', label: 'Новый', color: 'bg-blue-500', icon: Package },
  { value: 'design', label: 'Дизайн', color: 'bg-purple-500', icon: Edit2 },
  { value: 'modeling', label: '3D моделирование', color: 'bg-indigo-500', icon: Box },
  { value: 'production', label: 'Производство', color: 'bg-orange-500', icon: Clock },
  { value: 'ready', label: 'Готово', color: 'bg-green-500', icon: CheckCircle2 },
  { value: 'shipped', label: 'Отгружено', color: 'bg-cyan-500', icon: Truck },
  { value: 'delivered', label: 'Доставлено', color: 'bg-emerald-500', icon: CheckCircle2 },
  { value: 'cancelled', label: 'Отменён', color: 'bg-gray-500', icon: Trash2 },
];

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state for new order
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_telegram: '',
    product_type: 'pendant',
    material: 'silver',
    size: 'm',
    form_factor: 'round',
    quoted_price: '',
    special_requirements: '',
    internal_notes: '',
  });

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const { data, error } = await api.adminGetOrders(params);
      if (error) {
        toast.error('Ошибка загрузки заказов');
        console.error(error);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      toast.error('Ошибка загрузки заказов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderHistory = async (orderId: string) => {
    try {
      const { data, error } = await api.adminGetOrderHistory(orderId);
      if (error) {
        console.error(error);
      } else {
        setOrderHistory(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        ...formData,
        quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : undefined,
      };

      const { data, error } = await api.adminCreateOrder(orderData);
      if (error) {
        toast.error('Ошибка создания заказа');
        console.error(error);
      } else {
        toast.success('Заказ создан');
        setShowCreateDialog(false);
        resetForm();
        loadOrders();
      }
    } catch (err) {
      toast.error('Ошибка создания заказа');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string, comment?: string) => {
    try {
      const { error } = await api.adminUpdateOrderStatus(orderId, { status, comment });
      if (error) {
        toast.error('Ошибка обновления статуса');
        console.error(error);
      } else {
        toast.success('Статус обновлён');
        loadOrders();
        if (selectedOrder) {
          await loadOrderHistory(orderId);
        }
      }
    } catch (err) {
      toast.error('Ошибка обновления статуса');
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Удалить заказ?')) return;

    try {
      const { error } = await api.adminDeleteOrder(orderId);
      if (error) {
        toast.error('Ошибка удаления заказа');
        console.error(error);
      } else {
        toast.success('Заказ удалён');
        loadOrders();
        setShowDetailDialog(false);
      }
    } catch (err) {
      toast.error('Ошибка удаления заказа');
      console.error(err);
    }
  };

  const openOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    await loadOrderHistory(order.id);
    setShowDetailDialog(true);
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_telegram: '',
      product_type: 'pendant',
      material: 'silver',
      size: 'm',
      form_factor: 'round',
      quoted_price: '',
      special_requirements: '',
      internal_notes: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    if (!statusConfig) return <Badge variant="outline">{status}</Badge>;

    const Icon = statusConfig.icon;
    return (
      <Badge className={cn('text-white', statusConfig.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Заказы</h2>
          <p className="text-muted-foreground">Управление производственными заказами</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Обновить
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Создать заказ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новый заказ</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Имя заказчика *</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="+7 900 000 00 00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telegram</Label>
                    <Input
                      value={formData.customer_telegram}
                      onChange={(e) => setFormData({ ...formData, customer_telegram: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Материал</Label>
                    <Select value={formData.material} onValueChange={(v) => setFormData({ ...formData, material: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silver">Серебро 925</SelectItem>
                        <SelectItem value="gold">Золото 585</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Размер</Label>
                    <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s">S (13mm / 10mm)</SelectItem>
                        <SelectItem value="m">M (19mm / 13mm)</SelectItem>
                        <SelectItem value="l">L (25mm / 19mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Форма</Label>
                    <Select value={formData.form_factor} onValueChange={(v) => setFormData({ ...formData, form_factor: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">Круглый</SelectItem>
                        <SelectItem value="oval">Жетон</SelectItem>
                        <SelectItem value="contour">Контурный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Озвученная цена (₽)</Label>
                  <Input
                    type="number"
                    value={formData.quoted_price}
                    onChange={(e) => setFormData({ ...formData, quoted_price: e.target.value })}
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Особые требования</Label>
                  <Textarea
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                    placeholder="Пожелания клиента..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Внутренние заметки</Label>
                  <Textarea
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Заметки для производства..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Отмена
                </Button>
                <Button onClick={handleCreateOrder} disabled={!formData.customer_name}>
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Статус:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список заказов ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Заказов не найдено
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Заказчик</TableHead>
                    <TableHead>Изделие</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          {order.customer_phone && (
                            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{order.material === 'silver' ? 'Серебро' : 'Золото'}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.size?.toUpperCase()} • {order.form_factor}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.final_price ? (
                          <span className="font-medium">{order.final_price.toLocaleString()} ₽</span>
                        ) : order.quoted_price ? (
                          <span className="text-muted-foreground">{order.quoted_price.toLocaleString()} ₽</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openOrderDetail(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Заказ {selectedOrder.order_number}</span>
                  {getStatusBadge(selectedOrder.status)}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Заказчик</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Имя:</span> {selectedOrder.customer_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email || '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Телефон:</span> {selectedOrder.customer_phone || '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telegram:</span> {selectedOrder.customer_telegram || '—'}
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Изделие</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Материал:</span> {selectedOrder.material === 'silver' ? 'Серебро 925' : 'Золото 585'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Размер:</span> {selectedOrder.size?.toUpperCase() || '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Форма:</span> {selectedOrder.form_factor || '—'}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Стоимость</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Озвученная:</span> {selectedOrder.quoted_price ? `${selectedOrder.quoted_price.toLocaleString()} ₽` : '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Финальная:</span> {selectedOrder.final_price ? `${selectedOrder.final_price.toLocaleString()} ₽` : '—'}
                    </div>
                  </div>
                </div>

                {/* Status History */}
                <div className="space-y-2">
                  <h3 className="font-semibold">История статусов</h3>
                  <div className="space-y-2">
                    {orderHistory.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 text-sm border-l-2 border-primary/20 pl-3">
                        <div className="flex-1">
                          <div className="font-medium">{ORDER_STATUSES.find(s => s.value === entry.status)?.label || entry.status}</div>
                          {entry.comment && <div className="text-muted-foreground">{entry.comment}</div>}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), 'dd MMM HH:mm', { locale: ru })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Actions */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Изменить статус</h3>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUSES.filter(s => s.value !== selectedOrder.status).map((status) => {
                      const Icon = status.icon;
                      return (
                        <Button
                          key={status.value}
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(selectedOrder.id, status.value)}
                          className="gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {status.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                {(selectedOrder.special_requirements || selectedOrder.internal_notes) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Заметки</h3>
                    {selectedOrder.special_requirements && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Требования:</span>
                        <p className="mt-1">{selectedOrder.special_requirements}</p>
                      </div>
                    )}
                    {selectedOrder.internal_notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Внутренние:</span>
                        <p className="mt-1">{selectedOrder.internal_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить заказ
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
