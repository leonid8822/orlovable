import { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PendantConfig, Material, Size } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSettings, useVisualization } from "@/contexts/SettingsContext";
import { getSizeConfigByMaterial } from "@/types/pendant";

interface StepCheckoutProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onBack: () => void;
}

type SizeOption = "s" | "m" | "l";

export function StepCheckout({
  config,
  onConfigChange,
  onBack,
}: StepCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { config: themeConfig } = useAppTheme();

  // Auto-switch images every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Get data from settings context
  const { settings } = useSettings();
  const visualization = useVisualization();
  const materialsConfig = settings.materials;
  const sizes = settings.sizes[config.material] || settings.sizes.silver;

  // For on-neck preview calculations
  const sizeConfig = getSizeConfigByMaterial(config.material);
  const currentSize = sizeConfig[config.sizeOption];
  // Get gender from form_factors settings
  const formFactorConfig = settings.form_factors[config.formFactor];
  const isMale = formFactorConfig?.gender === "male";
  const neckPhoto = isMale ? "/man-back.jpg" : "/woman-back.jpg";
  const attachPoint = isMale ? visualization.male : visualization.female;
  const pendantSizeMm = currentSize.dimensionsMm;
  const pendantSizePercent = (pendantSizeMm / visualization.imageWidthMm) * 100;
  const pendantX = attachPoint.attachX * 100;
  const pendantY = attachPoint.attachY * 100;
  const pendantFilter = config.material === "gold"
    ? "sepia(0.5) saturate(1.5) brightness(1.1) hue-rotate(-10deg)"
    : "none";

  const currentSizeConfig = sizes[config.sizeOption];
  const price = currentSizeConfig?.price || 0;
  const depositAmount = Math.round(price / 2);

  const handleSizeChange = (size: SizeOption) => {
    const newSizeConfig = sizes[size];
    onConfigChange({
      sizeOption: size,
      size: (newSizeConfig?.apiSize || 'pendant') as Size,
    });
  };

  const handleMaterialChange = (material: Material) => {
    const newSizes = settings.sizes[material] || settings.sizes.silver;
    const newSizeConfig = newSizes[config.sizeOption] || newSizes.m;
    onConfigChange({
      material,
      size: (newSizeConfig?.apiSize || 'pendant') as Size,
    });
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);
    alert(`Оплата первоначального взноса ${depositAmount.toLocaleString("ru-RU")} ₽ будет доступна позже. Спасибо за интерес!`);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-display text-gradient-theme mb-1">
          Оформление заказа
        </h2>
        <p className="text-sm text-muted-foreground">
          Выберите материал и размер
        </p>
      </div>

      {/* Material selection - centered */}
      <div className="flex gap-2 justify-center">
        {['silver', 'gold'].map((materialKey) => {
          const materialInfo = materialsConfig[materialKey];
          if (!materialInfo) return null;

          const isGold = materialKey === 'gold';
          const isDisabled = !materialInfo.enabled;

          return (
            <button
              key={materialKey}
              onClick={() => !isDisabled && handleMaterialChange(materialKey as Material)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm relative",
                config.material === materialKey
                  ? isGold
                    ? "border-gold bg-gold/10"
                    : "border-silver bg-silver/10"
                  : "border-border hover:border-theme/50",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full shadow-inner",
                  isGold
                    ? "bg-gradient-to-br from-yellow-300 to-yellow-600"
                    : "bg-gradient-to-br from-gray-200 to-gray-400"
                )}
              />
              <span className="font-medium">{materialInfo.label}</span>
              {isDisabled && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  Скоро
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main content - large visuals */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left side: Single large image with auto-switch */}
        <div className="flex-1 flex flex-col items-center">
          {/* Single large image */}
          <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-lg relative">
            {activeImageIndex === 0 ? (
              /* Pendant preview */
              <div className="w-full h-full bg-black flex items-center justify-center">
                {config.generatedPreview ? (
                  <img
                    src={config.generatedPreview}
                    alt="Pendant preview"
                    className="w-full h-full object-contain animate-fade-in"
                    style={{
                      filter: config.material === "gold"
                        ? "sepia(0.5) saturate(1.5) brightness(1.1) hue-rotate(-10deg)"
                        : "none"
                    }}
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">Превью недоступно</span>
                )}
              </div>
            ) : (
              /* On-neck preview */
              <div className="relative w-full h-full animate-fade-in">
                <img
                  src={neckPhoto}
                  alt="On neck preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {config.generatedPreview && (
                  <div
                    className="absolute transition-all duration-300 ease-out"
                    style={{
                      left: `${pendantX}%`,
                      top: `${pendantY}%`,
                      width: `${pendantSizePercent}%`,
                      transform: 'translate(-50%, -10%)',
                    }}
                  >
                    <img
                      src={config.generatedPreview}
                      alt="Pendant on neck"
                      className="w-full h-full object-contain"
                      style={{ filter: pendantFilter }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-4">
            {[0, 1].map((index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  index === activeImageIndex
                    ? "bg-theme scale-125"
                    : "bg-border hover:bg-theme/50"
                )}
                aria-label={index === 0 ? "Кулон" : "На шее"}
              />
            ))}
          </div>

          {/* Size selection - below dots */}
          <div className="flex gap-2 justify-center mt-4">
            {['s', 'm', 'l'].map((sizeKey) => {
              const sizeInfo = sizes[sizeKey];
              if (!sizeInfo) return null;

              return (
                <button
                  key={sizeKey}
                  onClick={() => handleSizeChange(sizeKey as SizeOption)}
                  className={cn(
                    "px-4 py-2 rounded-xl border-2 transition-all",
                    config.sizeOption === sizeKey
                      ? config.material === "gold"
                        ? "border-gold bg-gold/10"
                        : "border-silver bg-silver/10"
                      : "border-border hover:border-theme/30"
                  )}
                >
                  <span className="font-bold text-lg">{sizeInfo.label}</span>
                  <span className="text-muted-foreground ml-2">
                    {sizeInfo.dimensionsMm}мм
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Order details - narrower */}
        <div className="lg:w-[280px] space-y-3">
          {/* Price breakdown */}
          <div className="bg-card rounded-xl border border-theme/30 p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Полная стоимость</span>
              <span className="font-display text-lg">
                {price.toLocaleString("ru-RU")} ₽
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gradient-theme">Предоплата 50%</p>
                  <p className="text-xs text-muted-foreground">
                    Остаток {depositAmount.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <p className="text-xl font-display text-gradient-theme">
                  {depositAmount.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              Доставка по России включена
            </p>
          </div>

          {/* Order comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Комментарий (опционально)
            </label>
            <Textarea
              placeholder="Камни, гравировка, пожелания..."
              value={config.orderComment}
              onChange={(e) => onConfigChange({ orderComment: e.target.value })}
              className="min-h-[50px] text-sm bg-card border-border focus:border-theme resize-none"
            />
          </div>

          {/* Telegram link */}
          <a
            href="https://t.me/olai_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-theme transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Вопросы? Напишите в Telegram
          </a>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-border hover:border-theme/50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="theme"
              size="lg"
              className="flex-1"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing ? "..." : `Оплатить ${depositAmount.toLocaleString("ru-RU")} ₽`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
