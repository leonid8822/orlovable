import { useState, useEffect } from "react";
import { Check, MessageCircle, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PendantConfig } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";
import { materialLabels, SILVER_SIZE_CONFIG, GOLD_SIZE_CONFIG, SizeOption } from "@/types/pendant";

interface StepConfirmationProps {
  config: PendantConfig;
  applicationId: string;
  paymentAmount?: number;
  orderId?: string;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
}

export function StepConfirmation({
  config,
  applicationId,
  paymentAmount,
  orderId,
  onConfigChange,
}: StepConfirmationProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config: themeConfig } = useAppTheme();
  const [telegramUsername, setTelegramUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load telegram username from localStorage or user data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.telegramUsername) {
          setTelegramUsername(user.telegramUsername);
          setIsSaved(true);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const getSizeConfig = () => {
    const sizeConfigs = config.material === "gold" ? GOLD_SIZE_CONFIG : SILVER_SIZE_CONFIG;
    return sizeConfigs[config.sizeOption as SizeOption];
  };

  const sizeConfig = getSizeConfig();

  const handleSaveTelegram = async () => {
    if (!telegramUsername.trim()) {
      toast({
        title: "Введите ник",
        description: "Укажите ваш Telegram для связи",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Format telegram username
      let formattedUsername = telegramUsername.trim();
      if (!formattedUsername.startsWith("@")) {
        formattedUsername = `@${formattedUsername}`;
      }

      // Save to application
      await api.updateApplication(applicationId, {
        telegram_username: formattedUsername,
      });

      // Also save to user profile if logged in
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.userId) {
            await api.updateUserProfile(user.userId, {
              telegram_username: formattedUsername,
            });

            // Update localStorage
            user.telegramUsername = formattedUsername;
            localStorage.setItem("user", JSON.stringify(user));
          }
        } catch {
          // ignore
        }
      }

      setTelegramUsername(formattedUsername);
      setIsSaved(true);

      toast({
        title: "Сохранено!",
        description: "Мы свяжемся с вами в Telegram",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить. Попробуйте ещё раз.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewOrder = () => {
    navigate("/");
  };

  const handleContactTelegram = () => {
    window.open("https://t.me/orlovleo", "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Success header */}
      <div className="text-center mb-12">
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

      {/* Order summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Left column - images */}
        <div className="space-y-6">
          {/* Original image */}
          {config.imagePreview && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Ваш эскиз</Label>
              <div className="rounded-xl overflow-hidden bg-card border border-border/50">
                <img
                  src={config.imagePreview}
                  alt="Исходное изображение"
                  className="w-full h-48 object-contain"
                />
              </div>
            </div>
          )}

          {/* Generated design */}
          {config.generatedPreview && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Выбранный дизайн</Label>
              <div
                className="rounded-xl overflow-hidden bg-gradient-to-br from-background via-card to-background border-2"
                style={{ borderColor: `${themeConfig.accentColor}50` }}
              >
                <img
                  src={config.generatedPreview}
                  alt="Выбранный дизайн"
                  className="w-full h-64 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right column - details */}
        <div className="space-y-6">
          {/* Order details */}
          <div
            className="bg-card/50 rounded-xl border border-border/50 p-6 space-y-4"
          >
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

              {config.orderComment && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground block mb-1">Пожелания</span>
                  <p className="text-sm">{config.orderComment}</p>
                </div>
              )}

              {paymentAmount && (
                <div className="flex justify-between pt-3 border-t border-border/50 font-medium">
                  <span>Оплачено</span>
                  <span style={{ color: themeConfig.accentColor }}>
                    {paymentAmount.toLocaleString()} ₽
                  </span>
                </div>
              )}

              {orderId && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Номер заказа</span>
                  <span className="font-mono">{orderId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Telegram input */}
          <div
            className="bg-card/50 rounded-xl border border-border/50 p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: themeConfig.accentColor }} />
              <h3 className="font-medium">Как с вами связаться?</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Укажите ваш Telegram ник для связи по заказу
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="@username"
                value={telegramUsername}
                onChange={(e) => {
                  setTelegramUsername(e.target.value);
                  setIsSaved(false);
                }}
                disabled={isSaving}
                className="flex-1"
              />
              <Button
                onClick={handleSaveTelegram}
                disabled={isSaving || isSaved}
                size="icon"
                style={{
                  backgroundColor: isSaved ? "#22c55e" : themeConfig.accentColor,
                }}
              >
                {isSaved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {isSaved && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Сохранено
              </p>
            )}
          </div>

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
