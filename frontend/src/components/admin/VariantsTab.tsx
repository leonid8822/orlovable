import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/types/product';

interface Variant {
  id: string;
  size: string;
  material: string;
  diameter: string | number;
  weight?: string | number;
  volume?: string | number;
  thickness?: string | number;
  price_cents: number;
  background_image_url: string;
  form_prompt?: string;
  preview_prompt?: string;
  icon_url?: string;
  fitting_description?: string;
  display_order: number;
  is_active: boolean;
}

export function VariantsTab() {
  // Функция для парсинга значения (убирает единицы измерения)
  const parseNumericValue = (val: string | number | undefined | null): number | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d.,]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  // Функция для форматирования числа (без единиц измерения)
  const formatNumericValue = (val: string | number | undefined | null): string => {
    const num = parseNumericValue(val);
    return num !== null ? num.toFixed(2) : '—';
  };
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Variant>>({});
  const [uploadingIcon, setUploadingIcon] = useState<string | null>(null);
  const iconFileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchVariants = async () => {
    setLoading(true);
    const { data, error } = await api.listVariants();
    if (error) {
      toast.error('Ошибка загрузки вариантов');
      console.error(error);
    } else {
      setVariants(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const handleEdit = (variant: Variant) => {
    setEditingId(variant.id);
    setEditForm({
      diameter: parseNumericValue(variant.diameter) ?? '',
      weight: parseNumericValue(variant.weight) ?? '',
      volume: parseNumericValue(variant.volume) ?? '',
      thickness: parseNumericValue(variant.thickness) ?? '',
      price_cents: variant.price_cents,
      background_image_url: variant.background_image_url,
      form_prompt: variant.form_prompt,
      preview_prompt: variant.preview_prompt,
      icon_url: variant.icon_url,
      fitting_description: variant.fitting_description,
      display_order: variant.display_order,
      is_active: variant.is_active,
    });
  };

  const handleSave = async (id: string) => {
    // Конвертируем числа обратно в строки для сохранения в БД
    const updates: any = { ...editForm };
    if (typeof updates.diameter === 'number') {
      updates.diameter = updates.diameter.toString();
    }
    if (typeof updates.weight === 'number') {
      updates.weight = updates.weight.toString();
    }
    if (typeof updates.volume === 'number') {
      updates.volume = updates.volume.toString();
    }
    if (typeof updates.thickness === 'number') {
      updates.thickness = updates.thickness.toString();
    }
    
    const { error } = await api.updateVariant(id, updates);
    if (error) {
      toast.error('Ошибка сохранения');
      console.error('Save error:', error);
    } else {
      toast.success('Вариант обновлен');
      setEditingId(null);
      fetchVariants();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить вариант?')) return;
    const { error } = await api.deleteVariant(id);
    if (error) {
      toast.error('Ошибка удаления');
    } else {
      toast.success('Вариант удален');
      fetchVariants();
    }
  };

  const handleCreate = async () => {
    const newVariant = {
      size: 'standard',
      material: 'silver',
      diameter: '2.02 см',
      price_cents: 980000,
      background_image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=800&fit=crop',
      display_order: variants.length,
    };
    const { data, error } = await api.createVariant(newVariant);
    if (error) {
      toast.error('Ошибка создания');
    } else {
      toast.success('Вариант создан');
      fetchVariants();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Варианты размер/материал</CardTitle>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Создать вариант
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Размер</TableHead>
                  <TableHead>Материал</TableHead>
                  <TableHead>Диаметр</TableHead>
                  <TableHead>Вес</TableHead>
                  <TableHead>Объем</TableHead>
                  <TableHead>Толщина</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Фон</TableHead>
                  <TableHead>Иконка</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Порядок</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      Нет вариантов. Создайте первый вариант.
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((variant) => (
                    <>
                      <TableRow key={variant.id} className={!variant.is_active ? 'opacity-60' : ''}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{variant.size}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{variant.material}</Badge>
                        </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={parseNumericValue(editForm.diameter) ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, diameter: e.target.value ? parseFloat(e.target.value) : '' })}
                            className="w-24"
                          />
                        ) : (
                          formatNumericValue(variant.diameter)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={parseNumericValue(editForm.weight) ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, weight: e.target.value ? parseFloat(e.target.value) : '' })}
                            className="w-24"
                          />
                        ) : (
                          formatNumericValue(variant.weight)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={parseNumericValue(editForm.volume) ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, volume: e.target.value ? parseFloat(e.target.value) : '' })}
                            className="w-24"
                          />
                        ) : (
                          formatNumericValue(variant.volume)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={parseNumericValue(editForm.thickness) ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, thickness: e.target.value ? parseFloat(e.target.value) : '' })}
                            className="w-24"
                          />
                        ) : (
                          formatNumericValue(variant.thickness)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            type="number"
                            value={(editForm.price_cents || 0) / 100}
                            onChange={(e) => setEditForm({ ...editForm, price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                            className="w-32"
                            step="0.01"
                          />
                        ) : (
                          formatPrice(variant.price_cents / 100)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            value={editForm.background_image_url || ''}
                            onChange={(e) => setEditForm({ ...editForm, background_image_url: e.target.value })}
                            className="w-64"
                            placeholder="URL фона"
                          />
                        ) : (
                          <img
                            src={variant.background_image_url}
                            alt="Фон"
                            className="w-16 h-16 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editForm.icon_url || ''}
                              onChange={(e) => setEditForm({ ...editForm, icon_url: e.target.value })}
                              className="w-32"
                              placeholder="URL иконки"
                            />
                            <input
                              ref={(el) => { iconFileInputRef.current[variant.id] = el; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                setUploadingIcon(variant.id);
                                try {
                                  // Конвертируем файл в base64
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const base64 = event.target?.result as string;
                                    
                                    // Загружаем через API
                                    const { data, error } = await api.uploadImage({
                                      application_id: variant.id, // Используем variant.id как идентификатор
                                      image_data_url: base64,
                                      folder: 'icons'
                                    });
                                    
                                    if (error || !data?.image_url) {
                                      throw new Error(error || 'Не удалось загрузить иконку');
                                    }
                                    
                                    // Обновляем форму с новым URL
                                    setEditForm({ ...editForm, icon_url: data.image_url });
                                    toast.success('Иконка загружена');
                                  };
                                  reader.readAsDataURL(file);
                                } catch (error: any) {
                                  console.error('Upload error:', error);
                                  toast.error(error?.message || 'Ошибка загрузки иконки');
                                } finally {
                                  setUploadingIcon(null);
                                  // Сбрасываем input
                                  if (iconFileInputRef.current[variant.id]) {
                                    iconFileInputRef.current[variant.id]!.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => iconFileInputRef.current[variant.id]?.click()}
                              disabled={uploadingIcon === variant.id}
                              className="gap-1"
                            >
                              {uploadingIcon === variant.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3 w-3" />
                              )}
                            </Button>
                            {editForm.icon_url && (
                              <img
                                src={editForm.icon_url}
                                alt="Предпросмотр"
                                className="w-8 h-8 rounded object-contain border border-border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        ) : variant.icon_url ? (
                          <img
                            src={variant.icon_url}
                            alt="Иконка"
                            className="w-12 h-12 rounded object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            value={editForm.fitting_description || ''}
                            onChange={(e) => setEditForm({ ...editForm, fitting_description: e.target.value })}
                            className="w-48"
                            placeholder="Описание для примерки"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground max-w-xs truncate block">
                            {variant.fitting_description || '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <Input
                            type="number"
                            value={editForm.display_order || 0}
                            onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                            className="w-20"
                          />
                        ) : (
                          variant.display_order
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <select
                            value={editForm.is_active ? '1' : '0'}
                            onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === '1' })}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="1">Активен</option>
                            <option value="0">Неактивен</option>
                          </select>
                        ) : (
                          <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                            {variant.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === variant.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(variant.id)}
                              className="gap-1"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(variant)}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(variant.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      </TableRow>
                      {editingId === variant.id && (
                        <TableRow>
                          <TableCell colSpan={13} className="bg-muted/50 p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Промпт для формы</label>
                                <Textarea
                                  value={editForm.form_prompt || ''}
                                  onChange={(e) => setEditForm({ ...editForm, form_prompt: e.target.value })}
                                  placeholder="Промпт для генерации формы изделия"
                                  rows={3}
                                  className="font-mono text-xs"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Промпт для превью</label>
                                <Textarea
                                  value={editForm.preview_prompt || ''}
                                  onChange={(e) => setEditForm({ ...editForm, preview_prompt: e.target.value })}
                                  placeholder="Промпт для превью на человеке"
                                  rows={3}
                                  className="font-mono text-xs"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">URL иконки</label>
                                <Input
                                  value={editForm.icon_url || ''}
                                  onChange={(e) => setEditForm({ ...editForm, icon_url: e.target.value })}
                                  placeholder="URL иконки для выбора варианта"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Описание для примерки</label>
                                <Textarea
                                  value={editForm.fitting_description || ''}
                                  onChange={(e) => setEditForm({ ...editForm, fitting_description: e.target.value })}
                                  placeholder="Например: На шее женщины и шнурке черном"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

