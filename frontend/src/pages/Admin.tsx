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
import { Calendar, Filter, RefreshCw, ArrowLeft, Settings, Save, History, FileText, ExternalLink, Image, Trash2, Plus, Edit2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { ExamplesTab } from '@/components/admin/ExamplesTab';
import { useSettings } from '@/contexts/SettingsContext';
import { AdminAuth } from '@/components/AdminAuth';

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
  input_image_url: string | null;
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
  input_image_url: string | null;
  generated_images?: string[];
  theme?: string | null;
}

interface FormFactorSettings {
  label: string;
  description: string;
  icon: string;
  addition: string;
  shape: string;
  gender?: 'male' | 'female'; // For neck visualization
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

interface VisualizationSettings {
  imageWidthMm: number;
  female: { attachX: number; attachY: number };
  male: { attachX: number; attachY: number };
}

interface SettingsMap {
  main_prompt: string;
  main_prompt_no_image: string;
  num_images: number;
  form_factors: Record<string, FormFactorSettings>;
  sizes: Record<string, Record<string, SizeSettings>>;
  materials: Record<string, MaterialSettings>;
  visualization: VisualizationSettings;
}

const Admin = () => {
  // Global settings context for refetching after save
  const { refetch: refetchGlobalSettings } = useSettings();

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
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [editingApplication, setEditingApplication] = useState<Partial<Application>>({});
  const [savingApplication, setSavingApplication] = useState(false);
  const [importingToExamples, setImportingToExamples] = useState(false);

  // Settings state
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

    // Refetch global settings so other components get the updated values
    await refetchGlobalSettings();

    toast.success('Настройки сохранены');
    setSavingSettings(false);
  };

  useEffect(() => {
    fetchGenerations();
    fetchApplications();
    fetchSettings();
  }, []);

  // Open application detail with full data
  const openApplicationDetail = async (app: Application) => {
    // Fetch full application data including generated_images
    const { data, error } = await api.getApplication(app.id);
    if (error) {
      toast.error('Ошибка загрузки заявки');
      return;
    }
    setSelectedApplication(data);
    setEditingApplication({
      status: data.status,
      form_factor: data.form_factor,
      material: data.material,
      size: data.size,
      generated_preview: data.generated_preview,
      theme: data.theme || 'main',
    });
  };

