import { useState } from "react";
import { RefreshCw, ChevronRight, ArrowLeft, Check } from "lucide-react";
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
import { useAppTheme } from "@/contexts/ThemeContext";

interface StepSelectionProps {
  config: PendantConfig;
  generatedImages: string[];
  generatedThumbnails?: string[];  // Smaller images for grid display
  onSelectVariant: (index: number) => void;
  onRegenerate: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSelection({
  config,
  generatedImages,
  generatedThumbnails,
  onSelectVariant,
  onRegenerate,
  onNext,
  onBack,
}: StepSelectionProps) {
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const currentIndex = config.selectedVariantIndex ?? 0;
  const { config: themeConfig } = useAppTheme();

  // Use thumbnails if available, fallback to full images
  const thumbnails = generatedThumbnails?.length ? generatedThumbnails : generatedImages;

  const handleRegenerate = () => {
    setShowRegenerateConfirm(false);
    onRegenerate();
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className={`text-3xl md:text-4xl font-display ${themeConfig.textGradientClass} mb-3`}>
          Выберите вариант
        </h2>
        <p className="text-muted-foreground">
          Нажмите на понравившийся вариант
        </p>
      </div>

      {/* Desktop: 2x2 grid with selected preview | Mobile: vertical list */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grid of variants - use thumbnails for faster loading */}
        <div className="grid grid-cols-2 gap-3">
          {thumbnails.map((thumbImage, index) => (
            <button
              key={index}
              onClick={() => onSelectVariant(index)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                "border-2 hover:scale-[1.02]",
                index === currentIndex
                  ? "ring-2 ring-offset-2 ring-offset-background"
                  : "border-border/50 hover:border-border"
              )}
              style={{
                borderColor: index === currentIndex ? themeConfig.accentColor : undefined,
                ringColor: index === currentIndex ? themeConfig.accentColor : undefined,
              }}
            >
              <img
                src={thumbImage}
                alt={`Вариант ${index + 1}`}
                className="w-full h-full object-cover bg-black"
                loading="lazy"
              />
              {/* Selection indicator */}
              {index === currentIndex && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeConfig.accentColor }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              {/* Variant number */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium">
                {index + 1}
              </div>
            </button>
          ))}
        </div>

        {/* Large preview of selected variant - hidden on mobile, visible on desktop */}
        <div className="hidden lg:block">
          <div
            className="relative aspect-square rounded-2xl overflow-hidden border-2"
            style={{ borderColor: `${themeConfig.accentColor}50` }}
          >
            <div className="absolute inset-0 blur-3xl bg-black/20" />
            {generatedImages[currentIndex] ? (
              <img
                src={generatedImages[currentIndex]}
                alt={`Выбранный вариант ${currentIndex + 1}`}
                className="relative w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-card">
                <p className="text-muted-foreground">Нет изображения</p>
              </div>
            )}

            {/* Selection badge */}
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: themeConfig.accentColor }}
            >
              Выбран вариант {currentIndex + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Show selected variant info */}
      <div className="lg:hidden text-center mb-6">
        <p
          className="text-sm font-medium"
          style={{ color: themeConfig.accentColor }}
        >
          Выбран вариант {currentIndex + 1} из {generatedImages.length}
        </p>
      </div>

      {/* Action buttons - stacked on mobile */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button
          className="w-full"
          onClick={onNext}
          style={{ backgroundColor: themeConfig.accentColor }}
        >
          Далее
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowRegenerateConfirm(true)}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Перегенерировать
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
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
