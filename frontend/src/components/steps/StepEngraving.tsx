import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Type, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendantConfig } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";

interface StepEngravingProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

// Font options for engraving
const FONT_OPTIONS = [
  { id: "classic", label: "Классический", fontFamily: "Cormorant Garamond, serif" },
  { id: "modern", label: "Современный", fontFamily: "Inter, sans-serif" },
  { id: "script", label: "Каллиграфия", fontFamily: "cursive" },
];

export function StepEngraving({
  config,
  onConfigChange,
  onNext,
  onBack,
  onSkip,
}: StepEngravingProps) {
  const { config: themeConfig } = useAppTheme();
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].id);
  const [showBack, setShowBack] = useState(true);

  const selectedFontConfig = FONT_OPTIONS.find((f) => f.id === selectedFont) || FONT_OPTIONS[0];

  // Max characters based on pendant size
  const getMaxChars = () => {
    const sizeMap: Record<string, number> = {
      s: 15,
      m: 25,
      l: 40,
    };
    return sizeMap[config.sizeOption] || 25;
  };

  const maxChars = getMaxChars();
  const charsRemaining = maxChars - (config.backEngraving?.length || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4"
          style={{
            backgroundColor: `${themeConfig.accentColor}10`,
            borderColor: `${themeConfig.accentColor}30`,
          }}
        >
          <Type className="w-4 h-4" style={{ color: themeConfig.accentColor }} />
          <span className="text-sm" style={{ color: themeConfig.accentColor }}>
            Гравировка
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display mb-2">
          Надпись на <span style={{ color: themeConfig.accentColor }}>обратной стороне</span>
        </h2>
        <p className="text-muted-foreground">
          Добавьте персональную гравировку — имя, дату или пожелание
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {showBack ? "Обратная сторона" : "Лицевая сторона"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBack(!showBack)}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Перевернуть
            </Button>
          </div>

          <div
            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 border-2"
            style={{ borderColor: `${themeConfig.accentColor}30` }}
          >
            {!showBack && config.generatedPreview ? (
              // Front side - generated preview
              <img
                src={config.generatedPreview}
                alt="Лицевая сторона"
                className="w-full h-full object-contain"
              />
            ) : (
              // Back side - engraving preview
              <div className="w-full h-full flex items-center justify-center p-8">
                <div
                  className="text-center break-words max-w-full"
                  style={{
                    fontFamily: selectedFontConfig.fontFamily,
                    fontSize: config.backEngraving?.length > 20 ? "1rem" : "1.5rem",
                    color: "rgba(0,0,0,0.6)",
                    textShadow: "0 1px 0 rgba(255,255,255,0.5)",
                    lineHeight: 1.4,
                  }}
                >
                  {config.backEngraving || (
                    <span className="text-muted-foreground/50 italic text-sm">
                      Ваша надпись появится здесь
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Silver texture overlay for back */}
            {showBack && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                }}
              />
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Гравировка выполняется лазером на серебре
          </p>
        </div>

        {/* Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Текст гравировки</label>
            <Textarea
              placeholder="Например: С любовью, мама 2024"
              value={config.backEngraving || ""}
              onChange={(e) => {
                const text = e.target.value.slice(0, maxChars);
                onConfigChange({
                  backEngraving: text,
                  hasBackEngraving: text.length > 0,
                });
              }}
              className="min-h-[100px] resize-none"
              maxLength={maxChars}
            />
            <p
              className={cn(
                "text-xs mt-1 text-right",
                charsRemaining < 5 ? "text-orange-500" : "text-muted-foreground"
              )}
            >
              Осталось символов: {charsRemaining}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Стиль шрифта</label>
            <div className="grid grid-cols-3 gap-3">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.id}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center",
                    selectedFont === font.id
                      ? "border-current shadow-md"
                      : "border-border hover:border-muted-foreground"
                  )}
                  style={
                    selectedFont === font.id
                      ? { borderColor: themeConfig.accentColor }
                      : undefined
                  }
                  onClick={() => setSelectedFont(font.id)}
                >
                  <span
                    className="block text-lg mb-1"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    Aa
                  </span>
                  <span className="text-xs text-muted-foreground">{font.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Рекомендации:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Короткие надписи смотрятся лучше</li>
              <li>Используйте простые буквы без сложных символов</li>
              <li>Кириллица и латиница поддерживаются</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Пропустить
          </Button>
          <Button
            onClick={onNext}
            style={{ backgroundColor: themeConfig.accentColor }}
          >
            Далее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
