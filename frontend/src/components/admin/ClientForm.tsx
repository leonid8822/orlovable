import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, Save } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Client } from "./ClientsTab";

interface ClientFormProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientForm({ client, isOpen, onClose, onSuccess }: ClientFormProps) {
  const isEdit = !!client;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: client?.email || "",
    first_name: client?.first_name || "",
    last_name: client?.last_name || "",
    telegram_username: client?.telegram_username || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Email обязателен");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && client) {
        const { error } = await api.updateClient(client.id, formData);
        if (error) {
          toast.error(error instanceof Error ? error.message : "Ошибка сохранения");
          return;
        }
        toast.success("Клиент обновлён");
      } else {
        const { error } = await api.createClient(formData);
        if (error) {
          toast.error(error instanceof Error ? error.message : "Ошибка создания");
          return;
        }
        toast.success("Клиент создан");
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {isEdit ? "Редактировать клиента" : "Новый клиент"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="client@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Имя</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Иван"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Фамилия</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Иванов"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              value={formData.telegram_username}
              onChange={(e) => setFormData({ ...formData, telegram_username: e.target.value })}
              placeholder="@username"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEdit ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
