import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Trash2, Gem, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendantConfig, GemPlacement, Size } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { api } from "@/lib/api";

type SizeOption = "s" | "m" | "l";

interface GemData {
  id: string;
  name: string;
  name_en: string;
  shape: string;
  size_mm: number;
  color: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  description?: string;
}

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
  const { settings } = useSettings();
  const [gems, setGems] = useState<GemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Get sizes from settings
  const sizes = settings.sizes[config.material] || settings.sizes.silver;

  const handleSizeChange = (size: SizeOption) => {
    const newSizeConfig = sizes[size];
    onConfigChange({
      sizeOption: size,
      size: (newSizeConfig?.apiSize || 'pendant') as Size,
    });
  };

  // Load gems from database
  useEffect(() => {
    const loadGems = async () => {
      setLoading(true);
      const { data } = await api.getGems();
      if (data?.gems && data.gems.length > 0) {
        setGems(data.gems);
        setSelectedGemId(data.gems[0].id);
      }
      setLoading(false);
    };
    loadGems();
  }, []);

  const selectedGem = gems.find((g) => g.id === selectedGemId);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current || !selectedGem) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Don't place gem if clicking too close to edges
      if (x < 5 || x > 95 || y < 5 || y > 95) return;

      const newGem: GemPlacement = {
        id: crypto.randomUUID(),
        type: selectedGem.name_en as any, // For backwards compatibility
        gemId: selectedGem.id,
        x,
        y,
      };

      onConfigChange({
        gems: [...config.gems, newGem],
      });
    },
    [config.gems, selectedGem, onConfigChange]
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

  // Calculate gem size based on pendant size and gem's actual size
  const getGemSizePercent = (gemSizeMm: number = 1.5) => {
    // Pendant takes ~80% of image
    // Calculate relative size based on pendant dimensions
    const pendantSizeMap: Record<string, number> = {
      s: 13, // 13mm pendant
      m: 19, // 19mm pendant
      l: 25, // 25mm pendant
    };
    const pendantMm = pendantSizeMap[config.sizeOption] || 19;
    // Gem percentage relative to pendant (which is 80% of image)
    return (gemSizeMm / pendantMm) * 80;
  };

  // Get gem config by placement (either from DB or fallback)
  const getGemConfig = (placement: GemPlacement): GemData | undefined => {
    // First try to find by gemId (new format)
    if (placement.gemId) {
      return gems.find((g) => g.id === placement.gemId);
    }
    // Fallback: find by type/name_en (old format)
    return gems.find((g) => g.name_en === placement.type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (gems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-center py-12">
        <Gem className="w-16 h-16 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-display">Камни не настроены</h2>
        <p className="text-muted-foreground">
          Администратор еще не добавил камни в библиотеку
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <Button onClick={onSkip}>
            Пропустить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header - simple label without step indicator */}
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
            Добавление натуральных камней
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display mb-2">
          Украсьте <span style={{ color: themeConfig.accentColor }}>камнями</span>
        </h2>
        <p className="text-muted-foreground">
          Нажмите на изображение, чтобы добавить камень{" "}
          {selectedGem?.size_mm || 1.5}мм
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image with gems */}
        <div className="space-y-4">
          <div
            ref={imageRef}
            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-background via-card to-background border-2 cursor-crosshair"
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
            {config.gems.map((placement) => {
              const gemConfig = getGemConfig(placement);
              if (!gemConfig) return null;

              const sizePercent = getGemSizePercent(gemConfig.size_mm);

              return (
                <div
                  key={placement.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                  style={{
                    left: `${placement.x}%`,
                    top: `${placement.y}%`,
                    width: `${sizePercent}%`,
                    height: `${sizePercent}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveGem(placement.id);
                  }}
                  title="Нажмите чтобы удалить"
                >
                  {gemConfig.image_url ? (
                    <img
                      src={gemConfig.image_url}
                      alt={gemConfig.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-full shadow-lg"
                      style={{
                        backgroundColor: gemConfig.color,
                        boxShadow: `0 2px 8px ${gemConfig.color}80`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Gem count and clear */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Камней:{" "}
              <span className="font-medium text-foreground">
                {config.gems.length}
              </span>
            </span>
            {config.gems.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <Trash2 className="w-4 h-4 mr-1" />
                Очистить все
              </Button>
            )}
          </div>

          {/* Size selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Размер изделия
            </label>
            <div className="flex gap-2">
              {(['s', 'm', 'l'] as SizeOption[]).map((sizeKey) => {
                const sizeInfo = sizes[sizeKey];
                if (!sizeInfo) return null;

                return (
                  <button
                    key={sizeKey}
                    onClick={() => handleSizeChange(sizeKey)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl border-2 transition-all text-center",
                      config.sizeOption === sizeKey
                        ? "border-current shadow-md"
                        : "border-border hover:border-muted-foreground"
                    )}
                    style={config.sizeOption === sizeKey ? { borderColor: themeConfig.accentColor } : undefined}
                  >
                    <div className="font-bold text-sm">{sizeInfo.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {sizeInfo.dimensionsMm} мм
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Размер влияет на масштаб камней относительно изделия
            </p>
          </div>
        </div>

        {/* Gem selection */}
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">Выберите камень</h3>
            <div className="grid grid-cols-3 gap-4">
              {gems.map((gem) => {
                const isSelected = selectedGemId === gem.id;
                return (
                  <button
                    key={gem.id}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      isSelected
                        ? "border-current shadow-lg scale-105"
                        : "border-border hover:border-muted-foreground"
                    )}
                    style={isSelected ? { borderColor: gem.color } : undefined}
                    onClick={() => setSelectedGemId(gem.id)}
                  >
                    <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      {gem.image_url ? (
                        <img
                          src={gem.image_url}
                          alt={gem.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full"
                          style={{
                            backgroundColor: gem.color,
                            boxShadow: `0 4px 12px ${gem.color}50`,
                          }}
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium">{gem.name}</span>
                    <span className="text-xs text-muted-foreground block">
                      {gem.size_mm}мм
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected gem description */}
            {selectedGem?.description && (
              <p className="text-sm text-muted-foreground mt-3 p-3 bg-card/50 rounded-lg border border-border/50">
                <span className="font-medium" style={{ color: selectedGem.color }}>{selectedGem.name}</span>
                {" — "}
                {selectedGem.description}
              </p>
            )}
          </div>

          <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Подсказка:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Нажмите на изображение чтобы добавить камень</li>
              <li>Нажмите на камень чтобы удалить его</li>
              <li>Размер камня — {selectedGem?.size_mm || 1.5}мм</li>
            </ul>
          </div>

          {/* Summary */}
          {config.gems.length > 0 && (
            <div className="p-4 bg-card rounded-xl border">
              <h4 className="font-medium mb-2">Добавлено камней:</h4>
              <div className="flex flex-wrap gap-2">
                {gems.map((gem) => {
                  const count = config.gems.filter(
                    (g) => g.gemId === gem.id || g.type === gem.name_en
                  ).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={gem.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: gem.color }}
                    >
                      {gem.name}: {count}
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
