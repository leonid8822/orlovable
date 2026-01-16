import { useState } from "react";
import { ArrowLeft, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MeasuringRuler } from "@/components/MeasuringRuler";
import { cn } from "@/lib/utils";
import type { PendantConfig } from "@/types/pendant";
import { SIZE_CONFIG, materialLabels } from "@/types/pendant";

interface StepCheckoutProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onBack: () => void;
}

// Hardcoded prices (will come from DB later)
const PRICES: Record<string, Record<string, number>> = {
  silver: { s: 5000, m: 8000, l: 12000 },
  gold: { s: 12500, m: 20000, l: 30000 },
};

export function StepCheckout({
  config,
  onConfigChange,
  onBack,
}: StepCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const sizeConfig = SIZE_CONFIG[config.sizeOption];
  const price = PRICES[config.material]?.[config.sizeOption] || 0;

  const handleCheckout = async () => {
    setIsProcessing(true);
    // TODO: Payment integration
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);
    // For now, just show alert
    alert("Оплата будет доступна позже. Спасибо за интерес!");
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
            Проверьте детали и оформите заказ
          </p>
        </div>

        {/* Size info (readonly) */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-medium mb-3">Размер</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <span className="text-xl font-display text-gold-light">
                {sizeConfig.label}
              </span>
            </div>
            <div>
              <p className="text-lg font-medium">{sizeConfig.dimensions}</p>
              <p className="text-sm text-muted-foreground">
                {sizeConfig.description} &bull; {sizeConfig.gender}
              </p>
            </div>
          </div>
        </div>

        {/* Measuring ruler */}
        <MeasuringRuler sizeOption={config.sizeOption} />

        {/* Material selection */}
        <div className="space-y-3">
          <h3 className="font-medium">Материал</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Silver - active */}
            <button
              onClick={() => onConfigChange({ material: "silver" })}
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
              <p className="text-sm text-muted-foreground text-center">
                {PRICES.silver[config.sizeOption]?.toLocaleString("ru-RU")} ₽
              </p>
            </button>

            {/* Gold - disabled with "Soon" */}
            <button
              disabled
              className="p-4 rounded-xl border-2 border-border opacity-50 cursor-not-allowed relative"
            >
              <div className="absolute top-2 right-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium">
                Soon
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 mx-auto mb-2 shadow-inner" />
              <p className="font-medium text-center">{materialLabels.gold}</p>
              <p className="text-sm text-muted-foreground text-center">
                {PRICES.gold[config.sizeOption]?.toLocaleString("ru-RU")} ₽
              </p>
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="bg-card rounded-xl border border-gold/30 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Итого к оплате</p>
          <p className="text-3xl font-display text-gradient-gold">
            {price.toLocaleString("ru-RU")} ₽
          </p>
          <p className="text-xs text-muted-foreground mt-1">
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
            {isProcessing ? "Обработка..." : "Оплатить"}
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div
        className="flex items-center justify-center animate-scale-in"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 blur-3xl bg-gold/10 rounded-full" />
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gold/30 bg-card">
            {config.generatedPreview ? (
              <img
                src={config.generatedPreview}
                alt="Выбранный вариант"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Превью недоступно</p>
              </div>
            )}
          </div>

          {/* Size badge */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-background border border-gold/30 rounded-full px-4 py-2 shadow-lg">
            <p className="text-sm font-medium text-center">
              <span className="text-gold-light">{sizeConfig.label}</span>
              <span className="text-muted-foreground">
                {" "}
                &bull; {sizeConfig.dimensions}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
