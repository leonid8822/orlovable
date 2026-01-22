import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import type { ProductConfig } from "@/types/product";
import { api } from "@/lib/api";

const funFacts = [
  "Детские рисунки хранят особую магию — они созданы с чистым сердцем и безграничной фантазией",
  "Каждое украшение из детского рисунка становится уникальной семейной реликвией",
  "Серебро 925 пробы — идеальный материал для детских украшений: гипоаллергенно и долговечно",
  "3D-печать позволяет точно воспроизвести даже самые мелкие детали детского рисунка",
  "Украшения из детских рисунков часто становятся самыми ценными подарками для родителей",
  "Каждое изделие проходит до 20 этапов обработки, чтобы стать идеальным",
  "Детское творчество вдохновляет ювелиров создавать необычные и трогательные формы",
  "Украшения из рисунков детей — это способ сохранить детство навсегда",
  "Каждый кулон уникален, как отпечаток пальца — даже из одного рисунка получаются разные варианты",
  "Ювелирное искусство и детское творчество создают магию, которую невозможно повторить",
];

interface Step2GenerationProps {
  config: ProductConfig;
  onConfigChange: (updates: Partial<ProductConfig>) => void;
  onNext: () => void;
  onBack: () => void;
  applicationId: string;
}

export function Step2Generation({ config, onConfigChange, onNext, onBack, applicationId }: Step2GenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Rotate fun facts every 5 seconds
  useEffect(() => {
    if (isGenerating) {
      const factInterval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
      }, 5000);
      return () => clearInterval(factInterval);
    }
  }, [isGenerating]);

  // Start generation on mount
  useEffect(() => {
    if (applicationId && !config.generatedVariants?.length && !isGenerating) {
      startGeneration();
    }
  }, [applicationId]);

  // Save generation status to application
  useEffect(() => {
    if (applicationId && isGenerating) {
      api.updateApplication(applicationId, {
        status: 'generating',
      });
    }
  }, [isGenerating, applicationId]);

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);
    setElapsedTime(0);

    try {
      const { data, error } = await api.generate({
        applicationId,
        imageBase64: config.imagePreview,
        prompt: config.comment,
        formFactor: config.formFactor,
        material: config.material,
        size: config.size,
        sessionId: localStorage.getItem('sessionId') || undefined,
      });

      if (error || !data?.images) {
        throw new Error(error || 'Не удалось сгенерировать варианты');
      }

      // Save generated variants (should be 2 images)
      onConfigChange({ generatedVariants: data.images });
      
      // Update application status
      await api.updateApplication(applicationId, {
        status: 'variants_ready',
        generated_variants: data.images,
        current_step: 3,
      });

      setIsGenerating(false);
      onNext(); // Auto-advance to step 3
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
    }
  };

  // Simulate progress
  useEffect(() => {
    if (isGenerating) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(progressInterval);
    }
  }, [isGenerating]);

  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Sparkles className="w-16 h-16 text-gradient-gold animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display">Создаем ваши варианты...</h2>
          </div>
          <p className="text-muted-foreground">
            Это займет около 1-2 минут. Пока мы работаем, узнайте интересные факты!
          </p>
        </div>
        
        {onBack && (
          <div className="flex justify-center">
            <Button onClick={onBack} variant="outline" disabled>
              Назад
            </Button>
          </div>
        )}

        <Card className="p-6 bg-gradient-card">
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-muted-foreground mb-6">
            Прошло времени: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </p>

          <div className="min-h-[120px] flex items-center justify-center">
            <div className="space-y-4 animate-fade-in">
              <p className="text-lg font-medium text-foreground">
                {funFacts[currentFactIndex]}
              </p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Генерация вариантов...</span>
        </div>
      </div>
    );
  }

  // Show input image and prompt if available (even if generation hasn't started)
  if (!isGenerating && (!config.generatedVariants || config.generatedVariants.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display">Генерация вариантов</h2>
          </div>
          <p className="text-muted-foreground">Мы создадим для вас уникальные варианты украшения</p>
        </div>

        {/* Show input image and prompt */}
        {(config.imagePreview || config.comment) && (
          <div className="grid md:grid-cols-2 gap-6">
            {config.imagePreview && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Загруженное изображение</h3>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={config.imagePreview}
                    alt="Загруженное изображение"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            {config.comment && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Ваш промпт</h3>
                <div className="p-4 bg-muted rounded-lg min-h-[200px]">
                  <p className="text-foreground whitespace-pre-wrap">{config.comment}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Назад
            </Button>
          )}
          <Button 
            onClick={startGeneration} 
            variant="default" 
            disabled={isGenerating}
            className="bg-gold hover:bg-gold-dark text-white"
          >
            {isGenerating ? 'Генерируем...' : 'Начать генерацию'}
          </Button>
        </div>
      </div>
    );
  }

  // If variants are ready, show them
  if (config.generatedVariants && config.generatedVariants.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display">Варианты готовы!</h2>
          </div>
          <p className="text-muted-foreground">Выберите один из предложенных вариантов</p>
        </div>
        
        {/* Show generated variants preview */}
        <div className="grid md:grid-cols-2 gap-4">
          {config.generatedVariants.map((variantUrl, index) => (
            <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
              <img
                src={variantUrl}
                alt={`Вариант ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Назад
            </Button>
          )}
          <Button onClick={() => startGeneration()} variant="outline" disabled={isGenerating}>
            {isGenerating ? 'Генерируем...' : 'Перегенерировать'}
          </Button>
          <Button onClick={onNext} variant="default" className="bg-gold hover:bg-gold-dark text-white">
            Продолжить к выбору
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

