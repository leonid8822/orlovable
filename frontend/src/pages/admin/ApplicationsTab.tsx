import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, RefreshCw, Edit2, ExternalLink, ChevronLeft, ChevronRight, Download, User, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Generation {
  id: string;
  created_at: string;
  output_images: string[];
  cost_cents?: number | null;
  model_used?: string | null;
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
  size_option: string | null;
  user_comment: string | null;
  generated_preview: string | null;
  generated_images?: string[];
  generations?: Generation[];
  input_image_url?: string | null;
  theme?: string | null;
  has_back_engraving?: boolean;
  back_comment?: string | null;
  gems?: any[] | null;
  customer_name?: string | null;
  customer_email?: string | null;
  paid_at?: string | null;
  submitted_at?: string | null;
}

const PAGE_SIZE = 20;

interface Client {
  id: string;
  email: string;
  name: string | null;
}

export default function ApplicationsTab() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [editingApplication, setEditingApplication] = useState<Partial<Application>>({});
  const [savingApplication, setSavingApplication] = useState(false);
  const [importingToGallery, setImportingToGallery] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Clients for linking
  const [clients, setClients] = useState<Client[]>([]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchApplications = useCallback(async (page: number = 1, status: string = 'all') => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;

    const result = await api.listApplications({
      limit: PAGE_SIZE,
      offset,
      status: status !== 'all' ? status : undefined
    });

    if (result.error) {
      console.error('Error fetching applications:', result.error);
      toast.error('Ошибка загрузки заявок');
    } else {
      setApplications(result.data);
      setTotal(result.total);
      setHasMore(result.hasMore);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchApplications]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openApplicationDetail = async (app: Application) => {
    // Fetch application and clients in parallel
    const [appResult, clientsResult] = await Promise.all([
      api.getApplication(app.id),
      api.listClients()
    ]);

    if (appResult.error) {
      toast.error('Ошибка загрузки заявки');
      return;
    }

    const data = appResult.data;
    setSelectedApplication(data);
    setClients(clientsResult.data || []);
    setEditingApplication({
      status: data.status,
      form_factor: data.form_factor,
      material: data.material,
      size: data.size,
      generated_preview: data.generated_preview,
      theme: data.theme || 'main',
      user_id: data.user_id,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
    });
  };

  const saveApplicationChanges = async () => {
    if (!selectedApplication) return;

    setSavingApplication(true);
    const { error } = await api.updateApplication(selectedApplication.id, editingApplication);

    if (error) {
      toast.error('Ошибка сохранения');
      setSavingApplication(false);
      return;
    }

    setApplications(prev => prev.map(app =>
      app.id === selectedApplication.id
        ? { ...app, ...editingApplication }
        : app
    ));

    toast.success('Заявка обновлена');
    setSavingApplication(false);
    setSelectedApplication(null);
  };

  const importToGallery = async () => {
    if (!selectedApplication) return;

    setImportingToGallery(true);
    const { data, error } = await api.importApplicationToExample(
      selectedApplication.id,
      selectedApplication.user_comment || `Заявка ${selectedApplication.id.slice(0, 8)}`,
      undefined,
      selectedApplication.theme || 'main'
    );

    if (error) {
      toast.error('Ошибка импорта в галерею');
    } else {
      toast.success('Добавлено в галерею примеров');
    }
    setImportingToGallery(false);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      generating: 'bg-yellow-500/20 text-yellow-500',
      generated: 'bg-blue-500/20 text-blue-500',
      completed: 'bg-green-500/20 text-green-500',
      submitted: 'bg-purple-500/20 text-purple-500',
    };
    const statusLabels: Record<string, string> = {
      draft: 'Черновик',
      generating: 'Генерация',
      generated: 'Готово',
      completed: 'Завершено',
      submitted: 'Отправлено',
    };
    return (
      <Badge className={statusColors[status] || 'bg-muted'}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего заявок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              На странице
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Текущая страница
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPage} / {totalPages || 1}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              С клиентом
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(a => a.customer_email || a.user_id).length}
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
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="generating">Генерация</SelectItem>
                  <SelectItem value="generated">Готово</SelectItem>
                  <SelectItem value="submitted">Отправлено</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => fetchApplications(currentPage, statusFilter)} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Заявки</CardTitle>
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {currentPage} из {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
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
                    <TableHead>Статус</TableHead>
                    <TableHead>Форма</TableHead>
                    <TableHead>Клиент</TableHead>
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
                        {app.customer_email || app.customer_name ? (
                          <div className="text-xs">
                            <div className="font-medium">{app.customer_name || '—'}</div>
                            <div className="text-muted-foreground">{app.customer_email || '—'}</div>
                          </div>
                        ) : app.user_id ? (
                          <Badge className="bg-green-500/20 text-green-500">Зарег.</Badge>
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

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Показано {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, total)} из {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1 || loading}
                >
                  В начало
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasMore || loading}
                >
                  Вперёд
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Превью</DialogTitle>
            </DialogHeader>
            <img src={selectedImage} alt="Preview" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Заявка {selectedApplication.id.slice(0, 8)}...
                {getStatusBadge(selectedApplication.status)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <div className="font-mono text-xs break-all">{selectedApplication.id}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Создана:</span>
                  <div>{format(new Date(selectedApplication.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Обновлена:</span>
                  <div>{format(new Date(selectedApplication.updated_at), 'dd MMM yyyy HH:mm', { locale: ru })}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Шаг:</span>
                  <div>{selectedApplication.current_step}</div>
                </div>
              </div>

              {/* Client Info - Editable */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Клиент
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Link to existing client */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Привязать к клиенту</Label>
                    <Select
                      value={editingApplication.user_id || ''}
                      onValueChange={(value) => {
                        const client = clients.find(c => c.id === value);
                        setEditingApplication(prev => ({
                          ...prev,
                          user_id: value || null,
                          customer_name: client?.name || prev.customer_name,
                          customer_email: client?.email || prev.customer_email,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Не привязан</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name || client.email} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Manual customer info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Имя</Label>
                      <Input
                        value={editingApplication.customer_name || ''}
                        onChange={(e) => setEditingApplication(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Имя клиента"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input
                        value={editingApplication.customer_email || ''}
                        onChange={(e) => setEditingApplication(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  {/* Current link info */}
                  {selectedApplication.paid_at && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Оплачено:</span>{' '}
                      <span className="text-green-500">{format(new Date(selectedApplication.paid_at), 'dd MMM yyyy HH:mm', { locale: ru })}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Source Image and Generated Images */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Source Image */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Исходник
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplication.input_image_url ? (
                      <img
                        src={selectedApplication.input_image_url}
                        alt="Исходник"
                        className="w-full rounded-lg cursor-pointer hover:ring-2 ring-primary transition-all"
                        onClick={() => setSelectedImage(selectedApplication.input_image_url!)}
                      />
                    ) : (
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                        Нет изображения
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Generations */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Все генерации ({selectedApplication.generations?.length || 0})
                      <span className="text-xs text-muted-foreground ml-2">клик для выбора</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedApplication.generations && selectedApplication.generations.length > 0 ? (
                      selectedApplication.generations.map((gen, genIdx) => (
                        <div key={gen.id} className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Генерация #{selectedApplication.generations!.length - genIdx}{' '}
                              ({format(new Date(gen.created_at), 'dd MMM HH:mm', { locale: ru })})
                            </span>
                            <span>{gen.cost_cents ? `${gen.cost_cents}¢` : ''}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {gen.output_images.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Вариант ${idx + 1}`}
                                className={`rounded-lg cursor-pointer transition-all aspect-square object-cover ${
                                  editingApplication.generated_preview === url
                                    ? 'ring-4 ring-primary'
                                    : 'hover:ring-2 ring-primary/50'
                                }`}
                                onClick={() => setEditingApplication(prev => ({ ...prev, generated_preview: url }))}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    ) : selectedApplication.generated_images && selectedApplication.generated_images.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedApplication.generated_images.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Вариант ${idx + 1}`}
                            className={`rounded-lg cursor-pointer transition-all aspect-square object-cover ${
                              editingApplication.generated_preview === url
                                ? 'ring-4 ring-primary'
                                : 'hover:ring-2 ring-primary/50'
                            }`}
                            onClick={() => setEditingApplication(prev => ({ ...prev, generated_preview: url }))}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                        Нет сгенерированных изображений
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Product Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Параметры изделия</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Статус</Label>
                    <Select
                      value={editingApplication.status || selectedApplication.status}
                      onValueChange={(value) => setEditingApplication(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Черновик</SelectItem>
                        <SelectItem value="generating">Генерация</SelectItem>
                        <SelectItem value="generated">Готово</SelectItem>
                        <SelectItem value="submitted">Отправлено</SelectItem>
                        <SelectItem value="completed">Завершено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Форма</Label>
                    <Select
                      value={editingApplication.form_factor || selectedApplication.form_factor || ''}
                      onValueChange={(value) => setEditingApplication(prev => ({ ...prev, form_factor: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Не выбрано" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">Круглый</SelectItem>
                        <SelectItem value="oval">Жетон</SelectItem>
                        <SelectItem value="contour">Контурный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Материал</Label>
                    <Select
                      value={editingApplication.material || selectedApplication.material || ''}
                      onValueChange={(value) => setEditingApplication(prev => ({ ...prev, material: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Не выбрано" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silver">Серебро</SelectItem>
                        <SelectItem value="gold">Золото</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Тема</Label>
                    <Select
                      value={editingApplication.theme || selectedApplication.theme || 'main'}
                      onValueChange={(value) => setEditingApplication(prev => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Основная</SelectItem>
                        <SelectItem value="kids">Детская</SelectItem>
                        <SelectItem value="totems">Тотемы</SelectItem>
                        <SelectItem value="custom">3D объекты</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Comment */}
              {selectedApplication.user_comment && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Комментарий пользователя</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedApplication.user_comment}</p>
                  </CardContent>
                </Card>
              )}

              {/* Engraving */}
              {selectedApplication.has_back_engraving && selectedApplication.back_comment && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Гравировка на обороте</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{selectedApplication.back_comment}</p>
                  </CardContent>
                </Card>
              )}

              {/* Gems */}
              {selectedApplication.gems && selectedApplication.gems.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Камни ({selectedApplication.gems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(selectedApplication.gems, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-between border-t pt-4">
                <Button
                  variant="outline"
                  onClick={importToGallery}
                  disabled={importingToGallery || !selectedApplication.generated_preview}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {importingToGallery ? 'Импорт...' : 'В галерею примеров'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                    Отмена
                  </Button>
                  <Button onClick={saveApplicationChanges} disabled={savingApplication}>
                    {savingApplication ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
