import { useState } from "react";
import { ArrowLeft, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PendantOnNeck, SizeOption } from "@/components/PendantOnNeck";
import { cn } from "@/lib/utils";
import type { PendantConfig, Material } from "@/types/pendant";
import {
  materialLabels,
  getSizeConfigByMaterial,
  FORM_CONFIG,
} from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";

interface StepCheckoutProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onBack: () => void;
}

// Prices per material and size
// Серебро: S=13мм, M=19мм, L=25мм
// Золото: S=10мм, M=13мм, L=19мм
const PRICES: Record<Material, Record<SizeOption, number>> = {
  silver: { s: 5000, m: 8000, l: 12000 },
  gold: { s: 15000, m: 22000, l: 35000 },
};

export function StepCheckout({
  config,
  onConfigChange,
  onBack,
}: StepCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { config: themeConfig } = useAppTheme();

  const sizeConfig = getSizeConfigByMaterial(config.material);
  const currentSizeConfig = sizeConfig[config.sizeOption];
  const price = PRICES[config.material]?.[config.sizeOption] || 0;
  const depositAmount = Math.round(price / 2);

  const handleSizeChange = (size: SizeOption) => {
    const newSizeConfig = getSizeConfigByMaterial(config.material)[size];
    onConfigChange({
      sizeOption: size,
      size: newSizeConfig.apiSize,
    });
  };

  const handleMaterialChange = (material: Material) => {
    // Reset size to 's' when changing material since sizes differ
    const newSizeConfig = getSizeConfigByMaterial(material).s;
    onConfigChange({
      material,
      sizeOption: 's',
      size: newSizeConfig.apiSize,
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
          <p className="font-medium">{FORM_CONFIG[config.formFactor].label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {FORM_CONFIG[config.formFactor].description}
          </p>
        </div>

        {/* Material selection */}
        <div className="space-y-3">
          <h3 className="font-medium">Материал</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Silver */}
            <button
              onClick={() => handleMaterialChange("silver")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-300",
                config.material === "silver"
                  ? "border-silver bg-silver/10"
                  : "border-border hover:border-silver/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 mx-auto mb-2 shadow-inner" />
              <p className="font-medium text-center">
                {materialLabels.silver}
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                S: 13мм · M: 19мм · L: 25мм
              </p>
            </button>

            {/* Gold - now active */}
            <button
              onClick={() => handleMaterialChange("gold")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-300",
                config.material === "gold"
                  ? "border-gold bg-gold/10"
                  : "border-border hover:border-gold/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 mx-auto mb-2 shadow-inner" />
              <p className="font-medium text-center">{materialLabels.gold}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                S: 10мм · M: 13мм · L: 19мм
              </p>
            </button>
          </div>
        </div>

        {/* Size selection */}
        <div className="space-y-3">
          <h3 className="font-medium">Размер</h3>
          <div className="grid grid-cols-3 gap-3">
            {(["s", "m", "l"] as SizeOption[]).map((size) => {
              const sizeInfo = sizeConfig[size];
              const sizePrice = PRICES[config.material][size];
              return (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-300",
                    config.sizeOption === size
                      ? config.material === "gold"
                        ? "border-gold bg-gold/10"
                        : "border-silver bg-silver/10"
                      : "border-border hover:border-gold/30"
                  )}
                >
                  <p className="text-xl font-display font-bold">{sizeInfo.label}</p>
                  <p className="text-sm">{sizeInfo.dimensions}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sizePrice.toLocaleString("ru-RU")} ₽
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

      {/* Right: Pendant on Neck Preview */}
      <div
        className="flex items-center justify-center animate-scale-in"
        style={{ animationDelay: "0.2s" }}
      >
        <PendantOnNeck
          pendantImage={config.generatedPreview}
          selectedSize={config.sizeOption}
          onSizeChange={handleSizeChange}
          accentColor={themeConfig.accentColor}
          material={config.material}
          formFactor={config.formFactor}
          className="w-full"
        />
      </div>
    </div>
  );
}
