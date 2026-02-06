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
import { Clock, User, Package, Image, History, CreditCard, Phone, Mail, MessageSquare, Plus, Save, Loader2 } from 'lucide-react';

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
  stage_notes?: Record<string, string>;
  final_price?: number;
  quoted_price?: number;
  total_cost?: number;
  printing_cost?: number;
  printing_weight_g?: number;
  printing_notes?: string;
  metal_cost?: number;
  metal_weight_g?: number;
  metal_price_per_g?: number;
  casting_cost?: number;
  casting_notes?: string;
  polishing_cost?: number;
  plating_cost?: number;
  plating_type?: string;
  gems_cost?: number;
  gems_setting_cost?: number;
  chain_cost?: number;
  chain_type?: string;
  chain_length_cm?: number;
  labor_cost?: number;
  labor_hours?: number;
  labor_rate_per_hour?: number;
  packaging_cost?: number;
  engraving_cost?: number;
  other_costs?: number;
  other_costs_notes?: string;
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

const PRODUCTION_STAGES = ['design', 'modeling', 'printing', 'casting', 'polishing', 'assembly'];

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
  const [fullOrder, setFullOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order?.status || 'new');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Editable state
  const [editedInfo, setEditedInfo] = useState<Record<string, string>>({});
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({});
  const [editedCosts, setEditedCosts] = useState<Record<string, any>>({});

  const initEditableState = (data: any) => {
    if (!data) return;
    setEditedInfo({
      special_requirements: data.special_requirements || '',
      internal_notes: data.internal_notes || '',
    });
    setEditedNotes(data.stage_notes || {});
    setEditedCosts({
      printing_cost: data.printing_cost ?? '',
      printing_weight_g: data.printing_weight_g ?? '',
      printing_notes: data.printing_notes || '',
      casting_cost: data.casting_cost ?? '',
      casting_notes: data.casting_notes || '',
      metal_weight_g: data.metal_weight_g ?? '',
      metal_price_per_g: data.metal_price_per_g ?? '',
      metal_cost: data.metal_cost ?? '',
      polishing_cost: data.polishing_cost ?? '',
      plating_cost: data.plating_cost ?? '',
      plating_type: data.plating_type || '',
      gems_cost: data.gems_cost ?? '',
      gems_setting_cost: data.gems_setting_cost ?? '',
      chain_type: data.chain_type || '',
      chain_length_cm: data.chain_length_cm ?? '',
      chain_cost: data.chain_cost ?? '',
      labor_hours: data.labor_hours ?? '',
      labor_rate_per_hour: data.labor_rate_per_hour ?? '',
      labor_cost: data.labor_cost ?? '',
      packaging_cost: data.packaging_cost ?? '',
      engraving_cost: data.engraving_cost ?? '',
      other_costs: data.other_costs ?? '',
      other_costs_notes: data.other_costs_notes || '',
      quoted_price: data.quoted_price ?? '',
      final_price: data.final_price ?? '',
    });
    setDirty(false);
  };

  const loadFullOrder = useCallback(async () => {
    if (!order) return;
    try {
      const { data, error } = await api.productionGetOrder(order.id);
      if (error) throw error;
      const orderData = data?.order || data;
      setFullOrder(orderData);
      setHistory(data?.history || []);
      initEditableState(orderData);
    } catch (e) {
      console.error('Failed to load order:', e);
    }
  }, [order]);

  useEffect(() => {
    if (open && order) {
      setSelectedStatus(order.status);
      loadFullOrder();
    }
  }, [open, order, loadFullOrder]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order || newStatus === order.status) return;
    setLoading(true);
    try {
      await onStatusChange(order.id, newStatus);
      setSelectedStatus(newStatus);
      loadFullOrder();
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
        loadFullOrder();
      } catch (e) {
        toast.error('Ошибка загрузки фото');
      }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updates: Record<string, any> = {};

      // Info fields
      if (editedInfo.special_requirements !== undefined) updates.special_requirements = editedInfo.special_requirements;
      if (editedInfo.internal_notes !== undefined) updates.internal_notes = editedInfo.internal_notes;

      // Stage notes
      if (Object.keys(editedNotes).length > 0) {
        updates.stage_notes = editedNotes;
      }

      // Cost fields - parse numbers
      const numericFields = [
        'printing_cost', 'printing_weight_g', 'casting_cost', 'metal_weight_g',
        'metal_price_per_g', 'metal_cost', 'polishing_cost', 'plating_cost',
        'gems_cost', 'gems_setting_cost', 'chain_length_cm', 'chain_cost',
        'labor_hours', 'labor_rate_per_hour', 'labor_cost', 'packaging_cost',
        'engraving_cost', 'other_costs', 'quoted_price', 'final_price',
      ];
      for (const field of numericFields) {
        const val = editedCosts[field];
        if (val !== '' && val !== null && val !== undefined) {
          updates[field] = parseFloat(val) || 0;
        }
      }

      // String cost fields
      const stringFields = ['printing_notes', 'casting_notes', 'plating_type', 'chain_type', 'other_costs_notes'];
      for (const field of stringFields) {
        if (editedCosts[field] !== undefined) {
          updates[field] = editedCosts[field];
        }
      }

      // Auto-calculate total_cost
      const tc = (parseFloat(editedCosts.printing_cost) || 0) +
        (parseFloat(editedCosts.metal_cost) || 0) +
        (parseFloat(editedCosts.casting_cost) || 0) +
        (parseFloat(editedCosts.polishing_cost) || 0) +
        (parseFloat(editedCosts.plating_cost) || 0) +
        (parseFloat(editedCosts.gems_cost) || 0) +
        (parseFloat(editedCosts.gems_setting_cost) || 0) +
        (parseFloat(editedCosts.chain_cost) || 0) +
        (parseFloat(editedCosts.labor_cost) || 0) +
        (parseFloat(editedCosts.packaging_cost) || 0) +
        (parseFloat(editedCosts.engraving_cost) || 0) +
        (parseFloat(editedCosts.other_costs) || 0);
      if (tc > 0) updates.total_cost = tc;

      const { error } = await api.productionUpdateOrder(order.id, updates);
      if (error) throw error;
      toast.success('Сохранено');
      setDirty(false);
      onRefresh();
    } catch (e) {
      toast.error('Ошибка сохранения');
    }
    setSaving(false);
  };

  if (!order) return null;

  const displayOrder = fullOrder || order;
  const currentStatus = statuses.find(s => s.value === displayOrder.status);

  // Calculate total from editable costs
  const calculatedTotal = (parseFloat(editedCosts.printing_cost) || 0) +
    (parseFloat(editedCosts.metal_cost) || 0) +
    (parseFloat(editedCosts.casting_cost) || 0) +
    (parseFloat(editedCosts.polishing_cost) || 0) +
    (parseFloat(editedCosts.plating_cost) || 0) +
    (parseFloat(editedCosts.gems_cost) || 0) +
    (parseFloat(editedCosts.gems_setting_cost) || 0) +
    (parseFloat(editedCosts.chain_cost) || 0) +
    (parseFloat(editedCosts.labor_cost) || 0) +
    (parseFloat(editedCosts.packaging_cost) || 0) +
    (parseFloat(editedCosts.engraving_cost) || 0) +
    (parseFloat(editedCosts.other_costs) || 0);

  const finalPrice = parseFloat(editedCosts.final_price) || 0;
  const margin = finalPrice > 0 && calculatedTotal > 0
    ? finalPrice - calculatedTotal
    : 0;
  const marginPercent = finalPrice > 0 ? Math.round((margin / finalPrice) * 100) : 0;

  const updateCost = (field: string, value: string) => {
    setEditedCosts(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const updateInfo = (field: string, value: string) => {
    setEditedInfo(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const updateNote = (stage: string, value: string) => {
    setEditedNotes(prev => ({ ...prev, [stage]: value }));
    setDirty(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono">
                {displayOrder.order_number || displayOrder.id.slice(0, 8)}
              </span>
              {currentStatus && (
                <Badge className={currentStatus.color}>
                  {currentStatus.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>В статусе: {formatDuration(displayOrder.time_in_status_seconds || 0)}</span>
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

          {/* ==================== INFO TAB ==================== */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Customer (read-only) */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" /> Клиент
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Имя</Label>
                  <div className="font-medium">{displayOrder.customer_name}</div>
                </div>
                {displayOrder.customer_email && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </Label>
                    <div>{displayOrder.customer_email}</div>
                  </div>
                )}
                {displayOrder.customer_phone && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Телефон
                    </Label>
                    <div>{displayOrder.customer_phone}</div>
                  </div>
                )}
                {displayOrder.customer_telegram && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Telegram
                    </Label>
                    <div>{displayOrder.customer_telegram}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Product (read-only) */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Package className="w-4 h-4" /> Изделие
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Тип</Label>
                  <div>{PRODUCT_TYPES[displayOrder.product_type] || displayOrder.product_type}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Материал</Label>
                  <div>{MATERIALS[displayOrder.material] || displayOrder.material}</div>
                </div>
                {displayOrder.size && (
                  <div>
                    <Label className="text-muted-foreground">Размер</Label>
                    <div>{displayOrder.size.toUpperCase()}</div>
                  </div>
                )}
                {displayOrder.form_factor && (
                  <div>
                    <Label className="text-muted-foreground">Форм-фактор</Label>
                    <div>{displayOrder.form_factor}</div>
                  </div>
                )}
              </div>
              {displayOrder.engraving_text && (
                <div>
                  <Label className="text-muted-foreground">Гравировка</Label>
                  <div className="text-sm italic">"{displayOrder.engraving_text}"</div>
                </div>
              )}
            </div>

            {/* Agreements / Requirements (editable) */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Договорённости и описание</h4>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Особые требования / описание от клиента</Label>
                <Textarea
                  value={editedInfo.special_requirements || ''}
                  onChange={(e) => updateInfo('special_requirements', e.target.value)}
                  rows={3}
                  placeholder="Описание пожеланий клиента, договорённости по изделию..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Внутренние заметки</Label>
                <Textarea
                  value={editedInfo.internal_notes || ''}
                  onChange={(e) => updateInfo('internal_notes', e.target.value)}
                  rows={2}
                  placeholder="Заметки для команды..."
                />
              </div>
            </div>

            {/* Per-stage notes (editable) */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Заметки по этапам</h4>
              {statuses.filter(s => PRODUCTION_STAGES.includes(s.value)).map((status) => (
                <div key={status.value} className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </Label>
                  <Textarea
                    value={editedNotes[status.value] || ''}
                    onChange={(e) => updateNote(status.value, e.target.value)}
                    rows={2}
                    placeholder={`Договорённости / заметки для этапа "${status.label}"...`}
                  />
                </div>
              ))}
            </div>

            {/* Save button */}
            {dirty && (
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить
              </Button>
            )}
          </TabsContent>

          {/* ==================== FILES TAB ==================== */}
          <TabsContent value="files" className="space-y-4 mt-4">
            {/* Reference images */}
            {displayOrder.reference_images && displayOrder.reference_images.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Референсы клиента</Label>
                <div className="grid grid-cols-4 gap-2">
                  {displayOrder.reference_images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Ref ${i + 1}`} className="rounded border aspect-square object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Generated images */}
            {displayOrder.generated_images && displayOrder.generated_images.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Сгенерированные варианты</Label>
                <div className="grid grid-cols-4 gap-2">
                  {displayOrder.generated_images.map((url, i) => (
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
                {statuses.filter(s => PRODUCTION_STAGES.includes(s.value)).map((status) => {
                  const photos = displayOrder.stage_photos?.[status.value] || [];
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
            {displayOrder.final_photos && displayOrder.final_photos.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Финальные фото</Label>
                <div className="grid grid-cols-4 gap-2">
                  {displayOrder.final_photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Final ${i + 1}`} className="rounded border aspect-square object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ==================== COSTS TAB (EDITABLE) ==================== */}
          <TabsContent value="costs" className="space-y-4 mt-4">
            {/* 3D Printing */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-sm">3D Печать</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Стоимость (₽)</Label>
                  <Input type="number" value={editedCosts.printing_cost ?? ''} onChange={(e) => updateCost('printing_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Вес модели (г)</Label>
                  <Input type="number" step="0.1" value={editedCosts.printing_weight_g ?? ''} onChange={(e) => updateCost('printing_weight_g', e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Заметки</Label>
                <Textarea value={editedCosts.printing_notes || ''} onChange={(e) => updateCost('printing_notes', e.target.value)} rows={2} placeholder="Параметры печати..." />
              </div>
            </div>

            {/* Casting */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Литьё</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Стоимость литья (₽)</Label>
                  <Input type="number" value={editedCosts.casting_cost ?? ''} onChange={(e) => updateCost('casting_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Стоимость металла (₽)</Label>
                  <Input type="number" value={editedCosts.metal_cost ?? ''} onChange={(e) => updateCost('metal_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Вес металла (г)</Label>
                  <Input type="number" step="0.1" value={editedCosts.metal_weight_g ?? ''} onChange={(e) => updateCost('metal_weight_g', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Цена за грамм (₽/г)</Label>
                  <Input type="number" step="0.01" value={editedCosts.metal_price_per_g ?? ''} onChange={(e) => updateCost('metal_price_per_g', e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Заметки</Label>
                <Textarea value={editedCosts.casting_notes || ''} onChange={(e) => updateCost('casting_notes', e.target.value)} rows={2} placeholder="Тип металла, объём, особенности..." />
              </div>
            </div>

            {/* Polishing */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Полировка и покрытие</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Полировка (₽)</Label>
                  <Input type="number" value={editedCosts.polishing_cost ?? ''} onChange={(e) => updateCost('polishing_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Покрытие (₽)</Label>
                  <Input type="number" value={editedCosts.plating_cost ?? ''} onChange={(e) => updateCost('plating_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Тип покрытия</Label>
                  <Input value={editedCosts.plating_type || ''} onChange={(e) => updateCost('plating_type', e.target.value)} placeholder="Родий, позолота..." />
                </div>
              </div>
            </div>

            {/* Gems */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Камни</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Стоимость камней (₽)</Label>
                  <Input type="number" value={editedCosts.gems_cost ?? ''} onChange={(e) => updateCost('gems_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Закрепка (₽)</Label>
                  <Input type="number" value={editedCosts.gems_setting_cost ?? ''} onChange={(e) => updateCost('gems_setting_cost', e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Chain */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Цепочка</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Тип</Label>
                  <Input value={editedCosts.chain_type || ''} onChange={(e) => updateCost('chain_type', e.target.value)} placeholder="Якорная, снейк..." />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Длина (см)</Label>
                  <Input type="number" value={editedCosts.chain_length_cm ?? ''} onChange={(e) => updateCost('chain_length_cm', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Стоимость (₽)</Label>
                  <Input type="number" value={editedCosts.chain_cost ?? ''} onChange={(e) => updateCost('chain_cost', e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Labor */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Работа</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Часы</Label>
                  <Input type="number" step="0.5" value={editedCosts.labor_hours ?? ''} onChange={(e) => updateCost('labor_hours', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ставка (₽/час)</Label>
                  <Input type="number" value={editedCosts.labor_rate_per_hour ?? ''} onChange={(e) => updateCost('labor_rate_per_hour', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Итого работа (₽)</Label>
                  <Input type="number" value={editedCosts.labor_cost ?? ''} onChange={(e) => updateCost('labor_cost', e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Packaging & Other */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Прочее</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Упаковка (₽)</Label>
                  <Input type="number" value={editedCosts.packaging_cost ?? ''} onChange={(e) => updateCost('packaging_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Гравировка (₽)</Label>
                  <Input type="number" value={editedCosts.engraving_cost ?? ''} onChange={(e) => updateCost('engraving_cost', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Другие расходы (₽)</Label>
                  <Input type="number" value={editedCosts.other_costs ?? ''} onChange={(e) => updateCost('other_costs', e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Описание прочих расходов</Label>
                <Textarea value={editedCosts.other_costs_notes || ''} onChange={(e) => updateCost('other_costs_notes', e.target.value)} rows={2} placeholder="Доставка, расходные материалы..." />
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Себестоимость:</span>
                <span className="font-bold text-lg">{formatPrice(calculatedTotal || 0)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Цена для клиента (₽)</Label>
                  <Input type="number" value={editedCosts.quoted_price ?? ''} onChange={(e) => updateCost('quoted_price', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Финальная цена (₽)</Label>
                  <Input type="number" value={editedCosts.final_price ?? ''} onChange={(e) => updateCost('final_price', e.target.value)} placeholder="0" />
                </div>
              </div>
              {margin !== 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Маржа:</span>
                  <span className={`font-medium ${margin > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatPrice(margin)} ({marginPercent}%)
                  </span>
                </div>
              )}
            </div>

            {/* Save button */}
            {dirty && (
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить расчёт
              </Button>
            )}
          </TabsContent>

          {/* ==================== HISTORY TAB ==================== */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {/* Time in each status */}
            {displayOrder.status_durations && Object.keys(displayOrder.status_durations).length > 0 && (
              <div className="p-4 border rounded-lg">
                <Label className="text-muted-foreground mb-3 block">Время в статусах</Label>
                <div className="space-y-2">
                  {statuses.map((status) => {
                    const duration = displayOrder.status_durations?.[status.value] || 0;
                    if (duration === 0 && status.value !== displayOrder.status) return null;
                    return (
                      <div key={status.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          <span className="text-sm">{status.label}</span>
                        </div>
                        <span className="text-sm font-mono">
                          {status.value === displayOrder.status
                            ? formatDuration(displayOrder.time_in_status_seconds || 0) + ' (сейчас)'
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
              Заказ создан: {formatDate(displayOrder.created_at)}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
