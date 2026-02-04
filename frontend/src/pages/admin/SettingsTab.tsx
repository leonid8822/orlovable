import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';

interface FormFactorSettings {
  label: string;
  description: string;
  icon: string;
  addition: string;
  shape: string;
  gender?: 'male' | 'female';
}

interface SizeSettings {
  label: string;
  dimensionsMm: number;
  apiSize: string;
  price: number;
  depositPercent?: number;
}

interface MaterialSettings {
  label: string;
  enabled: boolean;
}

interface VisualizationSettings {
  imageWidthMm: number;
  female: { attachX: number; attachY: number };
  male: { attachX: number; attachY: number };
}

interface ModelInfo {
  label: string;
  description: string;
  cost_per_image_cents: number;
}

interface SettingsMap {
  main_prompt: string;
  main_prompt_no_image: string;
  num_images: number;
  form_factors: Record<string, FormFactorSettings>;
  sizes: Record<string, Record<string, SizeSettings>>;
  materials: Record<string, MaterialSettings>;
  visualization: VisualizationSettings;
  generation_model?: string;
  available_models?: Record<string, ModelInfo>;
  flat_pendant_prompt?: string;
  volumetric_pendant_prompt?: string;
}

export default function SettingsTab() {
  const { refetch: refetchGlobalSettings } = useSettings();
  const [settings, setSettings] = useState<SettingsMap>({
    main_prompt: '',
    main_prompt_no_image: '',
    num_images: 4,
    form_factors: {},
    sizes: {},
    materials: {},
    visualization: {
      imageWidthMm: 250,
      female: { attachX: 0.5, attachY: 0.5 },
      male: { attachX: 0.5, attachY: 0.75 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await api.getSettings();

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('Ошибка загрузки настроек');
    } else if (data) {
      setSettings(prev => ({ ...prev, ...data }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await api.updateSettings(settings);

    if (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка сохранения настроек');
    } else {
      await refetchGlobalSettings();
      toast.success('Настройки сохранены');
    }
    setSaving(false);
  };

  const updateFormFactor = (key: string, field: keyof FormFactorSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      form_factors: {
        ...prev.form_factors,
        [key]: { ...prev.form_factors[key], [field]: value }
      }
    }));
  };

  const updateSize = (material: string, sizeKey: string, field: keyof SizeSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [material]: {
          ...prev.sizes[material],
          [sizeKey]: { ...prev.sizes[material]?.[sizeKey], [field]: value }
        }
      }
    }));
  };

  const updateMaterial = (key: string, field: keyof MaterialSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      materials: {
        ...prev.materials,
        [key]: { ...prev.materials[key], [field]: value }
      }
    }));
  };

  const addFormFactor = () => {
    const newKey = `form_${Date.now()}`;
    setSettings(prev => ({
      ...prev,
      form_factors: {
        ...prev.form_factors,
        [newKey]: {
          label: 'Новая форма',
          description: 'Описание',
          icon: 'circle',
          addition: '',
          shape: ''
        }
      }
    }));
  };

  const deleteFormFactor = (key: string) => {
    setSettings(prev => {
      const { [key]: _, ...rest } = prev.form_factors;
      return { ...prev, form_factors: rest };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generation Model & Num Images */}
      <Card>
        <CardHeader>
          <CardTitle>AI-модель генерации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Модель</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(settings.available_models || {
                'seedream': { label: 'Seedream v4', description: 'Bytedance SeedDream - хорошая детализация', cost_per_image_cents: 3 },
                'flux-kontext': { label: 'Flux Kontext', description: 'Black Forest Labs - качественное редактирование', cost_per_image_cents: 4 },
                'nano-banana': { label: 'Nano Banana', description: 'Google - быстрая генерация', cost_per_image_cents: 3 }
              }).map(([key, model]) => (
                <div
                  key={key}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    (settings.generation_model || 'seedream') === key
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, generation_model: key }))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{model.label}</span>
                    <Badge variant="secondary">{model.cost_per_image_cents}¢/img</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Количество изображений</label>
              <Select
                value={String(settings.num_images)}
                onValueChange={(v) => setSettings(prev => ({ ...prev, num_images: parseInt(v) }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">
              Количество вариантов за одну генерацию
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Flat Pendant Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>
            Промпт для плоских кулонов (Flat Pendant)
            <Badge variant="secondary" className="ml-2">English</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.flat_pendant_prompt || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, flat_pendant_prompt: e.target.value }))}
            rows={12}
            className="font-mono text-sm"
            placeholder="Prompt for flat medallion-style pendants..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Переменные: {'{form_label}'}, {'{user_wishes}'}, {'{form_addition}'}, {'{form_shape}'}
          </p>
        </CardContent>
      </Card>

      {/* Volumetric Pendant Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>
            Промпт для объёмных 3D объектов (Volumetric)
            <Badge variant="secondary" className="ml-2">English</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.volumetric_pendant_prompt || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, volumetric_pendant_prompt: e.target.value }))}
            rows={12}
            className="font-mono text-sm"
            placeholder="Prompt for volumetric 3D sculpture pendants..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Переменные: {'{object_description}'}, {'{user_wishes}'}, {'{size_dimensions}'}
          </p>
        </CardContent>
      </Card>

      {/* Legacy prompts */}
      <details className="border rounded-lg p-4">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Устаревшие промпты (для совместимости)
        </summary>
        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Основной промпт (legacy)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.main_prompt}
                onChange={(e) => setSettings(prev => ({ ...prev, main_prompt: e.target.value }))}
                rows={6}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Промпт без изображения (legacy)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.main_prompt_no_image}
                onChange={(e) => setSettings(prev => ({ ...prev, main_prompt_no_image: e.target.value }))}
                rows={6}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
        </div>
      </details>

      {/* Form Factors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Форм-факторы</CardTitle>
          <Button onClick={addFormFactor} size="sm" variant="outline">
            + Добавить форму
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.form_factors).map(([key, value]) => (
            <div key={key} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Badge>{key}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteFormFactor(key)}
                >
                  Удалить
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Название</label>
                  <Input
                    value={value.label}
                    onChange={(e) => updateFormFactor(key, 'label', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Описание</label>
                  <Input
                    value={value.description || ''}
                    onChange={(e) => updateFormFactor(key, 'description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Шея для визуализации</label>
                  <Select
                    value={value.gender || 'female'}
                    onValueChange={(v) => updateFormFactor(key, 'gender', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Женская</SelectItem>
                      <SelectItem value="male">Мужская</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Дополнение к промпту</label>
                  <Textarea
                    value={value.addition || ''}
                    onChange={(e) => updateFormFactor(key, 'addition', e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Описание формы (shape)</label>
                  <Textarea
                    value={value.shape || ''}
                    onChange={(e) => updateFormFactor(key, 'shape', e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.materials || {}).map(([key, value]) => (
            <div key={key} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={value.enabled ? 'default' : 'secondary'}>{key}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Название</label>
                  <Input
                    value={value.label}
                    onChange={(e) => updateMaterial(key, 'label', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Включен</label>
                  <Select
                    value={value.enabled ? 'true' : 'false'}
                    onValueChange={(v) => updateMaterial(key, 'enabled', v === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Да</SelectItem>
                      <SelectItem value="false">Нет (Скоро)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sizes by Material */}
      <Card>
        <CardHeader>
          <CardTitle>Размеры и цены</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(settings.sizes || {}).map(([materialKey, materialSizes]) => (
            <div key={materialKey} className="space-y-4">
              <h4 className="font-medium text-lg border-b pb-2">
                {settings.materials?.[materialKey]?.label || materialKey}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(materialSizes || {}).map(([sizeKey, sizeValue]) => (
                  <div key={sizeKey} className="p-4 border rounded-lg space-y-3">
                    <Badge>{sizeKey.toUpperCase()}</Badge>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Название</label>
                      <Input
                        value={sizeValue.label}
                        onChange={(e) => updateSize(materialKey, sizeKey, 'label', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Размер (мм)</label>
                      <Input
                        type="number"
                        value={sizeValue.dimensionsMm}
                        onChange={(e) => updateSize(materialKey, sizeKey, 'dimensionsMm', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Цена ()</label>
                      <Input
                        type="number"
                        value={sizeValue.price}
                        onChange={(e) => updateSize(materialKey, sizeKey, 'price', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Предоплата (%)</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={sizeValue.depositPercent ?? (materialKey === 'gold' ? 30 : 50)}
                        onChange={(e) => updateSize(materialKey, sizeKey, 'depositPercent', parseInt(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground">
                        = {Math.round(sizeValue.price * (sizeValue.depositPercent ?? (materialKey === 'gold' ? 30 : 50)) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </div>
    </div>
  );
}
