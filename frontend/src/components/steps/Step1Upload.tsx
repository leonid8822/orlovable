import { useState, useEffect } from "react";
import { Sparkles, Circle, Hexagon, RefreshCw, Check, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ImageUploader } from "@/components/ImageUploader";
import { GenerationHistory } from "@/components/GenerationHistory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { PendantConfig, FormFactor } from "@/types/pendant";
import { formFactorLabels } from "@/types/pendant";

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

interface Step1UploadProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onNext: () => void;
  applicationId?: string | null;
  onGenerationStart?: (applicationId: string) => void;
  autoStartGeneration?: boolean;
  onGenerationStarted?: () => void;
  initialStatus?: string;
  onStatusChange?: (status: string) => void;
}

export function Step1Upload({ config, onConfigChange, onNext, applicationId, onGenerationStart, autoStartGeneration, onGenerationStarted, initialStatus, onStatusChange }: Step1UploadProps) {
  const [isGenerating, setIsGenerating] = useState(initialStatus === 'generating');
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [usedPrompt, setUsedPrompt] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [numImages, setNumImages] = useState(4);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const { toast } = useToast();

  // Fetch num_images setting
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await api.getSettings();
      if (data && data.num_images) {
        setNumImages(data.num_images);
      }
    };
    fetchSettings();
  }, []);

  const estimatedTime = 60; // More time for 4 images with seedream

  // Progress and time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setElapsedTime(0);
      setProgress(0);
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 0.5;
          const newProgress = Math.min(95, (newTime / estimatedTime) * 100 * (1 - newTime / (estimatedTime * 3)));
          setProgress(Math.max(progress, newProgress));
          return newTime;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Cycle through fun facts
  useEffect(() => {
    let factInterval: NodeJS.Timeout;
    if (isGenerating) {
      setCurrentFactIndex(0);
      factInterval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
      }, 5000);
    }
    return () => clearInterval(factInterval);
  }, [isGenerating]);

  // Auto-start generation when redirected from Index page
  useEffect(() => {
    if (autoStartGeneration && applicationId && !isGenerating && !generatedImages.length) {
      onGenerationStarted?.();
      runGeneration();
    }
  }, [autoStartGeneration, applicationId]);

  // Poll for status when page is reloaded during generation
  useEffect(() => {
    if (!isGenerating || !applicationId || autoStartGeneration) return;

    // This means we loaded the page with status='generating' (page refresh)
    // Poll the database to check when generation completes
    const pollInterval = setInterval(async () => {
      const { data } = await api.getApplication(applicationId);

      if (data) {
        if (data.status === 'generated' && data.generated_preview) {
          // Generation completed
          setIsGenerating(false);
          setProgress(100);
          setGeneratedImages([data.generated_preview]);
          onConfigChange({ generatedPreview: data.generated_preview });
          onStatusChange?.('generated');
          toast({
            title: "Готово!",
            description: "Генерация завершена",
          });
          clearInterval(pollInterval);
        } else if (data.status === 'draft') {
          // Generation failed
          setIsGenerating(false);
          onStatusChange?.('draft');
          clearInterval(pollInterval);
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isGenerating, applicationId, autoStartGeneration]);

  const formatTime = (seconds: number) => {
    const remaining = Math.max(0, Math.ceil(estimatedTime - seconds));
    if (remaining === 0) return "почти готово...";
    return `~${remaining} сек`;
  };

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onConfigChange({
        image: file,
        imagePreview: e.target?.result as string,
      });
      // Reset generated images when new image is uploaded
      setGeneratedImages([]);
      setSelectedImageIndex(0);
    };
    reader.readAsDataURL(file);
  };

  // Core generation function - requires applicationId
  const runGeneration = async () => {
    if (!applicationId) return;

    setIsGenerating(true);
    setGeneratedImages([]);
    onStatusChange?.('generating');

    try {
      console.log('Starting pendant generation...');

      // Update status to generating
      await api.updateApplication(applicationId, { status: 'generating' });

      const { data, error } = await api.generate({
        imageBase64: config.imagePreview,
        prompt: config.comment,
        formFactor: config.formFactor,
        size: config.size,
        material: config.material,
        applicationId: applicationId,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.toString());
      }

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      console.log('Generation successful:', data.images?.length, 'images');

      setGeneratedImages(data.images || []);
      setSelectedImageIndex(0);
      setUsedPrompt(data.prompt || '');

      // Update with first generated image
      if (data.images && data.images.length > 0) {
        onConfigChange({
          generatedPreview: data.images[0],
        });
      }

      setProgress(100);
      onStatusChange?.('generated');

      // Update application with generated preview (Server will do this typically, but good to be same)
      await api.updateApplication(applicationId, {
        generated_preview: data.images[0],
        status: 'generated',
      });

      toast({
        title: "Успешно!",
        description: `Сгенерировано ${data.images?.length || 1} вариантов`,
      });

    } catch (error) {
      console.error('Generation error:', error);
      onStatusChange?.('draft');

      // Update status to error
      await api.updateApplication(applicationId, { status: 'draft' });

      toast({
        title: "Ошибка генерации",
        description: error instanceof Error ? error.message : "Попробуйте еще раз",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!config.imagePreview && !config.comment?.trim()) return;

    // If no applicationId, create application and redirect (don't generate yet)
    if (!applicationId) {
      try {
        const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
        localStorage.setItem('sessionId', sessionId);

        // Removed Supabase auth check for now, can be re-added if we implement auth
        const userId = null;

        const { data: newApp, error: appError } = await api.createApplication({
          session_id: sessionId,
          user_id: userId,
          form_factor: config.formFactor,
          material: config.material,
          size: config.size,
          input_image_url: config.imagePreview,
          user_comment: config.comment,
        });

        if (appError) {
          console.error('Error creating application:', appError);
          toast({
            title: "Ошибка",
            description: "Не удалось создать заявку",
            variant: "destructive",
          });
          return;
        }

        // Redirect to application page - generation will start there
        onGenerationStart?.(newApp.id);
        return;
      } catch (error) {
        console.error('Error:', error);
        return;
      }
    }

    // If we have applicationId, run the actual generation
    await runGeneration();
  };

  const handleSelectVariant = (index: number) => {
    setSelectedImageIndex(index);
    onConfigChange({
      generatedPreview: generatedImages[index],
    });
  };

  const handleConfirmSelection = () => {
    if (generatedImages[selectedImageIndex]) {
      onConfigChange({
        generatedPreview: generatedImages[selectedImageIndex],
      });
      onNext();
    }
  };

  const handleLoadFromHistory = (images: string[], formFactor: string, size: string) => {
    setGeneratedImages(images);
    setSelectedImageIndex(0);
    onConfigChange({
      formFactor: formFactor as FormFactor,
      size: size as any,
      generatedPreview: images[0],
    });
  };

  const formFactors: { value: FormFactor; icon: React.ReactNode }[] = [
    { value: "round", icon: <Circle className="w-5 h-5" /> },
    { value: "contour", icon: <Hexagon className="w-5 h-5" /> },
  ];

  const hasGeneratedImages = generatedImages.length > 0;

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Upload section */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
            {hasGeneratedImages ? "Выберите вариант" : "Загрузите ваш рисунок"}
          </h2>
          <p className="text-muted-foreground">
            {hasGeneratedImages
              ? "Выберите понравившийся вариант или сгенерируйте новые"
              : "Сфотографируйте или загрузите изображение, которое станет основой вашего украшения"}
          </p>
        </div>

        {!hasGeneratedImages && (
          <div className={cn("space-y-6", isGenerating && "opacity-50 pointer-events-none")}>
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-gold-light">
                <Lock className="w-4 h-4" />
                <span>Поля заблокированы на время генерации</span>
              </div>
            )}
            <ImageUploader
              imagePreview={config.imagePreview}
              onImageSelect={handleImageSelect}
              onImageClear={() => onConfigChange({ image: null, imagePreview: null, generatedPreview: null })}
              label="Загрузите фото или рисунок"
              hint="Подойдут детские рисунки, эскизы, фото"
              disabled={isGenerating}
            />

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Комментарий к изображению
              </label>
              <Textarea
                placeholder="Опишите, какие элементы взять с рисунка..."
                value={config.comment}
                onChange={(e) => onConfigChange({ comment: e.target.value })}
                className="min-h-[100px] bg-card border-border focus:border-gold resize-none"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Форм-фактор
              </label>
              <div className="flex gap-3">
                {formFactors.map(({ value, icon }) => (
                  <button
                    key={value}
                    onClick={() => !isGenerating && onConfigChange({ formFactor: value })}
                    disabled={isGenerating}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                      config.formFactor === value
                        ? "border-gold bg-gold/10 text-gold-light"
                        : "border-border bg-card hover:border-gold/50 text-muted-foreground hover:text-foreground",
                      isGenerating && "cursor-not-allowed"
                    )}
                  >
                    {icon}
                    <span className="font-medium">{formFactorLabels[value]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generation History */}
            <GenerationHistory onSelectGeneration={handleLoadFromHistory} />
          </div>
        )}

        {/* Generated variants grid */}
        {hasGeneratedImages && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {generatedImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectVariant(index)}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300",
                    selectedImageIndex === index
                      ? "border-gold ring-2 ring-gold/30 scale-[1.02]"
                      : "border-border hover:border-gold/50"
                  )}
                >
                  <img
                    src={imageUrl}
                    alt={`Вариант ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedImageIndex === index && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-background" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    Вариант {index + 1}
                  </div>
                </button>
              ))}
            </div>

            {/* Show prompt toggle */}
            {usedPrompt && (
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="w-full flex items-center justify-between p-3 text-sm text-muted-foreground hover:bg-card/50 transition-colors"
                >
                  <span>Использованный промпт</span>
                  {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showPrompt && (
                  <div className="p-3 pt-0 text-xs text-muted-foreground bg-card/30 whitespace-pre-wrap">
                    {usedPrompt}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                  variant="goldOutline"
                  className="flex-1"
                  onClick={() => setShowRegenerateConfirm(true)}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                  Сгенерировать заново
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={handleConfirmSelection}
                >
                  <Check className="w-4 h-4" />
                  Выбрать этот вариант
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setGeneratedImages([]);
                  setSelectedImageIndex(0);
                  setUsedPrompt('');
                }}
              >
                ← Изменить исходное изображение и комментарий
              </Button>
            </div>

            {/* Regenerate confirmation dialog */}
            <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Сгенерировать заново?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Текущие варианты будут удалены и заменены новыми. Это действие нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    setShowRegenerateConfirm(false);
                    handleGenerate();
                  }}>
                    Да, сгенерировать
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {isGenerating ? (
          <div className="space-y-4 p-6 rounded-xl border border-gold/30 bg-gold/5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gold-light font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Генерация вариантов кулона...
              </span>
              <span className="text-muted-foreground">{formatTime(elapsedTime)}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mb-3">
              {Math.round(progress)}% завершено • генерируем {numImages} {numImages === 1 ? 'вариант' : numImages < 5 ? 'варианта' : 'вариантов'}
            </p>
            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm text-gold-light font-medium mb-1">А вы знали?</p>
              <p className="text-sm text-muted-foreground animate-fade-in" key={currentFactIndex}>
                {funFacts[currentFactIndex]}
              </p>
            </div>
          </div>
        ) : !hasGeneratedImages && (
          <Button
            variant="gold"
            size="xl"
            className="w-full"
            onClick={handleGenerate}
            disabled={!config.imagePreview && !config.comment?.trim()}
          >
            <Sparkles className="w-5 h-5" />
            Сгенерировать варианты кулона
          </Button>
        )}
      </div>

      {/* Right: Large Preview */}
      <div className="flex items-center justify-center animate-scale-in" style={{ animationDelay: "0.2s" }}>
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 blur-3xl bg-gold/10 rounded-full" />
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gold/30 bg-card">
            {generatedImages[selectedImageIndex] ? (
              <img
                src={generatedImages[selectedImageIndex]}
                alt="Выбранный вариант"
                className="w-full h-full object-cover"
              />
            ) : config.imagePreview ? (
              <div className="w-full h-full flex items-center justify-center bg-card/50">
                <div className="text-center p-6">
                  <img
                    src={config.imagePreview}
                    alt="Исходное изображение"
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 opacity-50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Загруженное изображение
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Нажмите "Сгенерировать" чтобы создать кулон
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-gold/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Здесь появится ваш кулон
                  </p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-gold animate-pulse mx-auto mb-4" />
                  <p className="text-gold-light font-medium">Генерация...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
