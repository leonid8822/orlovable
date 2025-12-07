import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendantPreview } from "@/components/PendantPreview";
import { cn } from "@/lib/utils";
import type { PendantConfig, Material, Size } from "@/types/pendant";
import { materialLabels, sizeLabels, sizeDimensions } from "@/types/pendant";

interface Step2ConfigureProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Configure({
  config,
  onConfigChange,
  onNext,
  onBack,
}: Step2ConfigureProps) {
  const [isGenerating3D, setIsGenerating3D] = useState(false);

  const materials: Material[] = ["gold", "silver"];
  const sizes: Size[] = ["interior", "pendant", "bracelet"];

  const handleContinue = async () => {
    setIsGenerating3D(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating3D(false);
    onNext();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Configuration */}
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
            Настройте изделие
          </h2>
          <p className="text-muted-foreground">
            Выберите материал и размер для вашего украшения
          </p>
        </div>

        {/* Material selection */}
        <div className="space-y-4">
          <label className="text-lg font-display text-foreground">
            Материал
          </label>
          <div className="grid grid-cols-2 gap-4">
            {materials.map((material) => (
              <button
                key={material}
                onClick={() => onConfigChange({ material })}
                className={cn(
                  "relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden group",
                  config.material === material
                    ? material === "gold"
                      ? "border-gold bg-gold/10"
                      : "border-silver bg-silver/10"
                    : "border-border bg-card hover:border-gold/30"
                )}
              >
                {/* Material preview circle */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full mx-auto mb-3 transition-transform duration-300 group-hover:scale-110",
                    material === "gold"
                      ? "bg-gradient-to-br from-gold-light via-gold to-gold-dark"
                      : "bg-gradient-to-br from-silver-light via-silver to-gray-400"
                  )}
                  style={{
                    boxShadow:
                      material === "gold"
                        ? "0 4px 20px rgba(212, 175, 55, 0.3)"
                        : "0 4px 20px rgba(192, 192, 192, 0.2)",
                  }}
                />
                <p
                  className={cn(
                    "font-medium text-center transition-colors duration-300",
                    config.material === material
                      ? material === "gold"
                        ? "text-gold-light"
                        : "text-silver-light"
                      : "text-muted-foreground"
                  )}
                >
                  {materialLabels[material]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Size selection */}
        <div className="space-y-4">
          <label className="text-lg font-display text-foreground">
            Размер изделия
          </label>
          <div className="space-y-3">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => onConfigChange({ size })}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                  config.size === size
                    ? "border-gold bg-gold/10"
                    : "border-border bg-card hover:border-gold/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "rounded-full bg-secondary flex items-center justify-center transition-all duration-300",
                      size === "interior" ? "w-10 h-10" : size === "pendant" ? "w-8 h-8" : "w-6 h-6",
                      config.size === size && "bg-gold/20"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-full",
                        size === "interior" ? "w-6 h-6" : size === "pendant" ? "w-5 h-5" : "w-4 h-4",
                        config.material === "gold"
                          ? "bg-gradient-to-br from-gold-light to-gold"
                          : "bg-gradient-to-br from-silver-light to-silver"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-medium",
                      config.size === size ? "text-gold-light" : "text-foreground"
                    )}
                  >
                    {sizeLabels[size]}
                  </span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {sizeDimensions[size]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
            Назад
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={handleContinue}
            disabled={isGenerating3D}
            className="flex-1"
          >
            {isGenerating3D ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Создаём 3D...
              </>
            ) : (
              <>
                Продолжить
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="flex items-center justify-center animate-scale-in" style={{ animationDelay: "0.2s" }}>
        <div className="relative">
          <div
            className={cn(
              "absolute inset-0 blur-3xl rounded-full transition-colors duration-500",
              config.material === "gold" ? "bg-gold/15" : "bg-silver/15"
            )}
          />
          <PendantPreview
            imagePreview={config.generatedPreview || config.imagePreview}
            material={config.material}
            size={config.size}
            formFactor={config.formFactor}
            isGenerating={isGenerating3D}
          />
        </div>
      </div>
    </div>
  );
}
