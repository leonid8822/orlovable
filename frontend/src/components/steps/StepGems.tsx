import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Trash2, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendantConfig, GemType, GemPlacement } from "@/types/pendant";
import { GEM_CONFIG } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";

interface StepGemsProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepGems({
  config,
  onConfigChange,
  onNext,
  onBack,
  onSkip,
}: StepGemsProps) {
  const { config: themeConfig } = useAppTheme();
  const [selectedGemType, setSelectedGemType] = useState<GemType>("ruby");
  const imageRef = useRef<HTMLDivElement>(null);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Don't place gem if clicking too close to edges
      if (x < 5 || x > 95 || y < 5 || y > 95) return;

      const newGem: GemPlacement = {
        id: crypto.randomUUID(),
        type: selectedGemType,
        x,
        y,
      };

      onConfigChange({
        gems: [...config.gems, newGem],
      });
    },
    [config.gems, selectedGemType, onConfigChange]
  );

  const handleRemoveGem = useCallback(
    (gemId: string) => {
      onConfigChange({
        gems: config.gems.filter((g) => g.id !== gemId),
      });
    },
    [config.gems, onConfigChange]
  );

  const handleClearAll = useCallback(() => {
    onConfigChange({ gems: [] });
  }, [onConfigChange]);

  // Calculate gem size based on pendant size (2mm relative to pendant dimensions)
  const getGemSizePercent = () => {
    // Assuming pendant takes 80% of image, and we want 2mm gems
    // For a 19mm pendant (M size), 2mm is about 10.5% of pendant
    // For a 25mm pendant (L size), 2mm is about 8% of pendant
    // For a 13mm pendant (S size), 2mm is about 15.4% of pendant
    const sizeMap: Record<string, number> = {
      s: 12,
      m: 8,
      l: 6,
    };
    return sizeMap[config.sizeOption] || 8;
  };

  const gemSizePercent = getGemSizePercent();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4"
          style={{
            backgroundColor: `${themeConfig.accentColor}10`,
            borderColor: `${themeConfig.accentColor}30`,
          }}
        >
          <Gem className="w-4 h-4" style={{ color: themeConfig.accentColor }} />
          <span className="text-sm" style={{ color: themeConfig.accentColor }}>
            Добавление камней
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display mb-2">
          Украсьте <span style={{ color: themeConfig.accentColor }}>камнями</span>
        </h2>
        <p className="text-muted-foreground">
          Нажмите на изображение, чтобы добавить камень 2мм
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image with gems */}
        <div className="space-y-4">
          <div
            ref={imageRef}
            className="relative aspect-square rounded-2xl overflow-hidden bg-card border-2 cursor-crosshair"
            style={{ borderColor: `${themeConfig.accentColor}30` }}
            onClick={handleImageClick}
          >
            {config.generatedPreview ? (
              <img
                src={config.generatedPreview}
                alt="Кулон"
                className="w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Превью недоступно
              </div>
            )}

            {/* Render gems */}
            {config.gems.map((gem) => {
              const gemConfig = GEM_CONFIG[gem.type];
              return (
                <div
                  key={gem.id}
                  className="absolute rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 shadow-lg hover:scale-110 transition-transform"
                  style={{
                    left: `${gem.x}%`,
                    top: `${gem.y}%`,
                    width: `${gemSizePercent}%`,
                    paddingBottom: `${gemSizePercent}%`,
                    background: gemConfig.gradient,
                    boxShadow: `0 2px 8px ${gemConfig.color}80, inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveGem(gem.id);
                  }}
                  title="Нажмите чтобы удалить"
                />
              );
            })}
          </div>

          {/* Gem count and clear */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Камней: <span className="font-medium text-foreground">{config.gems.length}</span>
            </span>
            {config.gems.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <Trash2 className="w-4 h-4 mr-1" />
                Очистить все
              </Button>
            )}
          </div>
        </div>

        {/* Gem selection */}
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">Выберите камень</h3>
            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(GEM_CONFIG) as GemType[]).map((type) => {
                const gemConfig = GEM_CONFIG[type];
                const isSelected = selectedGemType === type;
                return (
                  <button
                    key={type}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      isSelected
                        ? "border-current shadow-lg scale-105"
                        : "border-border hover:border-muted-foreground"
                    )}
                    style={isSelected ? { borderColor: gemConfig.color } : undefined}
                    onClick={() => setSelectedGemType(type)}
                  >
                    <div
                      className="w-12 h-12 mx-auto rounded-full mb-2"
                      style={{
                        background: gemConfig.gradient,
                        boxShadow: `0 4px 12px ${gemConfig.color}50`,
                      }}
                    />
                    <span className="text-sm font-medium">{gemConfig.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Подсказка:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Нажмите на изображение чтобы добавить камень</li>
              <li>Нажмите на камень чтобы удалить его</li>
              <li>Размер каждого камня — 2мм</li>
            </ul>
          </div>

          {/* Summary */}
          {config.gems.length > 0 && (
            <div className="p-4 bg-card rounded-xl border">
              <h4 className="font-medium mb-2">Добавлено камней:</h4>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(GEM_CONFIG) as GemType[]).map((type) => {
                  const count = config.gems.filter((g) => g.type === type).length;
                  if (count === 0) return null;
                  const gemConfig = GEM_CONFIG[type];
                  return (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: gemConfig.color }}
                    >
                      {gemConfig.label}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Пропустить
          </Button>
          <Button
            onClick={onNext}
            style={{ backgroundColor: themeConfig.accentColor }}
          >
            Далее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
