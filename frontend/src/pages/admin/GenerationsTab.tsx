import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  selected_preview?: string | null;
}

const PAGE_SIZE = 20;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface FalStatus {
  fal_configured: boolean;
  fal_accessible: boolean;
  balance: number | null;
  status?: string;
  error?: string;
}

export default function GenerationsTab() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // FAL status
  const [falStatus, setFalStatus] = useState<FalStatus | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchGenerations = async (page: number = 1) => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    const { data, total: totalCount, hasMore: more, error } = await api.getHistory({ limit: PAGE_SIZE, offset });

    if (error) {
      console.error('Error fetching generations:', error);
      toast.error('Ошибка загрузки генераций');
    } else {
      setGenerations(data || []);
      setTotal(totalCount);
      setHasMore(more);
    }
    setLoading(false);
  };

  const fetchFalStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health/fal-status`);
      const data = await response.json();
      setFalStatus(data);
    } catch (error) {
      console.error('Error fetching FAL status:', error);
    }
  };

  useEffect(() => {
    fetchGenerations(currentPage);
    fetchFalStatus();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSelectVariant = async (applicationId: string, imageUrl: string) => {
    try {
      const { error } = await api.updateApplication(applicationId, {
        generated_preview: imageUrl,
      });

      if (error) {
        toast.error('Ошибка при обновлении варианта');
      } else {
        toast.success('Вариант успешно выбран');
        await fetchGenerations();
      }
    } catch (err) {
      toast.error('Ошибка при обновлении варианта');
    }
  };

  const totalCost = generations.reduce((sum, g) => sum + (g.cost_cents || 0), 0);
  const uniqueModels = [...new Set(generations.map(g => g.model_used).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего генераций
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
            <div className="text-2xl font-bold">{generations.length}</div>
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
              Стоимость (страница)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalCost / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className={falStatus?.fal_accessible ? '' : 'border-destructive'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              FAL.ai Баланс
            </CardTitle>
          </CardHeader>
          <CardContent>
            {falStatus ? (
              <div className="text-2xl font-bold">
                {falStatus.balance !== null ? (
                  `$${falStatus.balance.toFixed(2)}`
                ) : falStatus.fal_accessible ? (
                  <span className="text-green-500">OK</span>
                ) : (
                  <span className="text-destructive text-sm">{falStatus.error || 'Ошибка'}</span>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">Загрузка...</div>
            )}
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
            <Button onClick={() => { setCurrentPage(1); fetchGenerations(1); }} className="gap-2">
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
                setCurrentPage(1);
                fetchGenerations(1);
              }}
            >
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>История генераций</CardTitle>
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
                          {gen.output_images?.slice(0, 4).map((url, idx) => {
                            const isSelected = gen.selected_preview === url;
                            return (
                              <div key={idx} className="relative group">
                                <img
                                  src={url}
                                  alt={`Вариант ${idx + 1}`}
                                  className={cn(
                                    "w-10 h-10 rounded object-cover cursor-pointer transition-all",
                                    isSelected
                                      ? "ring-2 ring-primary"
                                      : "hover:ring-2 hover:ring-primary/50"
                                  )}
                                  onClick={() => setSelectedImage(url)}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (gen.application_id) {
                                      handleSelectVariant(gen.application_id, url);
                                    }
                                  }}
                                />
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  {isSelected ? 'Текущий вариант' : 'ПКМ - выбрать вариант'}
                                </div>
                              </div>
                            );
                          })}
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

      {/* Generation Details Modal */}
      {selectedGeneration && (
        <Dialog open={!!selectedGeneration} onOpenChange={() => setSelectedGeneration(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Детали генерации</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <span className="font-mono">{selectedGeneration.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Дата:</span>{' '}
                  {format(new Date(selectedGeneration.created_at), 'dd MMM yyyy HH:mm:ss', { locale: ru })}
                </div>
                <div>
                  <span className="text-muted-foreground">Модель:</span>{' '}
                  {selectedGeneration.model_used || '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Стоимость:</span>{' '}
                  {selectedGeneration.cost_cents ? `${selectedGeneration.cost_cents}¢` : '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Время выполнения:</span>{' '}
                  {selectedGeneration.execution_time_ms ? `${(selectedGeneration.execution_time_ms / 1000).toFixed(1)}с` : '—'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Промпт:</span>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs whitespace-pre-wrap overflow-auto max-h-60">
                  {selectedGeneration.prompt_used}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
