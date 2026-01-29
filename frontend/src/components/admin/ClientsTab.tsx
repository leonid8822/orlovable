import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, RefreshCw, Users, Search, ChevronRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ClientCard } from "./ClientCard";
import { ClientForm } from "./ClientForm";

interface ClientApplication {
  id: string;
  status: string | null;
  form_factor: string | null;
  material: string | null;
  size: string | null;
  generated_preview: string | null;
  input_image_url: string | null;
  created_at: string | null;
  paid_at: string | null;
  order_comment: string | null;
  user_comment: string | null;
}

interface ClientPayment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
  customer_email: string | null;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  telegram_username: string;
  created_at: string | null;
  orders_count: number;
  paid_count: number;
  total_spent: number;
  applications: ClientApplication[];
  payments: ClientPayment[];
  is_admin?: boolean;
}

export function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.listClients();
      if (error) {
        console.error("Error loading clients:", error);
        return;
      }
      setClients(data?.clients || []);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.first_name || "").toLowerCase().includes(q) ||
      (c.last_name || "").toLowerCase().includes(q) ||
      (c.telegram_username || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getDisplayName = (c: Client) => {
    if (c.first_name || c.last_name) {
      return `${c.first_name || ""} ${c.last_name || ""}`.trim();
    }
    return c.name || c.email.split("@")[0];
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  if (selectedClient) {
    return (
      <ClientCard
        client={selectedClient}
        onBack={() => setSelectedClientId(null)}
        onRefresh={loadClients}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Всего клиентов</p>
          <p className="text-2xl font-bold">{clients.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">С оплатами</p>
          <p className="text-2xl font-bold text-green-600">
            {clients.filter((c) => c.paid_count > 0).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Общая выручка</p>
          <p className="text-2xl font-bold">
            {clients
              .reduce((sum, c) => sum + c.total_spent, 0)
              .toLocaleString()}{" "}
            ₽
          </p>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, email, telegram..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadClients}
          disabled={loading}
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
          />
          Обновить
        </Button>
        <Button
          size="sm"
          onClick={() => setShowClientForm(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Новый клиент
        </Button>
      </div>

      {/* Client Form Modal */}
      <ClientForm
        isOpen={showClientForm}
        onClose={() => setShowClientForm(false)}
        onSuccess={() => {
          setShowClientForm(false);
          loadClients();
        }}
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          {search ? "Клиенты не найдены" : "Пока нет клиентов"}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Заказов</TableHead>
                <TableHead>Оплачено</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{getDisplayName(client)}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {client.telegram_username || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.orders_count}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.paid_count > 0 ? (
                      <Badge variant="default">{client.paid_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {client.total_spent > 0
                      ? `${client.total_spent.toLocaleString()} ₽`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(client.created_at)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
