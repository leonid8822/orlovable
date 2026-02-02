import { Check, Sparkles, MessageCircle, Gem, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { PendantConfig } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { materialLabels, SILVER_SIZE_CONFIG, GOLD_SIZE_CONFIG, SizeOption } from "@/types/pendant";

interface StepConfirmationProps {
  config: PendantConfig;
  applicationId: string;
  paymentAmount?: number;
  orderId?: string;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onAddGems?: () => void;
}

export function StepConfirmation({
  config,
  applicationId,
  paymentAmount,
  orderId,
  onConfigChange,
  onAddGems,
}: StepConfirmationProps) {
  const navigate = useNavigate();
  const { config: themeConfig } = useAppTheme();
  const { settings } = useSettings();

  const getSizeConfig = () => {
    const sizeConfigs = config.material === "gold" ? GOLD_SIZE_CONFIG : SILVER_SIZE_CONFIG;
    return sizeConfigs[config.sizeOption as SizeOption];
  };

  const sizeConfig = getSizeConfig();

  // Get price from settings
  const sizes = settings.sizes[config.material] || settings.sizes.silver;
  const currentSizeConfig = sizes[config.sizeOption];
  const basePrice = currentSizeConfig?.price || 0;

  // Calculate gems price
  const gemsConfig = settings.gems_config || { pricePerGem: 2000 };
  const gemsCount = config.gems?.length || 0;
  const gemsPrice = gemsCount * gemsConfig.pricePerGem;
  const totalPrice = basePrice + gemsPrice;

  const handleNewOrder = () => {
    navigate("/");
  };

  const handleContactTelegram = () => {
    window.open("https://t.me/orlovleo", "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${themeConfig.accentColor}20` }}
          >
            <Check
              className="w-10 h-10"
              style={{ color: themeConfig.accentColor }}
            />
          </div>
          <div
            className="absolute inset-0 blur-xl rounded-full animate-pulse"
            style={{ backgroundColor: `${themeConfig.accentColor}30` }}
          />
        </div>

        <h1
          className={`text-3xl md:text-4xl font-display mb-4 ${themeConfig.textGradientClass}`}
        >
          Заказ оформлен!
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Спасибо за заказ. Мы свяжемся с вами для уточнения деталей.
        </p>
      </div>

      {/* Main content - pendant preview large on white */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Left column - large pendant preview on white background */}
        <div className="flex flex-col items-center">
          {config.generatedPreview && (
            <div
              className="w-full max-w-md aspect-square rounded-2xl overflow-hidden border-2 bg-white flex items-center justify-center p-8"
              style={{ borderColor: `${themeConfig.accentColor}30` }}
            >
              <img
                src={config.generatedPreview}
                alt="Ваше украшение"
                className="w-full h-full object-contain"
                style={{
                  filter: config.material === "gold"
                    ? "sepia(0.5) saturate(1.5) brightness(1.1) hue-rotate(-10deg)"
                    : "none"
                }}
              />
            </div>
          )}
        </div>

        {/* Right column - details and upsell */}
        <div className="space-y-6">
          {/* Order details */}
          <div className="bg-card/50 rounded-xl border border-border/50 p-6 space-y-4">
            <h3 className="font-medium text-lg">Детали заказа</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Материал</span>
                <span>{materialLabels[config.material]}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Размер</span>
                <span>{sizeConfig?.label} ({sizeConfig?.dimensions})</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Базовая стоимость</span>
                <span>{basePrice.toLocaleString("ru-RU")} ₽</span>
              </div>

              {gemsCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Камни ({gemsCount} шт.)</span>
                  <span>+{gemsPrice.toLocaleString("ru-RU")} ₽</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-border/50 font-medium text-base">
                <span>Итого</span>
                <span style={{ color: themeConfig.accentColor }}>
                  от {totalPrice.toLocaleString("ru-RU")} ₽
                </span>
              </div>

              {paymentAmount && paymentAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Оплачено</span>
                  <span>{paymentAmount.toLocaleString("ru-RU")} ₽</span>
                </div>
              )}

              {orderId && (
                <div className="flex justify-between text-xs text-muted-foreground pt-2">
                  <span>Номер заказа</span>
                  <span className="font-mono">{orderId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gems upsell */}
          {onAddGems && gemsCount === 0 && (
            <div
              className="rounded-xl border-2 border-dashed p-6 space-y-4 hover:border-theme/50 transition-colors cursor-pointer"
              style={{ borderColor: `${themeConfig.accentColor}30` }}
              onClick={onAddGems}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${themeConfig.accentColor}15` }}
                >
                  <Gem className="w-6 h-6" style={{ color: themeConfig.accentColor }} />
                </div>
                <div>
                  <h4 className="font-medium">Добавить камни</h4>
                  <p className="text-sm text-muted-foreground">
                    Украсьте изделие натуральными камнями
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                style={{ borderColor: themeConfig.accentColor, color: themeConfig.accentColor }}
              >
                <Plus className="w-4 h-4" />
                Выбрать камни (+{gemsConfig.pricePerGem.toLocaleString("ru-RU")} ₽/шт)
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleContactTelegram}
              className="w-full gap-2"
              style={{ backgroundColor: themeConfig.accentColor }}
            >
              <MessageCircle className="w-4 h-4" />
              Написать нам в Telegram
            </Button>

            <Button
              onClick={handleNewOrder}
              variant="outline"
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Создать новое украшение
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
