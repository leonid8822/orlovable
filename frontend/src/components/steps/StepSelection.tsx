import { useState } from "react";
import { Check, RefreshCw, ChevronRight, ArrowLeft } from "lucide-react";
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

  const handleRegenerate = () => {
    setShowRegenerateConfirm(false);
    onRegenerate();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Variants Grid */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
            Выберите вариант
          </h2>
          <p className="text-muted-foreground">
            Выберите понравившийся вариант или сгенерируйте новые
          </p>
        </div>

        {/* Variants grid */}
        <div className="grid grid-cols-2 gap-3">
          {generatedImages.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => onSelectVariant(index)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300",
                config.selectedVariantIndex === index
                  ? "border-gold ring-2 ring-gold/30 scale-[1.02]"
                  : "border-border hover:border-gold/50"
              )}
            >
              <img
                src={imageUrl}
                alt={`Вариант ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {config.selectedVariantIndex === index && (
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

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              variant="goldOutline"
              className="flex-1"
              onClick={() => setShowRegenerateConfirm(true)}
            >
              <RefreshCw className="w-4 h-4" />
              Перегенерировать
            </Button>
            <Button variant="gold" className="flex-1" onClick={onNext}>
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

      {/* Right: Large Preview of Selected */}
      <div
        className="flex items-center justify-center animate-scale-in"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 blur-3xl bg-gold/10 rounded-full" />
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gold/30 bg-card">
            {generatedImages[config.selectedVariantIndex] ? (
              <img
                src={generatedImages[config.selectedVariantIndex]}
                alt="Выбранный вариант"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Выберите вариант</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
