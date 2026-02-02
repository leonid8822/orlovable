import { Gem, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GemsPromoBlockProps {
  accentColor?: string;
  accentColorLight?: string;
}

export function GemsPromoBlock({
  accentColor = "hsl(43, 74%, 45%)",
  accentColorLight = "hsl(43, 74%, 55%)",
}: GemsPromoBlockProps) {
  const handleConsultation = () => {
    window.open("https://t.me/olai_support?text=Хочу%20записаться%20на%20консультацию%20по%20камням", "_blank");
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-card border border-border/50 relative overflow-hidden">
          {/* Background decoration */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"
            style={{ background: accentColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-10"
            style={{ background: accentColor }}
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{
                  background: `${accentColor}20`,
                  borderWidth: "1px",
                  borderColor: `${accentColor}30`,
                }}
              >
                <Gem className="w-4 h-4" style={{ color: accentColorLight }} />
                <span className="text-sm" style={{ color: accentColorLight }}>
                  Усиление украшения
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Добавьте <span style={{ color: accentColorLight }}>камни</span> в изделие
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Натуральные камни усиливают энергию украшения и подчёркивают его уникальность.
                Подберём камни под вашу задачу, характер или астрологию.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="text-center p-6 rounded-2xl bg-background/50 border border-border/30">
                <div
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: `${accentColor}15` }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <h3 className="font-display mb-2">Ваша сила</h3>
                <p className="text-sm text-muted-foreground">
                  Камни, которые резонируют с вашей энергией и целями
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-background/50 border border-border/30">
                <div
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: `${accentColor}15` }}
                >
                  <Gem className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <h3 className="font-display mb-2">Натуральные камни</h3>
                <p className="text-sm text-muted-foreground">
                  Только природные минералы с уникальной структурой
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-background/50 border border-border/30">
                <div
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: `${accentColor}15` }}
                >
                  <MessageCircle className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <h3 className="font-display mb-2">Консультация</h3>
                <p className="text-sm text-muted-foreground">
                  Поговорим про вас и подберём идеальные камни
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                Хотите подобрать камни под себя? Запишитесь на консультацию —
                поговорим про вас, вашу силу и подберём камни.
              </p>
              <Button
                size="lg"
                onClick={handleConsultation}
                style={{ background: accentColor }}
                className="text-primary-foreground hover:opacity-90"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Записаться на консультацию
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
