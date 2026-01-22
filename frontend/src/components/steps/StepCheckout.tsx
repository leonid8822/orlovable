import { useState } from "react";
import { ArrowLeft, CreditCard, MessageCircle, Image, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PendantOnNeck, SizeOption } from "@/components/PendantOnNeck";
import { cn } from "@/lib/utils";
import type { PendantConfig, Material, Size } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSettings, useFormFactors, useMaterials, useSizes } from "@/contexts/SettingsContext";

type PreviewMode = "pendant" | "on-neck";

interface StepCheckoutProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onBack: () => void;
}

export function StepCheckout({
  config,
  onConfigChange,
  onBack,
}: StepCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("on-neck");
  const { config: themeConfig } = useAppTheme();

  // Get data from settings context
  const { settings } = useSettings();
  const formFactors = settings.form_factors;
  const materialsConfig = settings.materials;
  const sizes = settings.sizes[config.material] || settings.sizes.silver;

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
    // Reset size to 's' when changing material since sizes differ
    const newSizes = settings.sizes[material] || settings.sizes.silver;
    const newSizeConfig = newSizes.s;
    onConfigChange({
      material,
      sizeOption: 's',
      size: (newSizeConfig?.apiSize || 'bracelet') as Size,
    });
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    // TODO: Payment integration
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);
    // For now, just show alert
    alert(`Оплата первоначального взноса ${depositAmount.toLocaleString("ru-RU")} ₽ будет доступна позже. Спасибо за интерес!`);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Order form */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
            Оформление заказа
          </h2>
          <p className="text-muted-foreground">
            Выберите материал и размер украшения
          </p>
        </div>

        {/* Form info (readonly) */}
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Форма украшения</p>
          <p className="font-medium">{formFactors[config.formFactor]?.label || config.formFactor}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formFactors[config.formFactor]?.description || ''}
          </p>
        </div>

        {/* Material selection */}
        <div className="space-y-3">
          <h3 className="font-medium">Материал</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(materialsConfig).map(([materialKey, materialInfo]) => {
              const materialSizes = settings.sizes[materialKey];
              const sizesText = materialSizes
                ? Object.entries(materialSizes)
                    .map(([k, v]) => `${v.label}: ${v.dimensionsMm}мм`)
                    .join(' · ')
                : '';
              const isGold = materialKey === 'gold';
              const isDisabled = !materialInfo.enabled;

              return (
                <button
                  key={materialKey}
                  onClick={() => !isDisabled && handleMaterialChange(materialKey as Material)}
                  disabled={isDisabled}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300 relative",
                    config.material === materialKey
                      ? isGold
                        ? "border-gold bg-gold/10"
                        : "border-silver bg-silver/10"
                      : "border-border hover:border-gold/50",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isDisabled && (
                    <span className="absolute top-2 right-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                      Скоро
                    </span>
                  )}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full mx-auto mb-2 shadow-inner",
                      isGold
                        ? "bg-gradient-to-br from-yellow-300 to-yellow-600"
                        : "bg-gradient-to-br from-gray-200 to-gray-400"
                    )}
                  />
                  <p className="font-medium text-center">{materialInfo.label}</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {sizesText}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Size selection */}
        <div className="space-y-3">
          <h3 className="font-medium">Размер</h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(sizes).map(([sizeKey, sizeInfo]) => {
              return (
                <button
                  key={sizeKey}
                  onClick={() => handleSizeChange(sizeKey as SizeOption)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-300",
                    config.sizeOption === sizeKey
                      ? config.material === "gold"
                        ? "border-gold bg-gold/10"
                        : "border-silver bg-silver/10"
                      : "border-border hover:border-gold/30"
                  )}
                >
                  <p className="text-xl font-display font-bold">{sizeInfo.label}</p>
                  <p className="text-sm">{sizeInfo.dimensionsMm}мм</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sizeInfo.price.toLocaleString("ru-RU")} ₽
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-card rounded-xl border border-gold/30 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">Полная стоимость</p>
            <p className="text-xl font-display">
              {price.toLocaleString("ru-RU")} ₽
            </p>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gradient-gold">Первоначальный взнос (50%)</p>
                <p className="text-xs text-muted-foreground">
                  Остаток {depositAmount.toLocaleString("ru-RU")} ₽ перед отправкой
                </p>
              </div>
              <p className="text-2xl font-display text-gradient-gold">
                {depositAmount.toLocaleString("ru-RU")} ₽
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            Доставка по России включена
          </p>
        </div>

        {/* Order comment */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Комментарий к заказу (опционально)
          </label>
          <Textarea
            placeholder="Дополнительные пожелания: камни, гравировка, особые требования..."
            value={config.orderComment}
            onChange={(e) => onConfigChange({ orderComment: e.target.value })}
            className="min-h-[80px] bg-card border-border focus:border-gold resize-none"
          />
        </div>

        {/* Telegram link */}
        <a
          href="https://t.me/olai_support"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors py-2"
        >
          <MessageCircle className="w-4 h-4" />
          Есть вопросы? Напишите нам в Telegram
        </a>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-border hover:border-gold/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <Button
            variant="gold"
            size="xl"
            className="flex-1"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            <CreditCard className="w-5 h-5" />
            {isProcessing ? "Обработка..." : `Оплатить ${depositAmount.toLocaleString("ru-RU")} ₽`}
          </Button>
        </div>
      </div>

      {/* Right: Preview with mode toggle */}
      <div
        className="flex flex-col items-center animate-scale-in"
        style={{ animationDelay: "0.2s" }}
      >
        {/* Preview mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPreviewMode("pendant")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              previewMode === "pendant"
                ? "bg-card border-2"
                : "bg-transparent border border-border hover:border-gold/50"
            )}
            style={{
              borderColor: previewMode === "pendant" ? themeConfig.accentColor : undefined,
            }}
          >
            <Image className="w-4 h-4" />
            <span className="text-sm">Кулон</span>
          </button>
          <button
            onClick={() => setPreviewMode("on-neck")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              previewMode === "on-neck"
                ? "bg-card border-2"
                : "bg-transparent border border-border hover:border-gold/50"
            )}
            style={{
              borderColor: previewMode === "on-neck" ? themeConfig.accentColor : undefined,
            }}
          >
            <User className="w-4 h-4" />
            <span className="text-sm">На шее</span>
          </button>
        </div>

        {/* Preview content */}
        {previewMode === "pendant" ? (
          <div className="w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            {config.generatedPreview ? (
              <img
                src={config.generatedPreview}
                alt="Pendant preview"
                className="w-full h-full object-contain"
                style={{
                  filter: config.material === "gold"
                    ? "sepia(0.5) saturate(1.5) brightness(1.1) hue-rotate(-10deg)"
                    : "none"
                }}
              />
            ) : (
              <span className="text-muted-foreground">Превью недоступно</span>
            )}
          </div>
        ) : (
          <PendantOnNeck
            pendantImage={config.generatedPreview}
            selectedSize={config.sizeOption}
            onSizeChange={handleSizeChange}
            accentColor={themeConfig.accentColor}
            material={config.material}
            formFactor={config.formFactor}
            className="w-full"
          />
        )}

        {/* Size indicator for pendant mode */}
        {previewMode === "pendant" && currentSizeConfig && (
          <div
            className="mt-3 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: `${themeConfig.accentColor}20`,
              color: themeConfig.accentColor,
              border: `1px solid ${themeConfig.accentColor}40`,
            }}
          >
            {currentSizeConfig.dimensionsMm}мм
          </div>
        )}
      </div>
    </div>
  );
}