  // Save application changes
  const saveApplicationChanges = async () => {
    if (!selectedApplication) return;

    setSavingApplication(true);
    const { error } = await api.updateApplication(selectedApplication.id, editingApplication);

    if (error) {
      toast.error('Ошибка сохранения');
      setSavingApplication(false);
      return;
    }

    // Update local state
    setApplications(prev => prev.map(app =>
      app.id === selectedApplication.id
        ? { ...app, ...editingApplication }
        : app
    ));

    toast.success('Заявка обновлена');
    setSavingApplication(false);
    setSelectedApplication(null);
  };

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
                                  {app.form_factor === 'round' ? 'Круглый' : app.form_factor === 'oval' ? 'Жетон' : 'Контурный'}
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
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openApplicationDetail(app)}
                                  title="Редактировать"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Link to={`/application/${app.id}`} target="_blank">
                                  <Button variant="ghost" size="sm" title="Открыть">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
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
                          <TableHead>Исходник</TableHead>
                          <TableHead>Результат</TableHead>
                          <TableHead>Заявка</TableHead>
                          <TableHead>Форма</TableHead>
                          <TableHead>Стоимость</TableHead>
                          <TableHead>Детали</TableHead>
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
                              {gen.input_image_url ? (
                                <img
                                  src={gen.input_image_url}
                                  alt="Исходник"
                                  className="w-10 h-10 rounded object-cover cursor-pointer hover:ring-2 ring-primary transition-all"
                                  onClick={() => setSelectedImage(gen.input_image_url)}
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
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
                                {gen.form_factor === 'round' ? 'Круглый' : gen.form_factor === 'oval' ? 'Жетон' : 'Контурный'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono">
                                {gen.cost_cents ? `${gen.cost_cents}¢` : '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedGeneration(gen)}
                              >
                                Детали
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Visualization Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Визуализация кулона на шее</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Ширина превью (мм)</label>
                  <Input
                    type="number"
                    value={settings.visualization?.imageWidthMm || 250}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      visualization: {
                        ...prev.visualization,
                        imageWidthMm: parseInt(e.target.value) || 250
                      }
                    }))}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Сколько миллиметров представляет ширина картинки декольте
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Female attachment */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Женский силуэт</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">X (0-1)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settings.visualization?.female?.attachX ?? 0.5}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            visualization: {
                              ...prev.visualization,
                              female: {
                                ...prev.visualization?.female,
                                attachX: parseFloat(e.target.value) || 0.5
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Y (0-1)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settings.visualization?.female?.attachY ?? 0.5}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            visualization: {
                              ...prev.visualization,
                              female: {
                                ...prev.visualization?.female,
                                attachY: parseFloat(e.target.value) || 0.5
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Точка крепления кулона (0,0 = верхний левый угол, 1,1 = нижний правый)
                    </p>
                  </div>

                  {/* Male attachment */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Мужской силуэт</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">X (0-1)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settings.visualization?.male?.attachX ?? 0.5}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            visualization: {
                              ...prev.visualization,
                              male: {
                                ...prev.visualization?.male,
                                attachX: parseFloat(e.target.value) || 0.5
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Y (0-1)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settings.visualization?.male?.attachY ?? 0.75}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            visualization: {
                              ...prev.visualization,
                              male: {
                                ...prev.visualization?.male,
                                attachY: parseFloat(e.target.value) || 0.75
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Точка крепления кулона (0,0 = верхний левый угол, 1,1 = нижний правый)
                    </p>
                  </div>
                </div>
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

        {/* Generation Detail Modal */}
        {selectedGeneration && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedGeneration(null)}
          >
            <div
              className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Детали генерации</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGeneration(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - Images */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Исходное изображение</h3>
                    {selectedGeneration.input_image_url ? (
                      <img
                        src={selectedGeneration.input_image_url}
                        alt="Исходник"
                        className="w-full max-w-xs rounded-lg border cursor-pointer"
                        onClick={() => setSelectedImage(selectedGeneration.input_image_url)}
                      />
                    ) : (
                      <div className="text-muted-foreground">Нет изображения (text-to-image)</div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Результаты генерации</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedGeneration.output_images?.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Вариант ${idx + 1}`}
                          className="w-full rounded-lg border cursor-pointer hover:ring-2 ring-primary transition-all"
                          onClick={() => setSelectedImage(url)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column - Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Дата</h3>
                      <p>{format(new Date(selectedGeneration.created_at), 'dd MMM yyyy HH:mm:ss', { locale: ru })}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                      <code className="text-xs">{selectedGeneration.id}</code>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Форма</h3>
                      <Badge variant="outline">
                        {selectedGeneration.form_factor === 'round' ? 'Круглый' : selectedGeneration.form_factor === 'oval' ? 'Жетон' : 'Контурный'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Размер</h3>
                      <Badge variant="secondary">
                        {selectedGeneration.size === 'pendant' ? 'Кулон' : selectedGeneration.size === 'bracelet' ? 'Браслет' : 'Интерьер'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Материал</h3>
                      <Badge>{selectedGeneration.material}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Стоимость</h3>
                      <p className="font-mono text-lg">{selectedGeneration.cost_cents ? `${selectedGeneration.cost_cents}¢` : '—'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Время</h3>
                      <p className="font-mono">{selectedGeneration.execution_time_ms ? `${(selectedGeneration.execution_time_ms / 1000).toFixed(1)}с` : '—'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Модель</h3>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{selectedGeneration.model_used || '—'}</code>
                    </div>
                  </div>

                  {selectedGeneration.application_id && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Заявка</h3>
                      <Link to={`/application/${selectedGeneration.application_id}`} target="_blank">
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          {selectedGeneration.application_id}
                        </Badge>
                      </Link>
                    </div>
                  )}

                  {selectedGeneration.user_comment && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Комментарий пользователя</h3>
                      <p className="text-sm bg-muted p-2 rounded">{selectedGeneration.user_comment}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Промпт</h3>
                    <div className="bg-muted p-3 rounded-lg max-h-60 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono">
                        {selectedGeneration.prompt_used || 'Промпт не сохранён'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedApplication(null)}
          >
            <div
              className="bg-background rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Детали заявки</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - Images */}
                <div className="space-y-4">
                  {/* Input image */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Исходное изображение</h3>
                    {selectedApplication.input_image_url ? (
                      <img
                        src={selectedApplication.input_image_url}
                        alt="Исходник"
                        className="w-full max-w-xs rounded-lg border cursor-pointer"
                        onClick={() => setSelectedImage(selectedApplication.input_image_url)}
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm">Нет изображения</div>
                    )}
                  </div>

                  {/* Generated images */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Сгенерированные варианты
                      {selectedApplication.generated_images?.length ? ` (${selectedApplication.generated_images.length})` : ''}
                    </h3>
                    {selectedApplication.generated_images && selectedApplication.generated_images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedApplication.generated_images.map((url, idx) => (
                          <div
                            key={idx}
                            className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                              editingApplication.generated_preview === url
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'border-transparent hover:border-muted'
                            }`}
                            onClick={() => setEditingApplication(prev => ({ ...prev, generated_preview: url }))}
                          >
                            <img
                              src={url}
                              alt={`Вариант ${idx + 1}`}
                              className="w-full rounded-lg"
                            />
                            {editingApplication.generated_preview === url && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                                Выбран
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">Нет сгенерированных изображений</div>
                    )}
                  </div>
                </div>

                {/* Right column - Form fields */}
                <div className="space-y-4">
                  {/* Read-only info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                      <code className="text-xs">{selectedApplication.id}</code>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Дата создания</h3>
                      <p className="text-sm">{format(new Date(selectedApplication.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Шаг</h3>
                      <Badge variant="outline">{selectedApplication.current_step}/4</Badge>
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Редактируемые поля</h3>

                    {/* Theme */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Тема</label>
                      <Select
                        value={editingApplication.theme || selectedApplication.theme || 'main'}
                        onValueChange={(v) => setEditingApplication(prev => ({ ...prev, theme: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">main (Основной)</SelectItem>
                          <SelectItem value="kids">kids (Детский)</SelectItem>
                          <SelectItem value="totems">totems (Тотемы)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Статус</label>
                      <Select
                        value={editingApplication.status || ''}
                        onValueChange={(v) => setEditingApplication(prev => ({ ...prev, status: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">draft</SelectItem>
                          <SelectItem value="pending_generation">pending_generation</SelectItem>
                          <SelectItem value="generating">generating</SelectItem>
                          <SelectItem value="generated">generated</SelectItem>
                          <SelectItem value="checkout">checkout</SelectItem>
                          <SelectItem value="completed">completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Form factor */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Форма</label>
                      <Select
                        value={editingApplication.form_factor || ''}
                        onValueChange={(v) => setEditingApplication(prev => ({ ...prev, form_factor: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(settings.form_factors).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Material */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Материал</label>
                      <Select
                        value={editingApplication.material || ''}
                        onValueChange={(v) => setEditingApplication(prev => ({ ...prev, material: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(settings.materials).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Size */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Размер (API)</label>
                      <Select
                        value={editingApplication.size || ''}
                        onValueChange={(v) => setEditingApplication(prev => ({ ...prev, size: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bracelet">bracelet (S)</SelectItem>
                          <SelectItem value="pendant">pendant (M)</SelectItem>
                          <SelectItem value="interior">interior (L)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* User comment */}
                  {selectedApplication.user_comment && (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Комментарий пользователя</label>
                      <p className="text-sm bg-muted p-2 rounded">{selectedApplication.user_comment}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedApplication(null)}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={saveApplicationChanges}
                        disabled={savingApplication}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {savingApplication ? 'Сохранение...' : 'Сохранить изменения'}
                      </Button>
                    </div>

                    {/* Import to examples button */}
                    {selectedApplication.generated_preview && (
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          setImportingToExamples(true);
                          const theme = editingApplication.theme || selectedApplication.theme || 'main';
                          const { error } = await api.importApplicationToExample(
                            selectedApplication.id,
                            undefined,
                            undefined,
                            theme
                          );
                          if (error) {
                            toast.error('Ошибка импорта в примеры');
                          } else {
                            toast.success('Импортировано в примеры');
                          }
                          setImportingToExamples(false);
                        }}
                        disabled={importingToExamples}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {importingToExamples ? 'Импорт...' : 'Импортировать в примеры'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap with authentication
const AdminWithAuth = () => (
  <AdminAuth>
    <Admin />
  </AdminAuth>
);

export default AdminWithAuth;
