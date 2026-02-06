import { useState, useEffect, useRef } from 'react';
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
import { Plus, RefreshCw, Package, Trash2, Eye, Edit2, Clock, CheckCircle2, Truck, Box, Upload, X, Image, Cube, Camera, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  production_artifacts?: string[];
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
  const [uploading, setUploading] = useState<string | null>(null);

  // File input refs
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const model3dInputRef = useRef<HTMLInputElement>(null);
  const artifactInputRef = useRef<HTMLInputElement>(null);
  const finalPhotoInputRef = useRef<HTMLInputElement>(null);

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
  const [newOrderImages, setNewOrderImages] = useState<File[]>([]);

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

  const uploadFileToStorage = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('pendants')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('pendants')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handleCreateOrder = async () => {
    try {
      // Upload reference images first
      let referenceUrls: string[] = [];
      if (newOrderImages.length > 0) {
        setUploading('reference');
        for (const file of newOrderImages) {
          const url = await uploadFileToStorage(file, 'orders/reference');
          if (url) referenceUrls.push(url);
        }
      }

      const orderData = {
        ...formData,
        quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : undefined,
        reference_images: referenceUrls,
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
    } finally {
      setUploading(null);
    }
  };

  const handleUploadFile = async (orderId: string, type: 'reference' | '3d' | 'artifact' | 'final', files: FileList) => {
    if (!files.length) return;

    setUploading(type);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const folder = `orders/${type}`;
        const url = await uploadFileToStorage(file, folder);
        if (url) urls.push(url);
      }

      if (urls.length === 0) {
        toast.error('Ошибка загрузки файлов');
        return;
      }

      // Update order with new files
      let updateData: Record<string, any> = {};

      if (type === 'reference') {
        updateData.reference_images = [...(selectedOrder?.reference_images || []), ...urls];
      } else if (type === '3d') {
        updateData.model_3d_url = urls[0];
      } else if (type === 'artifact') {
        updateData.production_artifacts = [...(selectedOrder?.production_artifacts || []), ...urls];
      } else if (type === 'final') {
        updateData.final_photos = [...(selectedOrder?.final_photos || []), ...urls];
      }

      const { error } = await api.adminUpdateOrder(orderId, updateData);
      if (error) {
        toast.error('Ошибка обновления заказа');
        console.error(error);
      } else {
        toast.success('Файлы загружены');
        // Refresh order data
        const { data: refreshedOrder } = await api.adminGetOrder(orderId);
        if (refreshedOrder) {
          setSelectedOrder(refreshedOrder);
        }
      }
    } catch (err) {
      toast.error('Ошибка загрузки');
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = async (orderId: string, type: 'reference' | 'artifact' | 'final' | '3d', url: string) => {
    if (!confirm('Удалить файл?')) return;

    try {
      let updateData: Record<string, any> = {};

      if (type === 'reference') {
        updateData.reference_images = (selectedOrder?.reference_images || []).filter(u => u !== url);
      } else if (type === 'artifact') {
        updateData.production_artifacts = (selectedOrder?.production_artifacts || []).filter(u => u !== url);
      } else if (type === 'final') {
        updateData.final_photos = (selectedOrder?.final_photos || []).filter(u => u !== url);
      } else if (type === '3d') {
        updateData.model_3d_url = null;
      }

      const { error } = await api.adminUpdateOrder(orderId, updateData);
      if (error) {
        toast.error('Ошибка удаления');
        console.error(error);
      } else {
        toast.success('Файл удалён');
        const { data: refreshedOrder } = await api.adminGetOrder(orderId);
        if (refreshedOrder) {
          setSelectedOrder(refreshedOrder);
        }
      }
    } catch (err) {
      toast.error('Ошибка удаления');
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
          // Refresh order
          const { data } = await api.adminGetOrder(orderId);
          if (data) setSelectedOrder(data);
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
    // Fetch full order data
    const { data } = await api.adminGetOrder(order.id);
    setSelectedOrder(data || order);
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
    setNewOrderImages([]);
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

  const ImageGallery = ({ images, type, orderId, title, icon: Icon }: {
    images: string[];
    type: 'reference' | 'artifact' | 'final';
    orderId: string;
    title: string;
    icon: React.ElementType;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (type === 'reference') referenceInputRef.current?.click();
            else if (type === 'artifact') artifactInputRef.current?.click();
            else if (type === 'final') finalPhotoInputRef.current?.click();
          }}
          disabled={uploading === type}
        >
          {uploading === type ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Добавить
        </Button>
      </div>
      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img
                src={url}
                alt={`${title} ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                onClick={() => window.open(url, '_blank')}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition"
                onClick={() => handleRemoveFile(orderId, type, url)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
          Нет файлов
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={referenceInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => selectedOrder && e.target.files && handleUploadFile(selectedOrder.id, 'reference', e.target.files)}
      />
      <input
        ref={model3dInputRef}
        type="file"
        accept=".stl,.obj,.glb,.gltf,.3mf"
        className="hidden"
        onChange={(e) => selectedOrder && e.target.files && handleUploadFile(selectedOrder.id, '3d', e.target.files)}
      />
      <input
        ref={artifactInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => selectedOrder && e.target.files && handleUploadFile(selectedOrder.id, 'artifact', e.target.files)}
      />
      <input
        ref={finalPhotoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => selectedOrder && e.target.files && handleUploadFile(selectedOrder.id, 'final', e.target.files)}
      />

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

                {/* Reference Images Upload */}
                <div className="space-y-2">
                  <Label>Исходные изображения</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition hover:border-primary/50",
                      newOrderImages.length > 0 && "border-primary/30 bg-primary/5"
                    )}
                    onClick={() => document.getElementById('new-order-images')?.click()}
                  >
                    <input
                      id="new-order-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setNewOrderImages([...newOrderImages, ...Array.from(e.target.files)]);
                        }
                      }}
                    />
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Нажмите или перетащите фото от клиента
                    </p>
                  </div>
                  {newOrderImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newOrderImages.map((file, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-1 -right-1 h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewOrderImages(newOrderImages.filter((_, i) => i !== idx));
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                <Button onClick={handleCreateOrder} disabled={!formData.customer_name || uploading === 'reference'}>
                  {uploading === 'reference' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    'Создать'
                  )}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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

                {/* Files Section */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold text-lg">Файлы заказа</h3>

                  {/* Reference Images */}
                  <ImageGallery
                    images={selectedOrder.reference_images || []}
                    type="reference"
                    orderId={selectedOrder.id}
                    title="Исходники от клиента"
                    icon={Image}
                  />

                  {/* 3D Model */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cube className="w-4 h-4" />
                        3D Модель
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => model3dInputRef.current?.click()}
                        disabled={uploading === '3d'}
                      >
                        {uploading === '3d' ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {selectedOrder.model_3d_url ? 'Заменить' : 'Загрузить'}
                      </Button>
                    </div>
                    {selectedOrder.model_3d_url ? (
                      <div className="flex items-center gap-4 p-3 border rounded-lg bg-background">
                        <Cube className="w-10 h-10 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">3D модель загружена</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedOrder.model_3d_url.split('/').pop()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedOrder.model_3d_url!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Открыть
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveFile(selectedOrder.id, '3d', selectedOrder.model_3d_url!)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                        3D модель не загружена (.stl, .obj, .glb, .gltf, .3mf)
                      </div>
                    )}
                  </div>

                  {/* Production Artifacts */}
                  <ImageGallery
                    images={selectedOrder.production_artifacts || []}
                    type="artifact"
                    orderId={selectedOrder.id}
                    title="Артефакты производства"
                    icon={Camera}
                  />

                  {/* Final Photos */}
                  <ImageGallery
                    images={selectedOrder.final_photos || []}
                    type="final"
                    orderId={selectedOrder.id}
                    title="Финальные фото"
                    icon={CheckCircle2}
                  />
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
                    {orderHistory.length > 0 ? orderHistory.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 text-sm border-l-2 border-primary/20 pl-3">
                        <div className="flex-1">
                          <div className="font-medium">{ORDER_STATUSES.find(s => s.value === entry.status)?.label || entry.status}</div>
                          {entry.comment && <div className="text-muted-foreground">{entry.comment}</div>}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), 'dd MMM HH:mm', { locale: ru })}
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">Нет истории</p>
                    )}
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
