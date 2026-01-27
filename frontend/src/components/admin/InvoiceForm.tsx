import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Copy, ExternalLink, Check } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Client } from "./ClientsTab";

const SIZE_LABELS: Record<string, string> = {
  bracelet: "S (11мм)",
  pendant: "M (25мм)",
  interior: "L (40мм)",
};

const MATERIAL_LABELS: Record<string, string> = {
  silver: "Серебро 925",
  gold: "Золото 585",
};

interface InvoiceFormProps {
  client: Client;
  applicationId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceForm({
  client,
  applicationId,
  onClose,
  onSuccess,
}: InvoiceFormProps) {
  const [selectedAppId, setSelectedAppId] = useState(applicationId || "none");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-fill description and amount when application selected
  useEffect(() => {
    if (selectedAppId && selectedAppId !== "none") {
      const app = client.applications.find((a) => a.id === selectedAppId);
      if (app) {
        const material = MATERIAL_LABELS[app.material || "silver"] || app.material || "Серебро 925";
        const size = SIZE_LABELS[app.size || "pendant"] || app.size || "M";
        const desc = `Предоплата за кулон ${size}, ${material} — заказ #${app.id.slice(0, 8)}`;
        setDescription(desc);

        // Try to load settings for deposit calculation
        loadDepositAmount(app.material || "silver", app.size || "pendant");
      }
    } else {
      setDescription("");
      setAmount(0);
    }
  }, [selectedAppId]);

  const loadDepositAmount = async (material: string, size: string) => {
    try {
      const { data } = await api.getSettings();
      if (data?.sizes?.[material]) {
        // Find the size key (s/m/l) that matches the apiSize
        for (const [sizeKey, sizeData] of Object.entries(data.sizes[material])) {
          const sd = sizeData as { apiSize?: string; price?: number; depositPercent?: number };
          if (sd.apiSize === size || sizeKey === size) {
            const price = sd.price || 0;
            const depositPercent = sd.depositPercent ?? (material === "gold" ? 30 : 50);
            setAmount(Math.round(price * depositPercent / 100));
            return;
          }
        }
      }
    } catch {
      // Keep amount as is
    }
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Укажите сумму");
      return;
    }
    if (!description.trim()) {
      toast.error("Укажите назначение платежа");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.createInvoice({
        application_id: selectedAppId !== "none" ? selectedAppId : undefined,
        amount,
        description: description.trim(),
        customer_email: client.email,
        customer_name:
          `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
          client.name ||
          undefined,
      });

      if (error || !data?.success) {
        throw new Error("Ошибка создания счёта");
      }

      setPaymentUrl(data.payment_url);
      toast.success("Ссылка на оплату создана");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ошибка создания счёта"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!paymentUrl) return;
    await navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    toast.success("Ссылка скопирована");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {paymentUrl ? "Ссылка на оплату" : "Выставить счёт"}
          </DialogTitle>
        </DialogHeader>

        {paymentUrl ? (
          /* Success - show payment link */
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Ссылка для клиента:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={paymentUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Клиент: <strong>{client.email}</strong>
              </p>
              <p>
                Сумма: <strong>{amount.toLocaleString()} ₽</strong> (без НДС)
              </p>
              <p>{description}</p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Закрыть
              </Button>
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Открыть
                </Button>
              </a>
            </DialogFooter>
          </div>
        ) : (
          /* Form */
          <div className="space-y-4">
            {/* Client email (readonly) */}
            <div className="space-y-2">
              <Label>Клиент</Label>
              <Input value={client.email} disabled className="bg-muted" />
            </div>

            {/* Application select */}
            {client.applications.length > 0 && (
              <div className="space-y-2">
                <Label>Привязать к заказу</Label>
                <Select
                  value={selectedAppId}
                  onValueChange={setSelectedAppId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите заказ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без привязки</SelectItem>
                    {client.applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        #{app.id.slice(0, 8)} —{" "}
                        {SIZE_LABELS[app.size || ""] || app.size || "?"},{" "}
                        {MATERIAL_LABELS[app.material || ""] ||
                          app.material ||
                          "?"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label>Сумма (₽)</Label>
              <Input
                type="number"
                min={1}
                value={amount || ""}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Без НДС (ИП на УСН)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Назначение платежа</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Предоплата за кулон..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  "Создать ссылку на оплату"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
