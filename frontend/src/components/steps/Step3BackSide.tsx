import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ImageUploader";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { PendantConfig } from "@/types/pendant";

interface Step3BackSideProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3BackSide({
  config,
  onConfigChange,
  onNext,
  onBack,
}: Step3BackSideProps) {
  const [isGeneratingBack, setIsGeneratingBack] = useState(false);

  const handleBackImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onConfigChange({
        backImage: file,
        backImagePreview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateBack = async () => {
    if (!config.hasBackEngraving) {
      onNext();
      return;
    }
    
    setIsGeneratingBack(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGeneratingBack(false);
    onNext();
  };

  // Only show for medium/large round items
  const canHaveBackEngraving = config.formFactor === "round" && config.size !== "bracelet";

  if (!canHaveBackEngraving) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
            Отлично!
          </h2>
          <p className="text-muted-foreground">
            Для выбранного размера гравировка на обратной стороне недоступна.
            Перейдите к оформлению заказа.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={onBack}>
            Назад
          </Button>
          <Button variant="gold" size="lg" onClick={onNext}>
            Перейти к оплате
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Back engraving config */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
            Обратная сторона
          </h2>
          <p className="text-muted-foreground">
            Добавьте персональную гравировку на обратную сторону изделия
          </p>
        </div>

        {/* Toggle for back engraving */}
        <div
          className={cn(
            "flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-300",
            config.hasBackEngraving
              ? "border-gold bg-gold/10"
              : "border-border bg-card"
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
                config.hasBackEngraving ? "bg-gold/20" : "bg-secondary"
              )}
            >
              <Plus
                className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  config.hasBackEngraving ? "text-gold" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <p className="font-medium text-foreground">Гравировка сзади</p>
              <p className="text-sm text-muted-foreground">+ 1 000 ₽</p>
            </div>
          </div>
          <Switch
            checked={config.hasBackEngraving}
            onCheckedChange={(checked) =>
              onConfigChange({ hasBackEngraving: checked })
            }
          />
        </div>

        {config.hasBackEngraving && (
          <div className="space-y-6 animate-slide-up">
            <ImageUploader
              imagePreview={config.backImagePreview}
              onImageSelect={handleBackImageSelect}
              onImageClear={() =>
                onConfigChange({ backImage: null, backImagePreview: null })
              }
              label="Загрузите рисунок для задника"
              hint="Надпись, подпись или рисунок"
            />

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Комментарий к гравировке
              </label>
              <Textarea
                placeholder="Опишите, что должно быть на обратной стороне..."
                value={config.backComment}
                onChange={(e) => onConfigChange({ backComment: e.target.value })}
                className="min-h-[100px] bg-card border-border focus:border-gold resize-none"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
            Назад
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={handleGenerateBack}
            disabled={isGeneratingBack}
            className="flex-1"
          >
            {isGeneratingBack ? (
              "Генерируем..."
            ) : (
              <>
                Продолжить
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right: Back preview */}
      <div className="flex items-center justify-center animate-scale-in" style={{ animationDelay: "0.2s" }}>
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-gold/10 rounded-full" />
          <div
            className={cn(
              "w-56 h-56 md:w-64 md:h-64 rounded-full transition-all duration-500 flex items-center justify-center animate-float",
              config.material === "gold"
                ? "bg-gradient-to-br from-gold-light via-gold to-gold-dark shadow-gold"
                : "bg-gradient-to-br from-silver-light via-silver to-gray-400"
            )}
            style={{
              boxShadow:
                config.material === "gold"
                  ? "0 0 40px rgba(212, 175, 55, 0.4)"
                  : "0 0 30px rgba(192, 192, 192, 0.3)",
            }}
          >
            <div className="w-[85%] h-[85%] rounded-full bg-background/90 flex items-center justify-center">
              {config.backImagePreview ? (
                <img
                  src={config.backImagePreview}
                  alt="Превью задника"
                  className="w-full h-full object-cover rounded-full opacity-60"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Обратная сторона</p>
                  <p className="text-xs mt-1 opacity-60">
                    {config.hasBackEngraving ? "Загрузите дизайн" : "Без гравировки"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
