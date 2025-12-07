import { useState, useEffect } from "react";
import { History, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Generation {
  id: string;
  created_at: string;
  output_images: string[];
  user_comment: string | null;
  form_factor: string;
  size: string;
  input_image_url: string | null;
}

interface GenerationHistoryProps {
  onSelectGeneration: (images: string[], formFactor: string, size: string) => void;
}

export function GenerationHistory({ onSelectGeneration }: GenerationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && generations.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.getHistory();

      if (error) {
        console.error('Error loading history:', error);
        return;
      }

      setGenerations(data || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (generations.length === 0 && !isOpen) {
    return null;
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-sm text-muted-foreground hover:bg-card/80 transition-colors"
      >
        <span className="flex items-center gap-2">
          <History className="w-4 h-4" />
          История генераций
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="border-t border-border p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-4">
              Загрузка...
            </div>
          ) : generations.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <p>История пуста</p>
              <p className="text-xs mt-1">Сгенерируйте первый дизайн</p>
            </div>
          ) : (
            generations.map((gen) => (
              <div
                key={gen.id}
                className="group rounded-lg border border-border/50 hover:border-gold/30 transition-all overflow-hidden"
              >
                <div className="flex gap-2 p-2">
                  {gen.output_images.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded overflow-hidden bg-background flex-shrink-0"
                    >
                      <img
                        src={img}
                        alt={`Вариант ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="px-3 pb-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(gen.created_at)}
                    <span className="px-2 py-0.5 rounded bg-secondary text-xs">
                      {gen.form_factor === 'round' ? 'Круглый' : 'Контурный'}
                    </span>
                  </div>

                  {gen.user_comment && (
                    <p className="text-xs text-foreground/80 line-clamp-2">
                      {gen.user_comment}
                    </p>
                  )}

                  <Button
                    variant="goldOutline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => onSelectGeneration(
                      gen.output_images,
                      gen.form_factor,
                      gen.size
                    )}
                  >
                    Использовать этот дизайн
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
