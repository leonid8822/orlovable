import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ProductConfig } from "@/types/product";
import { api } from "@/lib/api";

interface Step6VisualizationProps {
  config: ProductConfig;
  onConfigChange: (updates: Partial<ProductConfig>) => void;
  onNext: () => void;
  onBack?: () => void;
  applicationId: string;
}

export function Step6Visualization({ config, onConfigChange, onNext, onBack, applicationId }: Step6VisualizationProps) {
  const [generatingVisualization, setGeneratingVisualization] = useState(false);

  // 3D generation is now started automatically after variant selection in Step3
  // We only show visualizations here

  // Start visualization generation
  useEffect(() => {
    if (config.selectedVariantUrl && !config.visualizationImages) {
      generateVisualization();
    }
  }, [config.selectedVariantUrl]);

  const generateVisualization = async () => {
    if (!config.selectedVariantUrl || !config.size || !config.material) return;

    setGeneratingVisualization(true);
    try {
      const { data, error } = await api.generateVisualization({
        pendant_image_url: config.selectedVariantUrl,
        size: config.size,
        material: config.material,
      });

      if (error || !data?.visualizations) {
        throw new Error(error || 'Не удалось сгенерировать визуализации');
      }

      // Сохраняем только визуализацию на шее
      const visualizationImages = {
        neck: data.visualizations.neck || config.selectedVariantUrl,
      };

      onConfigChange({ visualizationImages });

      await api.updateApplication(applicationId, {
        visualization_images: visualizationImages,
      });
    } catch (error) {
      console.error('Visualization generation error:', error);
      // Fallback to original image if generation fails
      const visualizationImages = {
        neck: config.selectedVariantUrl,
      };
      onConfigChange({ visualizationImages });
    } finally {
      setGeneratingVisualization(false);
    }
  };

  // Всегда показываем визуализацию на шее
  const visualizationUrl = config.visualizationImages?.neck || null;
  const visualizationLabel = 'На шее';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display">Визуализация вашего украшения</h2>
        </div>
        <p className="text-muted-foreground">Посмотрите, как будет выглядеть ваше украшение</p>
      </div>

      <div className="grid md:grid-cols-1 gap-6 max-w-2xl mx-auto">
        {/* Main Visualization */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">{visualizationLabel}</h3>
          {generatingVisualization ? (
            <div className="aspect-square flex items-center justify-center bg-muted rounded">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : visualizationUrl ? (
            <div className="aspect-square bg-muted rounded overflow-hidden">
              <img
                src={visualizationUrl}
                alt={visualizationLabel}
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
        </Card>
      </div>

      <div className="flex justify-between">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Назад
          </Button>
        )}
        <Button onClick={onNext} variant="gold" disabled={!visualizationUrl} className={onBack ? "ml-auto" : ""}>
          Продолжить к редактору камней
        </Button>
      </div>
    </div>
  );
}
