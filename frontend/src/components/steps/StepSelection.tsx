import { useState } from "react";
import { RefreshCw, ChevronRight, ArrowLeft, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { PendantConfig } from "@/types/pendant";

interface StepSelectionProps {
  config: PendantConfig;
  generatedImages: string[];
  onSelectVariant: (index: number) => void;
  onRegenerate: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSelection({
  config,
  generatedImages,
  onSelectVariant,
  onRegenerate,
  onNext,
  onBack,
}: StepSelectionProps) {
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const currentIndex = config.selectedVariantIndex ?? 0;

  const handleRegenerate = () => {
    setShowRegenerateConfirm(false);
    onRegenerate();
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? generatedImages.length - 1 : currentIndex - 1;
    onSelectVariant(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === generatedImages.length - 1 ? 0 : currentIndex + 1;
    onSelectVariant(newIndex);
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-display text-gradient-theme mb-3">
          Выберите вариант
        </h2>
        <p className="text-muted-foreground">
          Листайте варианты или сгенерируйте новые
        </p>
      </div>

      {/* Main image with navigation */}
      <div className="relative w-full max-w-lg mb-6">
        <div className="absolute inset-0 blur-3xl bg-theme/10 rounded-full" />

        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:border-theme/50 flex items-center justify-center transition-all hover:scale-110"
          aria-label="Предыдущий вариант"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:border-theme/50 flex items-center justify-center transition-all hover:scale-110"
          aria-label="Следующий вариант"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Main image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-theme/30 bg-card">
          {generatedImages[currentIndex] ? (
            <img
              src={generatedImages[currentIndex]}
              alt={`Вариант ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Нет изображения</p>
            </div>
          )}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex gap-2 mb-6">
        {generatedImages.map((_, index) => (
          <button
            key={index}
            onClick={() => onSelectVariant(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              index === currentIndex
                ? "bg-theme scale-125"
                : "bg-border hover:bg-theme/50"
            )}
            aria-label={`Вариант ${index + 1}`}
          />
        ))}
      </div>

      {/* Variant counter */}
      <p className="text-sm text-muted-foreground mb-6">
        Вариант {currentIndex + 1} из {generatedImages.length}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <div className="flex gap-3">
          <Button
            variant="themeOutline"
            className="flex-1"
            onClick={() => setShowRegenerateConfirm(true)}
          >
            <RefreshCw className="w-4 h-4" />
            Перегенерировать
          </Button>
          <Button variant="theme" className="flex-1" onClick={onNext}>
            Далее
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к загрузке
        </Button>
      </div>

      {/* Regenerate confirmation dialog */}
      <AlertDialog
        open={showRegenerateConfirm}
        onOpenChange={setShowRegenerateConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сгенерировать заново?</AlertDialogTitle>
            <AlertDialogDescription>
              Текущие варианты будут удалены и заменены новыми. Это действие
              нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>
              Да, сгенерировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
