import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PendantConfig } from "@/types/pendant";
import { SIZE_CONFIG } from "@/types/pendant";

const funFacts = [
  "Первые ювелирные украшения появились более 100 000 лет назад...",
  "Серебро обладает антибактериальными свойствами и использовалось в медицине веками",
  "Самый большой серебряный кулон весил более 5 кг и был создан в Индии",
  "3D-печать ювелирных изделий позволяет создавать формы, невозможные при традиционных методах",
  "Техника литья по выплавляемым моделям используется уже более 5000 лет",
  "Каждое украшение проходит до 20 этапов обработки прежде чем попасть к владельцу",
  "Серебро 925 пробы содержит 92.5% чистого серебра и 7.5% меди для прочности",
  "Современные ювелиры используют лазеры для гравировки с точностью до 0.01мм",
];

interface StepGeneratingProps {
  config: PendantConfig;
  applicationId: string;
  onGenerationComplete: (images: string[]) => void;
  onGenerationError: (error: string) => void;
}

export function StepGenerating({
  config,
  applicationId,
  onGenerationComplete,
  onGenerationError,
}: StepGeneratingProps) {
  const [progress, setProgress] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const estimatedTime = 60; // seconds

  // Start generation on mount
  useEffect(() => {
    if (isGenerating) return;

    const runGeneration = async () => {
      setIsGenerating(true);

      try {
        console.log("Starting pendant generation...");

        // Update status to generating
        await api.updateApplication(applicationId, { status: "generating" });

        const { data, error } = await api.generate({
          imageBase64: config.imagePreview,
          prompt: config.comment,
          formFactor: config.formFactor,
          size: config.size,
          material: config.material,
          applicationId: applicationId,
        });

        if (error) {
          console.error("Generation error:", error);
          throw new Error(error.toString());
        }

        if (!data.success) {
          throw new Error(data.error || "Generation failed");
        }

        console.log("Generation successful:", data.images?.length, "images");

        // Update application with generated preview
        if (data.images && data.images.length > 0) {
          await api.updateApplication(applicationId, {
            generated_preview: data.images[0],
            status: "generated",
          });
        }

        setProgress(100);

        toast({
          title: "Готово!",
          description: `Сгенерировано ${data.images?.length || 1} вариантов`,
        });

        // Small delay for UX before transitioning
        setTimeout(() => {
          onGenerationComplete(data.images || []);
        }, 500);
      } catch (error) {
        console.error("Generation error:", error);

        // Update status back to draft on error
        await api.updateApplication(applicationId, { status: "draft" });

        toast({
          title: "Ошибка генерации",
          description:
            error instanceof Error ? error.message : "Попробуйте еще раз",
          variant: "destructive",
        });

        onGenerationError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    };

    runGeneration();
  }, [applicationId]);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Non-linear progress that slows down as it approaches 95%
        const increment = Math.max(0.5, (95 - prev) / 50);
        return Math.min(prev + increment, 95);
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  // Fun facts rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const sizeConfig = SIZE_CONFIG[config.sizeOption];

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-fade-in">
      {/* Uploaded image preview */}
      {config.imagePreview && (
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-gold/20 rounded-full" />
          <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-gold/30 bg-card">
            <img
              src={config.imagePreview}
              alt="Ваше изображение"
              className="w-full h-full object-cover opacity-60"
            />
            {/* Overlay with pulse animation */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        </div>
      )}

      {/* Loading animation */}
      <div className="text-center space-y-6">
        <div className="relative">
          <Sparkles className="w-16 h-16 text-gold animate-pulse mx-auto" />
          <div className="absolute inset-0 blur-xl bg-gold/30 rounded-full animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-display text-gradient-gold">
            Создаём варианты вашего украшения...
          </h2>
          <p className="text-sm text-muted-foreground">
            Размер {sizeConfig.label} ({sizeConfig.dimensions}) &bull;{" "}
            {sizeConfig.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 md:w-80 mx-auto space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% завершено
          </p>
        </div>
      </div>

      {/* Fun facts */}
      <div className="max-w-md p-4 bg-card/50 rounded-xl border border-border/50">
        <p className="text-sm text-gold-light font-medium mb-2">А вы знали?</p>
        <p
          className="text-sm text-muted-foreground animate-fade-in"
          key={currentFactIndex}
        >
          {funFacts[currentFactIndex]}
        </p>
      </div>
    </div>
  );
}
