import { useState } from "react";
import { Check, CreditCard, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PendantPreview } from "@/components/PendantPreview";
import { cn } from "@/lib/utils";
import type { PendantConfig } from "@/types/pendant";
import { materialLabels, sizeLabels, sizeDimensions } from "@/types/pendant";

interface Step4CheckoutProps {
  config: PendantConfig;
  onBack: () => void;
}

const basePrices: Record<string, number> = {
  interior: 12000,
  pendant: 8000,
  bracelet: 5000,
};

const materialMultiplier: Record<string, number> = {
  silver: 1,
  gold: 2.5,
};

export function Step4Checkout({ config, onBack }: Step4CheckoutProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const basePrice = basePrices[config.size];
  const materialPrice = basePrice * materialMultiplier[config.material];
  const engravingPrice = config.hasBackEngraving ? 1000 : 0;
  const totalPrice = materialPrice + engravingPrice;

  const handleCheckout = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    alert("Спасибо за заказ! Мы свяжемся с вами в ближайшее время.");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Order summary & form */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
            Оформление заказа
          </h2>
          <p className="text-muted-foreground">
            Проверьте детали и завершите оформление
          </p>
        </div>

        {/* Order summary */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-display text-xl text-foreground">Ваш заказ</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Изделие</span>
              <span className="text-foreground">
                {config.formFactor === "round" ? "Круглый кулон" : "Контурный кулон"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Материал</span>
              <span className="text-foreground">{materialLabels[config.material]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Размер</span>
              <span className="text-foreground">
                {sizeLabels[config.size]} ({sizeDimensions[config.size]})
              </span>
            </div>
            {config.hasBackEngraving && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Гравировка сзади</span>
                <span className="text-gold-light">+ 1 000 ₽</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-display text-foreground">Итого</span>
              <span className="text-2xl font-display text-gradient-gold">
                {totalPrice.toLocaleString("ru-RU")} ₽
              </span>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="space-y-4">
          <h3 className="font-display text-xl text-foreground">Контактные данные</h3>
          
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border focus:border-gold h-12"
            />
            <Input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-card border-border focus:border-gold h-12"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Check className="w-4 h-4" />, text: "Гарантия качества" },
            { icon: <Lock className="w-4 h-4" />, text: "Безопасная оплата" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                {feature.icon}
              </div>
              {feature.text}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <Button
            variant="gold"
            size="xl"
            onClick={handleCheckout}
            disabled={!email || !phone || isProcessing}
            className="flex-1"
          >
            <CreditCard className="w-5 h-5" />
            {isProcessing ? "Обработка..." : "Оплатить"}
          </Button>
        </div>
      </div>

      {/* Right: Final preview */}
      <div className="flex flex-col items-center justify-center gap-8 animate-scale-in" style={{ animationDelay: "0.2s" }}>
        <div className="relative">
          <div
            className={cn(
              "absolute inset-0 blur-3xl rounded-full transition-colors duration-500",
              config.material === "gold" ? "bg-gold/20" : "bg-silver/20"
            )}
          />
          <PendantPreview
            imagePreview={config.generatedPreview || config.imagePreview}
            material={config.material}
            size={config.size}
            formFactor={config.formFactor}
          />
        </div>

        {/* Price tag */}
        <div
          className={cn(
            "px-8 py-4 rounded-2xl border-2 text-center transition-all duration-500",
            config.material === "gold"
              ? "border-gold/40 bg-gold/10"
              : "border-silver/40 bg-silver/10"
          )}
        >
          <p className="text-sm text-muted-foreground mb-1">Стоимость изделия</p>
          <p className="text-3xl font-display text-gradient-gold">
            {totalPrice.toLocaleString("ru-RU")} ₽
          </p>
        </div>
      </div>
    </div>
  );
}
