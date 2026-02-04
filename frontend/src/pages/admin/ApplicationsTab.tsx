import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, RefreshCw, Edit2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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
  theme?: string | null;
  has_back_engraving?: boolean;
  customer_name?: string | null;
  customer_email?: string | null;
  paid_at?: string | null;
  submitted_at?: string | null;
}

const PAGE_SIZE = 20;

export default function ApplicationsTab() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [editingApplication, setEditingApplication] = useState<Partial<Application>>({});
  const [savingApplication, setSavingApplication] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Заявка {selectedApplication.id.slice(0, 8)}...
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Generated images grid */}
              {selectedApplication.generated_images && selectedApplication.generated_images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedApplication.generated_images.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Вариант ${idx + 1}`}
                      className={`rounded-lg cursor-pointer transition-all ${
                        editingApplication.generated_preview === url
                          ? 'ring-4 ring-primary'
                          : 'hover:ring-2 ring-primary/50'
                      }`}
                      onClick={() => setEditingApplication(prev => ({ ...prev, generated_preview: url }))}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                  Отмена
                </Button>
                <Button onClick={saveApplicationChanges} disabled={savingApplication}>
                  {savingApplication ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
