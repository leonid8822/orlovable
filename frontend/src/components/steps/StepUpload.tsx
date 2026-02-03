import { useState, useCallback } from "react";
import { Sparkles, Circle, RectangleVertical, Hexagon, ChevronDown, Square, Pentagon, Octagon, Star, Heart, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/ImageUploader";
import { cn } from "@/lib/utils";
import type { PendantConfig, FormFactor } from "@/types/pendant";
import { useFormFactors, FormFactorConfig } from "@/contexts/SettingsContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// Icon mapping from string to component
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  circle: Circle,
  "rectangle-vertical": RectangleVertical,
  hexagon: Hexagon,
  square: Square,
  pentagon: Pentagon,
  octagon: Octagon,
  star: Star,
  heart: Heart,
  diamond: Diamond,
};

function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  return iconMap[iconName.toLowerCase()] || Hexagon;
}

interface StepUploadProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onStartGeneration: () => void;
  isDisabled?: boolean;
}

// Form selection card component
function FormCard({
  formKey,
  config,
  selected,
  onSelect,
  disabled,
}: {
  formKey: string;
  config: FormFactorConfig;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const IconComponent = getIconComponent(config.icon);

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300",
        selected
          ? "border-theme bg-theme/10 text-theme-light"
          : "border-border bg-card hover:border-theme/50 text-muted-foreground hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <IconComponent className="w-8 h-8" />
      <div className="text-center">
        <p className="text-lg font-display font-bold">{config.label}</p>
        <p className="text-xs opacity-70">{config.description}</p>
      </div>
    </button>
  );
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 1200; // Max dimension for resize

/**
 * Process and optionally resize an image file.
 * Properly handles memory by revoking Object URLs.
 */
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        let { width, height } = img;

        // Only resize if image is larger than MAX_IMAGE_SIZE
        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Use JPEG for photos (smaller size), PNG for drawings/transparency
        const isPhoto = file.type === 'image/jpeg' || file.type === 'image/jpg';
        const dataUrl = canvas.toDataURL(isPhoto ? 'image/jpeg' : 'image/png', 0.85);

        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

export function StepUpload({
  config,
  onConfigChange,
  onStartGeneration,
  isDisabled = false,
}: StepUploadProps) {
  const [showComment, setShowComment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const formFactors = useFormFactors();
  const formOptions = Object.keys(formFactors) as FormFactor[];
  const { toast } = useToast();

  const handleImageSelect = useCallback(async (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер файла — 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Неверный формат",
        description: "Загрузите изображение (PNG, JPG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // First, generate preview for immediate display
      const dataUrl = await processImage(file);

      // Set temporary preview immediately
      onConfigChange({
        image: file,
        imagePreview: dataUrl, // Temporary preview
      });

      // Upload to Supabase Storage in background
      const { url: storageUrl, error: uploadError } = await api.uploadImage(file);

      if (uploadError || !storageUrl) {
        console.error('Upload error:', uploadError);
        // Keep using data URL if upload fails (fallback)
        toast({
          title: "Предупреждение",
          description: "Изображение загружено временно. Сохраните заявку как можно скорее.",
          variant: "default",
        });
      } else {
        // Update with permanent URL
        onConfigChange({
          imagePreview: storageUrl,
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось обработать изображение. Попробуйте другой файл.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onConfigChange, toast]);

  const handleImageClear = () => {
    onConfigChange({
      image: null,
      imagePreview: null,
      generatedPreview: null,
      generatedImages: [],
      selectedVariantIndex: 0,
    });
  };

  const handleFormSelect = (formFactor: FormFactor) => {
    onConfigChange({
      formFactor,
    });
  };

  const canProceed = config.imagePreview !== null;

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Upload form */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-theme mb-3">
            Загрузите ваш рисунок
          </h2>
          <p className="text-muted-foreground">
            Сфотографируйте или загрузите изображение, которое станет основой
            вашего украшения
          </p>
        </div>

        {/* Image uploader */}
        <ImageUploader
          imagePreview={config.imagePreview}
          onImageSelect={handleImageSelect}
          onImageClear={handleImageClear}
          label="Загрузите фото или рисунок"
          hint="Подойдут детские рисунки, эскизы, фото"
          disabled={isDisabled}
          isProcessing={isProcessing}
        />

        {/* Form factor selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Форма украшения
          </label>
          <div className={cn(
            "grid gap-3",
            formOptions.length === 2 ? "grid-cols-2" : "grid-cols-3"
          )}>
            {formOptions.map((formKey) => (
              <FormCard
                key={formKey}
                formKey={formKey}
                config={formFactors[formKey]}
                selected={config.formFactor === formKey}
                onSelect={() => handleFormSelect(formKey)}
                disabled={isDisabled}
              />
            ))}
          </div>
        </div>

        {/* Collapsible comment field */}
        <Collapsible open={showComment} onOpenChange={setShowComment}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              disabled={isDisabled}
            >
              <span className="text-sm">
                {config.comment ? "Комментарий добавлен" : "Добавить комментарий (опционально)"}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  showComment && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea
              placeholder="Если на картинке несколько объектов, укажите какой использовать..."
              value={config.comment}
              onChange={(e) => onConfigChange({ comment: e.target.value })}
              className="min-h-[80px] bg-card border-border focus:border-theme resize-none"
              disabled={isDisabled}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Gallery consent checkbox */}
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <Checkbox
            id="gallery-consent"
            checked={config.allowGalleryUse}
            onCheckedChange={(checked) => onConfigChange({ allowGalleryUse: !!checked })}
            disabled={isDisabled}
            className="mt-0.5"
          />
          <label
            htmlFor="gallery-consent"
            className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
          >
            Я согласен, что мои изображения и результаты генерации могут быть использованы в галерее примеров на сайте
          </label>
        </div>

        {/* Generate button */}
        <Button
          variant="theme"
          size="xl"
          className="w-full"
          onClick={onStartGeneration}
          disabled={!canProceed || isDisabled}
        >
          <Sparkles className="w-5 h-5" />
          Создать украшение
        </Button>
      </div>

      {/* Right: Preview */}
      <div
        className="flex items-center justify-center animate-scale-in"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 blur-3xl bg-gold/10 rounded-full" />
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gold/30 bg-card">
            {config.imagePreview ? (
              <div className="w-full h-full flex items-center justify-center bg-card/50">
                <div className="text-center p-6">
                  <img
                    src={config.imagePreview}
                    alt="Исходное изображение"
                    className="max-w-full max-h-64 object-contain rounded-xl mx-auto mb-4"
                  />
                  <p className="text-sm text-muted-foreground">
                    Загруженное изображение
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Форма: {formFactors[config.formFactor]?.label || config.formFactor}
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
                    Здесь появится ваше украшение
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
