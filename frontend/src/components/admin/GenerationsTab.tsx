import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Filter, RefreshCw } from "lucide-react";

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

export function GenerationsTab() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] =
    useState<Generation | null>(null);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.getHistory();
    if (error) {
      console.error("Error fetching generations:", error);
    } else {
      setGenerations(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setModelFilter("all");
    setMinCost("");
    setMaxCost("");
    fetchGenerations();
  };

  const totalCost = generations.reduce((sum, g) => sum + (g.cost_cents || 0), 0);
  const uniqueModels = [
    ...new Set(generations.map((g) => g.model_used).filter(Boolean)),
  ];

  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold">
              ${(totalCost / 100).toFixed(2)}
            </div>
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
              $
              {generations.length > 0
                ? (totalCost / generations.length / 100).toFixed(2)
                : "0.00"}
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
              {generations.reduce(
                (sum, g) => sum + (g.output_images?.length || 0),
                0
              )}
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
                    <SelectItem key={model} value={model || ""}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Мин. стоимость (¢)
              </label>
              <Input
                type="number"
                value={minCost}
                onChange={(e) => setMinCost(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Макс. стоимость (¢)
              </label>
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
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Применить
            </Button>
            <Button variant="outline" onClick={resetFilters}>
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
                          {format(
                            new Date(gen.created_at),
                            "dd MMM yyyy HH:mm",
                            { locale: ru }
                          )}
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
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
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
                          <Link
                            to={`/application/${gen.application_id}`}
                            target="_blank"
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-accent"
                            >
                              {gen.application_id.slice(0, 8)}...
                            </Badge>
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {gen.form_factor === "round"
                            ? "Круглый"
                            : gen.form_factor === "oval"
                            ? "Жетон"
                            : "Контурный"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {gen.cost_cents ? `${gen.cost_cents}¢` : "—"}
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Исходное изображение
                  </h3>
                  {selectedGeneration.input_image_url ? (
                    <img
                      src={selectedGeneration.input_image_url}
                      alt="Исходник"
                      className="w-full max-w-xs rounded-lg border cursor-pointer"
                      onClick={() =>
                        setSelectedImage(selectedGeneration.input_image_url)
                      }
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      Нет изображения (text-to-image)
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Результаты генерации
                  </h3>
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
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Дата
                    </h3>
                    <p>
                      {format(
                        new Date(selectedGeneration.created_at),
                        "dd MMM yyyy HH:mm:ss",
                        { locale: ru }
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      ID
                    </h3>
                    <code className="text-xs">{selectedGeneration.id}</code>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Форма
                    </h3>
                    <Badge variant="outline">
                      {selectedGeneration.form_factor === "round"
                        ? "Круглый"
                        : selectedGeneration.form_factor === "oval"
                        ? "Жетон"
                        : "Контурный"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Размер
                    </h3>
                    <Badge variant="secondary">
                      {selectedGeneration.size === "pendant"
                        ? "Кулон"
                        : selectedGeneration.size === "bracelet"
                        ? "Браслет"
                        : "Интерьер"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Материал
                    </h3>
                    <Badge>{selectedGeneration.material}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Стоимость
                    </h3>
                    <p className="font-mono text-lg">
                      {selectedGeneration.cost_cents
                        ? `${selectedGeneration.cost_cents}¢`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Время
                    </h3>
                    <p className="font-mono">
                      {selectedGeneration.execution_time_ms
                        ? `${(selectedGeneration.execution_time_ms / 1000).toFixed(1)}с`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Модель
                    </h3>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {selectedGeneration.model_used || "—"}
                    </code>
                  </div>
                </div>

                {selectedGeneration.application_id && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Заявка
                    </h3>
                    <Link
                      to={`/application/${selectedGeneration.application_id}`}
                      target="_blank"
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                      >
                        {selectedGeneration.application_id}
                      </Badge>
                    </Link>
                  </div>
                )}

                {selectedGeneration.user_comment && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Комментарий пользователя
                    </h3>
                    <p className="text-sm bg-muted p-2 rounded">
                      {selectedGeneration.user_comment}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Промпт
                  </h3>
                  <div className="bg-muted p-3 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {selectedGeneration.prompt_used || "Промпт не сохранён"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
