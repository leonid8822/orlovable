import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Clock, User, Package, Image, History, CreditCard, Phone, Mail, MessageSquare, Plus, X } from 'lucide-react';

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

interface StatusHistory {
  id: string;
  status: string;
  previous_status?: string;
  duration_seconds?: number;
  comment?: string;
  changed_by?: string;
  created_at: string;
}

interface Status {
  value: string;
  label: string;
  color: string;
}

interface OrderDetailModalProps {
  order: Order | null;
  statuses: Status[];
  open: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  onRefresh: () => void;
}

const PRODUCT_TYPES: Record<string, string> = {
  pendant: 'Кулон',
  bracelet: 'Браслет',
  ring: 'Кольцо',
  earrings: 'Серьги',
  brooch: 'Брошь',
  other: 'Другое',
};

const MATERIALS: Record<string, string> = {
  silver: 'Серебро 925',
  gold: 'Золото 585',
  gold_white: 'Белое золото',
  platinum: 'Платина',
};

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${mins}м`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}д ${hours}ч`;
}

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function OrderDetailModal({
  order,
  statuses,
  open,
  onClose,
  onStatusChange,
  onRefresh,
}: OrderDetailModalProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order?.status || 'new');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!order) return;
    try {
      const { data, error } = await api.productionGetOrder(order.id);
      if (error) throw error;
      setHistory(data?.history || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, [order]);

  useEffect(() => {
    if (open && order) {
      setSelectedStatus(order.status);
      loadHistory();
    }
  }, [open, order, loadHistory]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order || newStatus === order.status) return;

    setLoading(true);
    try {
      await onStatusChange(order.id, newStatus);
      setSelectedStatus(newStatus);
      loadHistory();
      toast.success('Статус обновлён');
    } catch (e) {
      toast.error('Ошибка обновления статуса');
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, stage: string) => {
    if (!order || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      setUploadingPhoto(true);
      try {
        const { error } = await api.productionUploadStagePhoto(order.id, stage, reader.result as string);
        if (error) throw error;
        toast.success('Фото загружено');
        onRefresh();
      } catch (e) {
        toast.error('Ошибка загрузки фото');
      }
      setUploadingPhoto(false);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!order) return null;

  const currentStatus = statuses.find(s => s.value === order.status);
  const totalCost = (order.printing_cost || 0) + (order.metal_cost || 0) +
    (order.casting_cost || 0) + (order.polishing_cost || 0) +
    (order.gems_cost || 0) + (order.chain_cost || 0) +
    (order.labor_cost || 0) + (order.packaging_cost || 0) +
    (order.other_costs || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono">
                {order.order_number || order.id.slice(0, 8)}
              </span>
              {currentStatus && (
                <Badge className={currentStatus.color}>
                  {currentStatus.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>В статусе: {formatDuration(order.time_in_status_seconds || 0)}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Status changer */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <Label className="whitespace-nowrap">Изменить статус:</Label>
          <Select value={selectedStatus} onValueChange={handleStatusChange} disabled={loading}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    {s.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="gap-1">
              <User className="w-4 h-4" /> Инфо
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1">
              <Image className="w-4 h-4" /> Файлы
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-1">
              <CreditCard className="w-4 h-4" /> Расчёт
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="w-4 h-4" /> История
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Customer */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" /> Клиент
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Имя</Label>
                  <div className="font-medium">{order.customer_name}</div>
                </div>
                {order.customer_email && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </Label>
                    <div>{order.customer_email}</div>
                  </div>
                )}
                {order.customer_phone && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Телефон
                    </Label>
                    <div>{order.customer_phone}</div>
                  </div>
                )}
                {order.customer_telegram && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Telegram
                    </Label>
                    <div>{order.customer_telegram}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Product */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Package className="w-4 h-4" /> Изделие
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Тип</Label>
                  <div>{PRODUCT_TYPES[order.product_type] || order.product_type}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Материал</Label>
                  <div>{MATERIALS[order.material] || order.material}</div>
                </div>
                {order.size && (
                  <div>
                    <Label className="text-muted-foreground">Размер</Label>
                    <div>{order.size.toUpperCase()}</div>
                  </div>
                )}
                {order.form_factor && (
                  <div>
                    <Label className="text-muted-foreground">Форм-фактор</Label>
                    <div>{order.form_factor}</div>
                  </div>
                )}
              </div>
              {order.special_requirements && (
                <div>
                  <Label className="text-muted-foreground">Особые требования</Label>
                  <div className="text-sm">{order.special_requirements}</div>
                </div>
              )}
              {order.engraving_text && (
                <div>
                  <Label className="text-muted-foreground">Гравировка</Label>
                  <div className="text-sm italic">"{order.engraving_text}"</div>
                </div>
              )}
            </div>

            {/* Notes */}
            {order.internal_notes && (
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Внутренние заметки</Label>
                <div className="text-sm mt-1">{order.internal_notes}</div>
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4 mt-4">
            {/* Reference images */}
            {order.reference_images && order.reference_images.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Референсы клиента</Label>
                <div className="grid grid-cols-4 gap-2">
                  {order.reference_images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Ref ${i + 1}`} className="rounded border aspect-square object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Generated images */}
            {order.generated_images && order.generated_images.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Сгенерированные варианты</Label>
                <div className="grid grid-cols-4 gap-2">
                  {order.generated_images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Gen ${i + 1}`} className="rounded border aspect-square object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Stage photos */}
            <div>
              <Label className="text-muted-foreground mb-2 block">Фото по этапам</Label>
              <div className="space-y-3">
                {statuses.filter(s => !['new', 'ready', 'shipped', 'delivered', 'cancelled'].includes(s.value)).map((status) => {
                  const photos = order.stage_photos?.[status.value] || [];
                  return (
                    <div key={status.value} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          <span className="text-sm font-medium">{status.label}</span>
                        </div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, status.value)}
                            disabled={uploadingPhoto}
                          />
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <span>
                              <Plus className="w-3 h-3" /> Добавить
                            </span>
                          </Button>
                        </label>
                      </div>
                      {photos.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {photos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`${status.label} ${i + 1}`} className="rounded border aspect-square object-cover" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Нет фото</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final photos */}
            {order.final_photos && order.final_photos.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Финальные фото</Label>
                <div className="grid grid-cols-4 gap-2">
                  {order.final_photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Final ${i + 1}`} className="rounded border aspect-square object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">3D Печать</Label>
                <div className="text-lg font-medium">{formatPrice(order.printing_cost)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Металл</Label>
                <div className="text-lg font-medium">{formatPrice(order.metal_cost)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Литьё</Label>
                <div className="text-lg font-medium">{formatPrice(order.casting_cost)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Полировка</Label>
                <div className="text-lg font-medium">{formatPrice(order.polishing_cost)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Камни</Label>
                <div className="text-lg font-medium">{formatPrice(order.gems_cost)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Цепочка</Label>
                <div className="text-lg font-medium">{formatPrice(order.chain_cost)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Работа</Label>
                <div className="text-lg font-medium">{formatPrice(order.labor_cost)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground">Упаковка</Label>
                <div className="text-lg font-medium">{formatPrice(order.packaging_cost)}</div>
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Себестоимость:</span>
                <span className="font-medium">{formatPrice(totalCost || order.total_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Цена для клиента:</span>
                <span className="font-medium">{formatPrice(order.quoted_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Финальная цена:</span>
                <span className="font-bold text-lg">{formatPrice(order.final_price)}</span>
              </div>
              {order.final_price && totalCost > 0 && (
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Маржа:</span>
                  <span className="font-medium text-green-600">
                    {formatPrice(order.final_price - totalCost)} ({Math.round(((order.final_price - totalCost) / order.final_price) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {/* Time in each status */}
            {order.status_durations && Object.keys(order.status_durations).length > 0 && (
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground mb-3 block">Время в статусах</Label>
                <div className="space-y-2">
                  {statuses.map((status) => {
                    const duration = order.status_durations?.[status.value] || 0;
                    if (duration === 0 && status.value !== order.status) return null;
                    return (
                      <div key={status.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          <span className="text-sm">{status.label}</span>
                        </div>
                        <span className="text-sm font-mono">
                          {status.value === order.status
                            ? formatDuration(order.time_in_status_seconds || 0) + ' (сейчас)'
                            : formatDuration(duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status history */}
            <div>
              <Label className="text-muted-foreground mb-3 block">История изменений</Label>
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((h) => {
                    const statusInfo = statuses.find(s => s.value === h.status);
                    return (
                      <div key={h.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {statusInfo && (
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          )}
                          {h.comment && (
                            <span className="text-sm text-muted-foreground">{h.comment}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{formatDate(h.created_at)}</div>
                          {h.changed_by && <div>{h.changed_by}</div>}
                          {h.duration_seconds != null && h.duration_seconds > 0 && (
                            <div className="font-mono">{formatDuration(h.duration_seconds)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Нет записей в истории
                </div>
              )}
            </div>

            {/* Created at */}
            <div className="text-sm text-muted-foreground text-center">
              Заказ создан: {formatDate(order.created_at)}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
