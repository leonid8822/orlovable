import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PendantConfig, Material, Size } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSettings, useVisualization } from "@/contexts/SettingsContext";
import { getSizeConfigByMaterial } from "@/types/pendant";

interface StepCheckoutProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onBack: () => void;
  onPaymentSuccess?: (amount: number, orderId: string) => void;
  applicationId?: string;
}

type SizeOption = "s" | "m" | "l";

export function StepCheckout({
  config,
  onConfigChange,
  onBack,
  onPaymentSuccess,
  applicationId,
}: StepCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [email, setEmail] = useState(() => {
    // Try to get email from localStorage (set during auth)
    return localStorage.getItem('userEmail') || '';
  });
  const { config: themeConfig } = useAppTheme();
  const { toast } = useToast();

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
  const depositPercent = currentSizeConfig?.depositPercent ?? (config.material === "gold" ? 30 : 50);
  const depositAmount = Math.round(price * depositPercent / 100);

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
    if (!applicationId) {
      toast({
        title: "Ошибка",
        description: "Не удалось определить заказ. Попробуйте обновить страницу.",
        variant: "destructive",
      });
      return;
    }

    // Validate email (required for payment receipt)
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({
        title: "Введите email",
        description: "Email необходим для отправки чека об оплате",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await api.createPayment({
        application_id: applicationId,
        amount: depositAmount,
        email: trimmedEmail,
        order_comment: config.orderComment,
      });

      if (error || !data?.success) {
        throw new Error(error?.message || "Ошибка создания платежа");
      }

      // Redirect to Tinkoff payment page
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error("Не получена ссылка на оплату");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Ошибка оплаты",
        description: err.message || "Не удалось создать платёж. Попробуйте позже.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-display text-gradient-theme mb-1">
          Оформление заказа
        </h2>
      </div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Material & Size Selection */}
        <div className="space-y-6">
          <h3 className="text-lg font-display text-center">Материал и размер</h3>

          {/* Preview gallery */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-lg relative">
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
            <div className="flex gap-2 mt-3">
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
          </div>

          {/* Material selection */}
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

          {/* Size selection */}
          <div className="flex gap-2 justify-center">
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

        {/* Column 2: Deposit / Payment */}
        <div className="space-y-4">
          <h3 className="text-lg font-display text-center">Предоплата</h3>

          {/* Price breakdown */}
          <div className="bg-card rounded-xl border border-theme/30 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Полная стоимость</span>
              <span className="font-display text-xl">
                {price.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gradient-theme">Предоплата {depositPercent}%</p>
                  <p className="text-sm text-muted-foreground">
                    Остаток при получении: {(price - depositAmount).toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <p className="text-2xl font-display text-gradient-theme">
                  {depositAmount.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center pt-3 border-t border-border">
              Бесплатная доставка по России
            </p>
          </div>

          {/* Email for receipt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email для чека *
            </label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border focus:border-theme"
              required
            />
          </div>

          {/* Order comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Комментарий к заказу
            </label>
            <Textarea
              placeholder="Камни, гравировка, особые пожелания..."
              value={config.orderComment}
              onChange={(e) => onConfigChange({ orderComment: e.target.value })}
              className="min-h-[80px] text-sm bg-card border-border focus:border-theme resize-none"
            />
          </div>

          {/* Telegram link */}
          <a
            href="https://t.me/olai_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-theme transition-colors py-2"
          >
            <MessageCircle className="w-4 h-4" />
            Вопросы? Напишите в Telegram
          </a>

          {/* Agreement checkbox */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              Я согласен с{" "}
              <Link
                to="/oferta"
                target="_blank"
                className="text-theme hover:underline"
              >
                Публичной офертой
              </Link>{" "}
              и{" "}
              <Link
                to="/privacy"
                target="_blank"
                className="text-theme hover:underline"
              >
                Политикой конфиденциальности
              </Link>
            </label>
          </div>

          {/* Action buttons - stacked on mobile */}
          <div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              className="w-full md:w-auto border-border hover:border-theme/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <Button
              variant="theme"
              size="lg"
              className="w-full md:flex-1"
              onClick={handleCheckout}
              disabled={isProcessing || !agreedToTerms || !email.trim()}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isProcessing ? "Обработка..." : `Оплатить ${depositAmount.toLocaleString("ru-RU")} ₽`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
