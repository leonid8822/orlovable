import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Filter, RefreshCw, ArrowLeft, Settings, Save, History, FileText, ExternalLink, Image, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { ExamplesTab } from '@/components/admin/ExamplesTab';

interface Generation {
  id: string;
  created_at: string;
  form_factor: string;
  material: string;
  size: string;
  model_used: string | null;
  cost_cents: number | null;
  user_comment: string | null;
  output_images: string[];
  prompt_used: string;
  application_id: string | null;
  execution_time_ms: number | null;
}

interface Application {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  session_id: string | null;
  current_step: number;
  status: string;
  form_factor: string | null;
  material: string | null;
  size: string | null;
  user_comment: string | null;
  generated_preview: string | null;
}

interface FormFactorSettings {
  label: string;
  description: string;
  icon: string;
  addition: string;
  shape: string;
}

interface SizeSettings {
  label: string;
  dimensionsMm: number;
  apiSize: string;
  price: number;
}

interface MaterialSettings {
  label: string;
  enabled: boolean;
}

interface SettingsMap {
  main_prompt: string;
  main_prompt_no_image: string;
  num_images: number;
  form_factors: Record<string, FormFactorSettings>;
  sizes: Record<string, Record<string, SizeSettings>>;
  materials: Record<string, MaterialSettings>;
}

