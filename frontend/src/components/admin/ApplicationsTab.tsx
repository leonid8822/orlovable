import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Calendar,
  Filter,
  RefreshCw,
  Edit2,
  ExternalLink,
  Save,
  Download,
  Users,
} from "lucide-react";
import { ClientSelector } from "./ClientSelector";

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

interface ApplicationsTabProps {
  settings: {
    form_factors: Record<string, { label: string }>;
    materials: Record<string, { label: string }>;
  };
}

export function ApplicationsTab({ settings }: ApplicationsTabProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [editingApplication, setEditingApplication] = useState<
    Partial<Application>
  >({});
  const [savingApplication, setSavingApplication] = useState(false);
  const [importingToExamples, setImportingToExamples] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.listApplications();
    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openApplicationDetail = async (app: Application) => {
    const { data, error } = await api.getApplication(app.id);
    if (error) {
      toast.error("Ошибка загрузки заявки");
      return;
    }
    setSelectedApplication(data);
    setEditingApplication({
      status: data.status,
      form_factor: data.form_factor,
      material: data.material,
      size: data.size,
      generated_preview: data.generated_preview,
      theme: data.theme || "main",
    });
  };

  const saveApplicationChanges = async () => {
    if (!selectedApplication) return;

    setSavingApplication(true);
    const { error } = await api.updateApplication(
      selectedApplication.id,
      editingApplication
    );

    if (error) {
      toast.error("Ошибка сохранения");
      setSavingApplication(false);
      return;
    }

    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApplication.id
          ? { ...app, ...editingApplication }
          : app
      )
    );

    toast.success("Заявка обновлена");
    setSavingApplication(false);
    setSelectedApplication(null);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      generating: "bg-yellow-500/20 text-yellow-500",
      generated: "bg-blue-500/20 text-blue-500",
      completed: "bg-green-500/20 text-green-500",
    };
    return (
      <Badge className={statusColors[status] || "bg-muted"}>{status}</Badge>
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
              {
                applications.filter(
                  (a) => a.status === "generating" || a.status === "generated"
                ).length
              }
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
              {applications.filter((a) => a.user_id).length}
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
              {applications.filter((a) => a.status === "completed").length}
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
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
                    <TableHead>Шаг</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Форма</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications
                    .filter(
                      (app) =>
                        statusFilter === "all" || app.status === statusFilter
                    )
                    .map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-xs">
                          {app.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(app.created_at), "dd MMM HH:mm", {
                              locale: ru,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {app.generated_preview ? (
                            <img
                              src={app.generated_preview}
                              alt="Превью"
                              className="w-10 h-10 rounded object-cover cursor-pointer hover:ring-2 ring-primary transition-all"
                              onClick={() =>
                                setSelectedImage(app.generated_preview)
                              }
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{app.current_step}/4</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          {app.form_factor ? (
                            <Badge variant="secondary">
                              {app.form_factor === "round"
                                ? "Круглый"
                                : app.form_factor === "oval"
                                ? "Жетон"
                                : "Контурный"}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {app.user_id ? (
                            <Badge className="bg-green-500/20 text-green-500">
                              Да
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Гость
                            </span>
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
                            <Link
                              to={`/application/${app.id}`}
                              target="_blank"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Открыть"
                              >
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
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Исходное изображение
                  </h3>
                  {selectedApplication.input_image_url ? (
                    <img
                      src={selectedApplication.input_image_url}
                      alt="Исходник"
                      className="w-full max-w-xs rounded-lg border cursor-pointer"
                      onClick={() =>
                        setSelectedImage(selectedApplication.input_image_url)
                      }
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Нет изображения
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Сгенерированные варианты
                    {selectedApplication.generated_images?.length
                      ? ` (${selectedApplication.generated_images.length})`
                      : ""}
                  </h3>
                  {selectedApplication.generated_images &&
                  selectedApplication.generated_images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedApplication.generated_images.map((url, idx) => (
                        <div
                          key={idx}
                          className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                            editingApplication.generated_preview === url
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-transparent hover:border-muted"
                          }`}
                          onClick={() =>
                            setEditingApplication((prev) => ({
                              ...prev,
                              generated_preview: url,
                            }))
                          }
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
                    <div className="text-muted-foreground text-sm">
                      Нет сгенерированных изображений
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - Form fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      ID
                    </h3>
                    <code className="text-xs">{selectedApplication.id}</code>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Дата создания
                    </h3>
                    <p className="text-sm">
                      {format(
                        new Date(selectedApplication.created_at),
                        "dd MMM yyyy HH:mm",
                        { locale: ru }
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Шаг
                    </h3>
                    <Badge variant="outline">
                      {selectedApplication.current_step}/4
                    </Badge>
                  </div>
                </div>

                {/* Client linking */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Клиент</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClientSelector(true)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {selectedApplication.user_id ? "Изменить" : "Привязать"}
                    </Button>
                  </div>
                  {selectedApplication.user_id ? (
                    <p className="text-sm text-muted-foreground">
                      ID:{" "}
                      <code className="text-xs">
                        {selectedApplication.user_id}
                      </code>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Клиент не привязан
                    </p>
                  )}
                </div>

                {/* Editable fields */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Редактируемые поля</h3>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Тема
                    </label>
                    <Select
                      value={
                        editingApplication.theme ||
                        selectedApplication.theme ||
                        "main"
                      }
                      onValueChange={(v) =>
                        setEditingApplication((prev) => ({ ...prev, theme: v }))
                      }
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

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Статус
                    </label>
                    <Select
                      value={editingApplication.status || ""}
                      onValueChange={(v) =>
                        setEditingApplication((prev) => ({
                          ...prev,
                          status: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Черновик</SelectItem>
                        <SelectItem value="pending_generation">
                          Ожидает генерации
                        </SelectItem>
                        <SelectItem value="generating">Генерация</SelectItem>
                        <SelectItem value="generated">Сгенерировано</SelectItem>
                        <SelectItem value="checkout">Оформление</SelectItem>
                        <SelectItem value="pending_order">
                          Ожидает оформления
                        </SelectItem>
                        <SelectItem value="completed">Оформлен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Форма
                    </label>
                    <Select
                      value={editingApplication.form_factor || ""}
                      onValueChange={(v) =>
                        setEditingApplication((prev) => ({
                          ...prev,
                          form_factor: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(settings.form_factors).map(
                          ([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Материал
                    </label>
                    <Select
                      value={editingApplication.material || ""}
                      onValueChange={(v) =>
                        setEditingApplication((prev) => ({
                          ...prev,
                          material: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(settings.materials).map(
                          ([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Размер (API)
                    </label>
                    <Select
                      value={editingApplication.size || ""}
                      onValueChange={(v) =>
                        setEditingApplication((prev) => ({ ...prev, size: v }))
                      }
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

                {selectedApplication.user_comment && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Комментарий пользователя
                    </label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {selectedApplication.user_comment}
                    </p>
                  </div>
                )}

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
                      {savingApplication
                        ? "Сохранение..."
                        : "Сохранить изменения"}
                    </Button>
                  </div>

                  {selectedApplication.generated_preview && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        setImportingToExamples(true);
                        const theme =
                          editingApplication.theme ||
                          selectedApplication.theme ||
                          "main";
                        const { error } = await api.importApplicationToExample(
                          selectedApplication.id,
                          undefined,
                          undefined,
                          theme
                        );
                        if (error) {
                          toast.error("Ошибка импорта в примеры");
                        } else {
                          toast.success("Импортировано в примеры");
                        }
                        setImportingToExamples(false);
                      }}
                      disabled={importingToExamples}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {importingToExamples
                        ? "Импорт..."
                        : "Импортировать в примеры"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <ClientSelector
              applicationId={selectedApplication.id}
              currentUserId={selectedApplication.user_id}
              currentUserEmail={null}
              isOpen={showClientSelector}
              onClose={() => setShowClientSelector(false)}
              onSuccess={(userId) => {
                setSelectedApplication((prev) =>
                  prev ? { ...prev, user_id: userId } : null
                );
                setApplications((prev) =>
                  prev.map((app) =>
                    app.id === selectedApplication.id
                      ? { ...app, user_id: userId }
                      : app
                  )
                );
                setShowClientSelector(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
