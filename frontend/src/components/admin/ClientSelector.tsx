import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, UserPlus, Check, User } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientSearchResult {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  telegram_username: string;
}

interface ClientSelectorProps {
  applicationId: string;
  currentUserId?: string | null;
  currentUserEmail?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string, email: string) => void;
}

export function ClientSelector({
  applicationId,
  currentUserId,
  currentUserEmail,
  isOpen,
  onClose,
  onSuccess,
}: ClientSelectorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Search clients when query changes
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (search.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const { data, error } = await api.searchClients(search);
      setLoading(false);
      if (error) {
        console.error("Search error:", error);
        return;
      }
      setResults(data?.clients || []);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  const handleAssign = async () => {
    if (!selectedId) {
      toast.error("Выберите клиента");
      return;
    }

    setAssigning(true);
    try {
      const { data, error } = await api.assignClientToApplication(applicationId, selectedId);
      if (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка привязки");
        return;
      }
      toast.success("Клиент привязан к заявке");
      onSuccess(selectedId, data?.user_email || "");
    } finally {
      setAssigning(false);
    }
  };

  const getDisplayName = (client: ClientSearchResult) => {
    if (client.first_name || client.last_name) {
      return `${client.first_name || ""} ${client.last_name || ""}`.trim();
    }
    return client.name || client.email.split("@")[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Выбрать клиента
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current client info */}
          {currentUserEmail && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">Текущий клиент: </span>
              <span className="font-medium">{currentUserEmail}</span>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по email, имени, telegram..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {search.length >= 2 ? "Клиенты не найдены" : "Введите минимум 2 символа"}
              </div>
            ) : (
              results.map((client) => {
                const isSelected = selectedId === client.id;
                const isCurrent = currentUserId === client.id;

                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedId(client.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors",
                      "hover:bg-muted/50",
                      isSelected && "bg-primary/10 border border-primary",
                      isCurrent && "opacity-50"
                    )}
                    disabled={isCurrent}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getDisplayName(client)}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                        {client.telegram_username && (
                          <p className="text-xs text-muted-foreground">
                            {client.telegram_username}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                      {isCurrent && (
                        <span className="text-xs text-muted-foreground">
                          текущий
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedId || assigning}
            >
              {assigning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Привязать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
