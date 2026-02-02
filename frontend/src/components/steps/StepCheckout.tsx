import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle, Mail, Phone, User, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onOrderSuccess?: () => void;
  onAddGems?: () => void;  // Optional: navigate to gems upsell step
  applicationId?: string;
  userEmail?: string;  // Pre-filled from auth
  userName?: string;   // Pre-filled from profile
  userPhone?: string;  // Pre-filled from profile
  onCustomerInfoChange?: (info: { email?: string; name?: string; phone?: string }) => void;
}

type SizeOption = "s" | "m" | "l";

export function StepCheckout({
  config,
  onConfigChange,
  onBack,
  onOrderSuccess,
  onAddGems,
  applicationId,
  userEmail,
  userName,
  userPhone,
  onCustomerInfoChange,
}: StepCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // Email is pre-filled from auth and read-only
  const email = userEmail || localStorage.getItem('userEmail') || '';
  const [name, setName] = useState(userName || '');
  const [phone, setPhone] = useState(userPhone || '');
  const [telegram, setTelegram] = useState('');
  const { config: themeConfig } = useAppTheme();
  const { toast } = useToast();

  // Update name/phone when props change
  useEffect(() => {
    if (userName && !name) setName(userName);
  }, [userName]);

  useEffect(() => {
    if (userPhone && !phone) setPhone(userPhone);
  }, [userPhone]);

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

  const handleSubmitOrder = async () => {
    if (!applicationId) {
      toast({
        title: "Ошибка",
        description: "Не удалось определить заказ. Попробуйте обновить страницу.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      toast({
        title: "Введите имя",
        description: "Как к вам обращаться?",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedPhone) {
      toast({
        title: "Введите телефон",
        description: "Телефон необходим для связи с вами",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await api.submitOrder(applicationId, {
        email: trimmedEmail,
        name: trimmedName,
        phone: trimmedPhone,
        telegram: telegram.trim() || undefined,
        material: config.material,
        size: config.size,
        size_option: config.sizeOption,
        gems: config.gems.length > 0 ? config.gems : undefined,
      });

      if (error || !data?.success) {
        throw new Error(error?.message || "Ошибка оформления заказа");
      }

      // Save customer info
      localStorage.setItem('userEmail', trimmedEmail);
      localStorage.setItem('userName', trimmedName);
      onCustomerInfoChange?.({ email: trimmedEmail, name: trimmedName, phone: trimmedPhone });

      toast({
        title: "Заказ оформлен!",
        description: "Мы свяжемся с вами для уточнения деталей и оплаты.",
      });

      onOrderSuccess?.();

    } catch (err: any) {
      console.error("Order submission error:", err);
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось оформить заказ. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
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
        <p className="text-muted-foreground text-sm">
          Оставьте контакты — мы свяжемся для уточнения деталей
        </p>
      </div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Preview & Size */}
        <div className="space-y-6">
          {/* Preview gallery */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-lg relative">
              {activeImageIndex === 0 ? (
                <div className="w-full h-full bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
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
            {/* Size indicator on preview */}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {activeImageIndex === 1 ? `Примерка: высота ${currentSize.dimensionsMm} мм` : `Высота изделия: ${currentSize.dimensionsMm} мм`}
            </p>
          </div>

          {/* Material selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground text-center block">
              Материал
            </label>
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
          </div>

          {/* Size selection - now shows pendant HEIGHT */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground text-center block">
              Высота кулона
            </label>
            <div className="flex gap-2 justify-center">
              {['s', 'm', 'l'].map((sizeKey) => {
                const sizeInfo = sizes[sizeKey];
                if (!sizeInfo) return null;

                return (
                  <button
                    key={sizeKey}
                    onClick={() => handleSizeChange(sizeKey as SizeOption)}
                    className={cn(
                      "px-4 py-3 rounded-xl border-2 transition-all min-w-[80px]",
                      config.sizeOption === sizeKey
                        ? config.material === "gold"
                          ? "border-gold bg-gold/10"
                          : "border-silver bg-silver/10"
                        : "border-border hover:border-theme/30"
                    )}
                  >
                    <div className="font-bold text-lg">{sizeInfo.label}</div>
                    <div className="text-muted-foreground text-sm">
                      {sizeInfo.dimensionsMm} мм
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price info */}
          <div className="bg-card rounded-xl border border-theme/30 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Базовая стоимость</span>
              <span className="font-display text-xl">
                от {price.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Это стоимость базового украшения. После оформления можно добавить камни и другие пожелания. Они считаются отдельно
            </p>
          </div>
        </div>

        {/* Column 2: Contact Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-display text-center">Ваши контакты</h3>

          {/* Email - read only, from auth */}
          {email && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{email}</span>
            </div>
          )}

          {/* Name - required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Имя *
            </label>
            <Input
              type="text"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card border-border focus:border-theme"
              required
            />
          </div>

          {/* Phone - required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Телефон *
            </label>
            <Input
              type="tel"
              placeholder="+7..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-card border-border focus:border-theme"
              required
            />
          </div>

          {/* Telegram - optional */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Telegram
            </label>
            <Input
              type="text"
              placeholder="@username (необязательно)"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="bg-card border-border focus:border-theme"
            />
          </div>

          {/* Telegram support link */}
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

          {/* Action buttons */}
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
              onClick={handleSubmitOrder}
              disabled={isProcessing || !agreedToTerms || !name.trim() || !phone.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isProcessing ? "Оформляем..." : "Оформить заказ"}
            </Button>
          </div>

          {/* Note about extras */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-theme/5 border border-theme/20 text-sm">
            <Gem className="w-4 h-4 text-theme mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              После оформления заказа вы сможете добавить камни, надпись на обратной стороне и другие пожелания.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
