import { useState, useEffect } from "react";
import { Check, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductConfig } from "@/types/product";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Step3SelectionProps {
  config: ProductConfig;
  onConfigChange: (updates: Partial<ProductConfig>) => void;
  onNext: () => void;
  onBack: () => void;
  applicationId: string;
}

export function Step3Selection({ config, onConfigChange, onNext, onBack, applicationId }: Step3SelectionProps) {
  // Инициализируем из config, но также следим за изменениями config
  const [selectedIndex, setSelectedIndex] = useState<number | null>(config.selectedVariantIndex ?? null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  // Синхронизируем selectedIndex с config при изменении config извне
  // Но только если выбор еще не был сделан пользователем
  useEffect(() => {
    if (config.selectedVariantIndex !== undefined && config.selectedVariantIndex !== null && selectedIndex === null) {
      setSelectedIndex(config.selectedVariantIndex);
    }
  }, [config.selectedVariantIndex]);

  const handleSelect = (index: number) => {
    // Мгновенно обновляем локальное состояние для немедленной обратной связи
    setSelectedIndex(index);
    
    const selectedUrl = config.generatedVariants?.[index];
    
    if (selectedUrl) {
      const updates = {
        selectedVariantIndex: index,
        selectedVariantUrl: selectedUrl,
      };
      
      // Обновляем config сразу
      onConfigChange(updates);

      // Save to application asynchronously (не блокируем UI)
      api.updateApplication(applicationId, {
        selected_variant_index: index,
        selected_variant_url: selectedUrl,
        status: 'selected',
      }).catch((error) => {
        console.error('Failed to save selection:', error);
        // Не откатываем выбор - пользователь уже видит его выбранным
      });

      // Start 3D generation asynchronously (don't wait)
      // This will run in the background and be shown on step 8 (payment)
      api.generate3D({ image_url: selectedUrl }).then((result) => {
        if (result.data?.request_id) {
          api.updateApplication(applicationId, {
            model_3d_request_id: result.data.request_id,
            model_3d_status: 'pending',
          });
        }
      }).catch((error) => {
        console.error('Failed to start 3D generation:', error);
        // Don't show error to user, it's background process
      });
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setSelectedIndex(null); // Сбрасываем выбор
    
    // Очищаем выбранный вариант в заявке
    await api.updateApplication(applicationId, {
      selected_variant_index: null,
      selected_variant_url: null,
      status: 'generating',
    });

    try {
      const { data, error } = await api.generate({
        applicationId,
        imageBase64: config.imagePreview,
        prompt: config.comment,
        formFactor: config.formFactor,
        material: config.material,
        size: config.size,
        sessionId: localStorage.getItem('sessionId') || undefined,
      });

      if (error || !data?.images) {
        throw new Error(error || 'Не удалось сгенерировать варианты');
      }

      // Обновляем варианты
      onConfigChange({
        generatedVariants: data.images,
        selectedVariantIndex: undefined,
        selectedVariantUrl: undefined,
      });

      // Обновляем заявку
      await api.updateApplication(applicationId, {
        status: 'variants_ready',
        generated_variants: data.images,
        selected_variant_index: null,
        selected_variant_url: null,
      });

      toast({
        title: "Готово!",
        description: "Новые варианты сгенерированы",
      });
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Не удалось перегенерировать варианты',
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleNext = async () => {
    if (selectedIndex !== null) {
      // Update step in application
      await api.updateApplication(applicationId, {
        current_step: 4,
      });
      onNext();
    }
  };

  if (!config.generatedVariants || config.generatedVariants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Варианты еще не сгенерированы</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display">Выберите понравившийся вариант</h2>
        </div>
        <p className="text-muted-foreground">Выберите один из двух предложенных вариантов</p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {config.generatedVariants.map((variantUrl, index) => (
          <button
            key={`variant-${index}-${variantUrl.slice(-20)}`}
            type="button"
            onClick={() => handleSelect(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(index);
              }
            }}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/50",
              selectedIndex === index
                ? "border-gold ring-2 ring-gold/30 scale-[1.02]"
                : "border-border hover:border-gold/50"
            )}
            tabIndex={0}
            role="button"
            aria-pressed={selectedIndex === index}
          >
            <img
              src={variantUrl}
              alt={`Вариант ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {selectedIndex === index && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-background" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
              Вариант {index + 1}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="outline">
          Назад
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            variant="outline"
            className="gap-2"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Генерируем...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Перегенерировать
              </>
            )}
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedIndex === null || isRegenerating}
            className="bg-gold hover:bg-gold-dark text-white"
          >
            Продолжить
          </Button>
        </div>
      </div>
    </div>
  );
}

