import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Calendar,
  ExternalLink,
  Receipt,
  Image,
  CreditCard,
  Shield,
} from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Client } from "./ClientsTab";

interface ClientCardProps {
  client: Client;
  onBack: () => void;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  generating: "Генерация",
  generated: "Сгенерировано",
  pending: "В обработке",
  checkout: "Оформление",
  pending_payment: "Ожидает оплаты",
  paid: "Оплачено",
  completed: "Завершено",
};

const PAYMENT_STATUS_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  NEW: { label: "Новый", color: "bg-muted text-muted-foreground" },
  CONFIRMED: { label: "Оплачен", color: "bg-green-500/20 text-green-600" },
  AUTHORIZED: {
    label: "Авторизован",
    color: "bg-green-500/20 text-green-600",
  },
  CANCELED: { label: "Отменён", color: "bg-red-500/20 text-red-500" },
  REJECTED: { label: "Отклонён", color: "bg-red-500/20 text-red-500" },
  DEADLINE_EXPIRED: {
    label: "Истёк",
    color: "bg-red-500/20 text-red-500",
  },
};

const SIZE_LABELS: Record<string, string> = {
  bracelet: "S",
  pendant: "M",
  interior: "L",
};

const MATERIAL_LABELS: Record<string, string> = {
  silver: "Серебро 925",
  gold: "Золото 585",
};

export function ClientCard({ client, onBack, onRefresh }: ClientCardProps) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>(
    undefined
  );
  const [isAdmin, setIsAdmin] = useState(client.is_admin ?? false);
  const [savingAdmin, setSavingAdmin] = useState(false);

  const handleAdminToggle = async (checked: boolean) => {
    setSavingAdmin(true);
    try {
      const { error } = await api.updateUserAdmin(client.id, checked);
      if (error) {
        toast.error("Ошибка сохранения");
        return;
      }
      setIsAdmin(checked);
      toast.success(checked ? "Админ права выданы" : "Админ права отозваны");
    } catch (err) {
      toast.error("Ошибка сохранения");
    } finally {
      setSavingAdmin(false);
    }
  };

  const getDisplayName = () => {
    if (client.first_name || client.last_name) {
      return `${client.first_name || ""} ${client.last_name || ""}`.trim();
    }
    return client.name || client.email.split("@")[0];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreateInvoice = (applicationId?: string) => {
    setSelectedAppId(applicationId);
    setShowInvoice(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-display">{getDisplayName()}</h2>
        </div>
        <Button onClick={() => handleCreateInvoice()}>
          <Receipt className="w-4 h-4 mr-2" />
          Выставить счёт
        </Button>
      </div>

      {/* Client info */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a
                href={`mailto:${client.email}`}
                className="text-primary hover:underline"
              >
                {client.email}
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              {client.telegram_username ? (
                <a
                  href={`https://t.me/${client.telegram_username.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {client.telegram_username}
                </a>
              ) : (
                <span className="text-muted-foreground">Не указан</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Регистрация: {formatDate(client.created_at)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Итого оплат: </span>
              <span className="font-bold">
                {client.total_spent.toLocaleString()} ₽
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={isAdmin}
                onCheckedChange={handleAdminToggle}
                disabled={savingAdmin}
              />
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span>Админ</span>
              {isAdmin && <Badge variant="secondary" className="text-xs">✓</Badge>}
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Заказы ({client.applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.applications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Нет заказов
            </p>
          ) : (
            <div className="space-y-3">
              {client.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30"
                >
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {app.generated_preview || app.input_image_url ? (
                      <img
                        src={app.generated_preview || app.input_image_url || ""}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {STATUS_LABELS[app.status || "draft"] ||
                          app.status ||
                          "Черновик"}
                      </Badge>
                      {app.size && (
                        <span className="text-xs text-muted-foreground">
                          {SIZE_LABELS[app.size] || app.size}
                        </span>
                      )}
                      {app.material && (
                        <span className="text-xs text-muted-foreground">
                          {MATERIAL_LABELS[app.material] || app.material}
                        </span>
                      )}
                    </div>
                    {app.user_comment && (
                      <p className="text-xs text-muted-foreground truncate">
                        {app.user_comment}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(app.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateInvoice(app.id)}
                    >
                      <Receipt className="w-3 h-3 mr-1" />
                      Счёт
                    </Button>
                    <a
                      href={`/application/${app.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Платежи ({client.payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Нет платежей
            </p>
          ) : (
            <div className="space-y-2">
              {client.payments.map((payment) => {
                const statusInfo = PAYMENT_STATUS_LABELS[payment.status] || {
                  label: payment.status,
                  color: "bg-muted text-muted-foreground",
                };
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {payment.order_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {payment.amount.toLocaleString()} ₽
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Form Dialog */}
      {showInvoice && (
        <InvoiceForm
          client={client}
          applicationId={selectedAppId}
          onClose={() => setShowInvoice(false)}
          onSuccess={() => {
            setShowInvoice(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
