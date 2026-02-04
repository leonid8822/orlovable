import { useState, useEffect } from "react";
import { Check, Sparkles, MessageCircle, Gem, Plus, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { PendantConfig } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSettings, useVisualization } from "@/contexts/SettingsContext";
import { materialLabels, SILVER_SIZE_CONFIG, GOLD_SIZE_CONFIG, SizeOption, getSizeConfigByMaterial } from "@/types/pendant";
import { PendantWithGems } from "@/components/PendantWithGems";

interface StepConfirmationProps {
  config: PendantConfig;
  applicationId: string;
  paymentAmount?: number;
  totalPaid?: number;
  orderId?: string;
  userEmail?: string;
  userName?: string;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onAddGems?: () => void;
}

export function StepConfirmation({
  config,
  applicationId,
  paymentAmount,
  totalPaid = 0,
  orderId,
  userEmail,
  userName,
  onConfigChange,
  onAddGems,
}: StepConfirmationProps) {
  const navigate = useNavigate();
  const { config: themeConfig } = useAppTheme();
  const { settings } = useSettings();
  const visualization = useVisualization();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Auto-switch images every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getSizeConfigFn = () => {
    const sizeConfigs = config.material === "gold" ? GOLD_SIZE_CONFIG : SILVER_SIZE_CONFIG;
    return sizeConfigs[config.sizeOption as SizeOption];
  };

  const sizeConfig = getSizeConfigFn();

  // On-neck visualization calculations
  const sizeConfigByMaterial = getSizeConfigByMaterial(config.material);
  const currentSize = sizeConfigByMaterial[config.sizeOption];
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
    const orderIdText = orderId ? `Заказ №${orderId}` : `Заявка ${applicationId}`;
    const message = encodeURIComponent(`Здравствуйте! ${orderIdText}. Хочу уточнить детали.`);
    window.open(`https://t.me/olai_support?text=${message}`, "_blank");
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

      {/* Main content - pendant preview large with gems */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Left column - pendant preview with gems overlay */}
        <div className="flex flex-col items-center">
          {config.generatedPreview && (
            <>
              <div
                className="w-full max-w-md aspect-square rounded-2xl overflow-hidden border-2 relative"
                style={{ borderColor: `${themeConfig.accentColor}30` }}
              >
                {activeImageIndex === 0 ? (
                  // Pendant with gems overlay
                  <div className="w-full h-full bg-gradient-to-br from-background via-card to-background">
                    <PendantWithGems
                      imageUrl={config.generatedPreview}
                      gems={config.gems || []}
                      sizeOption={config.sizeOption}
                      className="w-full h-full"
                      style={{ filter: pendantFilter }}
                    />
                  </div>
                ) : (
                  // On-neck visualization
                  <div className="relative w-full h-full animate-fade-in">
                    <img
                      src={neckPhoto}
                      alt="На шее"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute transition-all duration-300 ease-out"
                      style={{
                        left: `${pendantX}%`,
                        top: `${pendantY}%`,
                        width: `${pendantSizePercent}%`,
                        transform: 'translate(-50%, -10%)',
                      }}
                    >
                      <PendantWithGems
                        imageUrl={config.generatedPreview}
                        gems={config.gems || []}
                        sizeOption={config.sizeOption}
                        className="w-full h-full"
                        style={{ filter: pendantFilter }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image toggle dots */}
              <div className="flex gap-2 mt-3">
                {[0, 1].map((index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      index === activeImageIndex
                        ? "scale-125"
                        : "bg-border hover:opacity-70"
                    )}
                    style={index === activeImageIndex ? { backgroundColor: themeConfig.accentColor } : undefined}
                    aria-label={index === 0 ? "Кулон" : "На шее"}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {activeImageIndex === 1 ? `Примерка: высота ${currentSize.dimensionsMm} мм` : `Высота изделия: ${currentSize.dimensionsMm} мм`}
              </p>
            </>
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
                <span className="text-muted-foreground">Размер (высота)</span>
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

              {totalPaid > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Оплачено</span>
                  <span>{totalPaid.toLocaleString("ru-RU")} ₽</span>
                </div>
              )}

              {orderId && (
                <div className="flex justify-between text-xs text-muted-foreground pt-2">
                  <span>Номер заказа</span>
                  <span className="font-mono">{orderId}</span>
                </div>
              )}
            </div>

            {/* Prepayment button */}
            <Button
              onClick={async () => {
                setIsCreatingPayment(true);
                try {
                  const { data, error } = await api.createPayment({
                    application_id: applicationId,
                    amount: 5000, // 5000 rubles prepayment
                    email: userEmail,
                    name: userName,
                    order_comment: "Предоплата за украшение",
                  });
                  if (error) {
                    console.error("Payment error:", error);
                    return;
                  }
                  if (data?.payment_url) {
                    window.location.href = data.payment_url;
                  }
                } finally {
                  setIsCreatingPayment(false);
                }
              }}
              disabled={isCreatingPayment}
              className="w-full gap-2"
              variant="outline"
              style={{ borderColor: themeConfig.accentColor, color: themeConfig.accentColor }}
            >
              {isCreatingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Внести предоплату 5 000 ₽
            </Button>
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
