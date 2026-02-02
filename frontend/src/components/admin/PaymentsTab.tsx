import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  order_id: string;
  application_id: string | null;
  amount: number;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  order_comment: string | null;
  card_pan: string | null;
  payment_url: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentsStats {
  total_count: number;
  paid_count: number;
  total_amount: number;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEW: { label: "Новый", variant: "outline" },
  AUTHORIZED: { label: "Авторизован", variant: "secondary" },
  CONFIRMED: { label: "Оплачен", variant: "default" },
  CANCELED: { label: "Отменён", variant: "destructive" },
  REJECTED: { label: "Отклонён", variant: "destructive" },
  REFUNDED: { label: "Возврат", variant: "secondary" },
  PARTIAL_REFUNDED: { label: "Частичный возврат", variant: "secondary" },
  REVERSED: { label: "Отменён", variant: "destructive" },
  DEADLINE_EXPIRED: { label: "Истёк", variant: "destructive" },
};

export function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadPayments = async () => {
    setLoading(true);
    try {
      const filterStatus = statusFilter === "all" ? undefined : statusFilter;
      const { data, error } = await api.listPayments(filterStatus);

      if (error) {
        console.error("Error loading payments:", error);
        return;
      }

      setPayments(data?.payments || []);
      setStats(data?.stats || null);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_LABELS[status] || { label: status, variant: "outline" as const };
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Всего платежей</p>
            <p className="text-2xl font-bold">{stats.total_count}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Успешных оплат</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid_count}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Общая сумма</p>
            <p className="text-2xl font-bold">{stats.total_amount.toLocaleString()} ₽</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Фильтр по статусу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="NEW">Новые</SelectItem>
            <SelectItem value="CONFIRMED">Оплаченные</SelectItem>
            <SelectItem value="CANCELED">Отменённые</SelectItem>
            <SelectItem value="REJECTED">Отклонённые</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={loadPayments} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Платежи не найдены
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заказ</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Карта</TableHead>
                <TableHead>Ссылка оплаты</TableHead>
                <TableHead>Заявка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">
                    {payment.order_id}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.amount.toLocaleString()} ₽
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      {payment.customer_name && (
                        <p className="font-medium">{payment.customer_name}</p>
                      )}
                      {payment.customer_email && (
                        <p className="text-muted-foreground text-xs">
                          {payment.customer_email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.card_pan || "—"}
                  </TableCell>
                  <TableCell>
                    {payment.payment_url ? (
                      <a
                        href={payment.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Открыть
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.application_id ? (
                      <a
                        href={`/application/${payment.application_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Открыть
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