const Admin = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Settings state
  const [settings, setSettings] = useState<SettingsMap>({
    main_prompt: '',
    main_prompt_no_image: '',
    num_images: 4,
    form_factors: {},
    sizes: {},
    materials: {},
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchGenerations = async () => {
    setLoading(true);
    // Note: api.getHistory() currently returns recent 20 generations. 
    // To support full filtering as in the original code, we would need to enhance the backend API 
    // to accept query parameters (dateFrom, dateTo, model, cost).
    // For this rewrite MVP, we'll fetch the default history.

    // TODO: Update backend to support filtering
    const { data, error } = await api.getHistory();

    if (error) {
      console.error('Error fetching generations:', error);
    } else {
      setGenerations(data || []);
    }
    setLoading(false);
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    // Similar to generations, we use the simple list endpoint for now.
    // TODO: Update backend to support status filtering
    const { data, error } = await api.listApplications();

    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      setApplications(data || []);
    }
    setLoadingApps(false);
  };

  const fetchSettings = async () => {
    const { data, error } = await api.getSettings();

    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setSettings(prev => ({ ...prev, ...data }));
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);

    const { error } = await api.updateSettings(settings); // Send the whole settings object, API handles it

    if (error) {
      console.error(`Error updating settings:`, error);
      toast.error(`Ошибка сохранения настроек`);
      setSavingSettings(false);
      return;
    }

    toast.success('Настройки сохранены');
    setSavingSettings(false);
  };

  useEffect(() => {
    fetchGenerations();
    fetchApplications();
    fetchSettings();
  }, []);

  const totalCost = generations.reduce((sum, g) => sum + (g.cost_cents || 0), 0);
  const uniqueModels = [...new Set(generations.map(g => g.model_used).filter(Boolean))];

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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      generating: 'bg-yellow-500/20 text-yellow-500',
      generated: 'bg-blue-500/20 text-blue-500',
      completed: 'bg-green-500/20 text-green-500',
    };
    return (
      <Badge className={statusColors[status] || 'bg-muted'}>
        {status}
      </Badge>
    );
  };

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
              <h1 className="text-3xl font-display font-bold text-foreground">
                Админ-панель
              </h1>
              <p className="text-muted-foreground">
                Управление заявками, генерациями и настройками
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="h-4 w-4" />
              Заявки
            </TabsTrigger>
            <TabsTrigger value="generations" className="gap-2">
              <History className="h-4 w-4" />
              Генерации
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-2">
              <Image className="h-4 w-4" />
              Примеры
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Всего заявок
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applications.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    В процессе
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'generating' || a.status === 'generated').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    С пользователем
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(a => a.user_id).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Завершено
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'completed').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Фильтры
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Статус</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Все статусы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        <SelectItem value="draft">Черновик</SelectItem>
                        <SelectItem value="generating">Генерация</SelectItem>
                        <SelectItem value="generated">Сгенерировано</SelectItem>
                        <SelectItem value="completed">Завершено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={fetchApplications} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loadingApps ? 'animate-spin' : ''}`} />
                    Обновить
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Заявки</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingApps ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет заявок
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Превью</TableHead>
                          <TableHead>Шаг</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Форма</TableHead>
                          <TableHead>Пользователь</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-mono text-xs">
                              {app.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(app.created_at), 'dd MMM HH:mm', { locale: ru })}
                              </div>
                            </TableCell>
                            <TableCell>
                              {app.generated_preview ? (
                                <img
                                  src={app.generated_preview}
                                  alt="Превью"
                                  className="w-10 h-10 rounded object-cover cursor-pointer hover:ring-2 ring-primary transition-all"
                                  onClick={() => setSelectedImage(app.generated_preview)}
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{app.current_step}/4</Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(app.status)}
                            </TableCell>
                            <TableCell>
                              {app.form_factor ? (
                                <Badge variant="secondary">
                                  {app.form_factor === 'round' ? 'Круглый' : 'Контурный'}
                                </Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {app.user_id ? (
                                <Badge className="bg-green-500/20 text-green-500">Да</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">Гость</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link to={`/application/${app.id}`} target="_blank">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generations Tab */}
          <TabsContent value="generations" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Всего генераций
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generations.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Общая стоимость
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(totalCost / 100).toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Средняя стоимость
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${generations.length > 0 ? ((totalCost / generations.length) / 100).toFixed(2) : '0.00'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Изображений создано
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {generations.reduce((sum, g) => sum + (g.output_images?.length || 0), 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Фильтры
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Дата от</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Дата до</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Модель</label>
                    <Select value={modelFilter} onValueChange={setModelFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Все модели" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все модели</SelectItem>
                        {uniqueModels.map((model) => (
                          <SelectItem key={model} value={model || ''}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Мин. стоимость (¢)</label>
                    <Input
                      type="number"
                      value={minCost}
                      onChange={(e) => setMinCost(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Макс. стоимость (¢)</label>
                    <Input
                      type="number"
                      value={maxCost}
                      onChange={(e) => setMaxCost(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={fetchGenerations} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Применить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setModelFilter('all');
                      setMinCost('');
                      setMaxCost('');
                      fetchGenerations();
                    }}
                  >
                    Сбросить
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>История генераций</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : generations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет данных для отображения
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Дата</TableHead>
                          <TableHead>Превью</TableHead>
                          <TableHead>Заявка</TableHead>
                          <TableHead>Форма</TableHead>
                          <TableHead>Размер</TableHead>
                          <TableHead>Модель</TableHead>
                          <TableHead>Время</TableHead>
                          <TableHead>Стоимость</TableHead>
                          <TableHead>Комментарий</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generations.map((gen) => (
                          <TableRow key={gen.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(gen.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {gen.output_images?.slice(0, 4).map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`Вариант ${idx + 1}`}
                                    className="w-10 h-10 rounded object-cover cursor-pointer hover:ring-2 ring-primary transition-all"
                                    onClick={() => setSelectedImage(url)}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {gen.application_id ? (
                                <Link to={`/application/${gen.application_id}`} target="_blank">
                                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                    {gen.application_id.slice(0, 8)}...
                                  </Badge>
                                </Link>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {gen.form_factor === 'round' ? 'Круглый' : 'Контурный'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {gen.size === 'pendant' ? 'Кулон' : gen.size === 'bracelet' ? 'Браслет' : 'Интерьер'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {gen.model_used || '—'}
                              </code>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs">
                                {gen.execution_time_ms ? `${(gen.execution_time_ms / 1000).toFixed(1)}с` : '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono">
                                {gen.cost_cents ? `${gen.cost_cents}¢` : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {gen.user_comment || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <ExamplesTab />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Num Images */}
            <Card>
              <CardHeader>
                <CardTitle>Количество изображений</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
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
                  <span className="text-sm text-muted-foreground">
                    Количество вариантов за одну генерацию
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Main Prompts */}
            <Card>
              <CardHeader>
                <CardTitle>Основной промпт (с изображением)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.main_prompt}
                  onChange={(e) => setSettings(prev => ({ ...prev, main_prompt: e.target.value }))}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="Промпт для генерации с референсом..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Переменные: {'{user_comment}'}, {'{form_addition}'}, {'{form_shape}'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Промпт без изображения</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.main_prompt_no_image}
                  onChange={(e) => setSettings(prev => ({ ...prev, main_prompt_no_image: e.target.value }))}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="Промпт для генерации без референса..."
                />
              </CardContent>
            </Card>

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
                        <label className="text-sm text-muted-foreground">Иконка (lucide)</label>
                        <Select
                          value={value.icon || 'circle'}
                          onValueChange={(v) => updateFormFactor(key, 'icon', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="circle">Circle (круг)</SelectItem>
                            <SelectItem value="hexagon">Hexagon (шестиугольник)</SelectItem>
                            <SelectItem value="rectangle-vertical">Rectangle (прямоугольник)</SelectItem>
                            <SelectItem value="square">Square (квадрат)</SelectItem>
                            <SelectItem value="star">Star (звезда)</SelectItem>
                            <SelectItem value="heart">Heart (сердце)</SelectItem>
                            <SelectItem value="diamond">Diamond (ромб)</SelectItem>
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
                            <label className="text-sm text-muted-foreground">API Size</label>
                            <Input
                              value={sizeValue.apiSize}
                              onChange={(e) => updateSize(materialKey, sizeKey, 'apiSize', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Цена (₽)</label>
                            <Input
                              type="number"
                              value={sizeValue.price}
                              onChange={(e) => updateSize(materialKey, sizeKey, 'price', parseInt(e.target.value) || 0)}
                            />
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
                disabled={savingSettings}
                size="lg"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="Превью"
              className="max-w-full max-h-full rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
