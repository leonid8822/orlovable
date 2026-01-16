import { Sparkles, Circle, Hexagon, RectangleHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ImageUploader";
import { cn } from "@/lib/utils";
import type { PendantConfig, SizeOption } from "@/types/pendant";
import { SIZE_CONFIG, getSizeConfigWithDefaults } from "@/types/pendant";

interface StepUploadProps {
  config: PendantConfig;
  onConfigChange: (updates: Partial<PendantConfig>) => void;
  onStartGeneration: () => void;
  isDisabled?: boolean;
}

// Size card component
function SizeCard({
  size,
  selected,
  onSelect,
  disabled,
}: {
  size: SizeOption;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const config = SIZE_CONFIG[size];

  const icons: Record<SizeOption, React.ReactNode> = {
    s: <Circle className="w-8 h-8" />,
    m: <RectangleHorizontal className="w-8 h-8" />,
    l: <Hexagon className="w-8 h-8" />,
  };

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300",
        selected
          ? "border-gold bg-gold/10 text-gold-light"
          : "border-border bg-card hover:border-gold/50 text-muted-foreground hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icons[size]}
      <div className="text-center">
        <p className="text-2xl font-display font-bold">{config.label}</p>
        <p className="text-sm">{config.dimensions}</p>
        <p className="text-xs opacity-70">{config.gender}</p>
      </div>
    </button>
  );
}

export function StepUpload({
  config,
  onConfigChange,
  onStartGeneration,
  isDisabled = false,
}: StepUploadProps) {
  const sizeOptions: SizeOption[] = ["s", "m", "l"];

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onConfigChange({
        image: file,
        imagePreview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageClear = () => {
    onConfigChange({
      image: null,
      imagePreview: null,
      generatedPreview: null,
      generatedImages: [],
      selectedVariantIndex: 0,
    });
  };

  const handleSizeSelect = (size: SizeOption) => {
    const sizeDefaults = getSizeConfigWithDefaults(size);
    onConfigChange({
      sizeOption: size,
      ...sizeDefaults,
    });
  };

  const canProceed = config.imagePreview !== null;

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Upload form */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
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
        />

        {/* Comment field */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Комментарий к изображению (опционально)
          </label>
          <Textarea
            placeholder="Опишите, какие элементы взять с рисунка..."
            value={config.comment}
            onChange={(e) => onConfigChange({ comment: e.target.value })}
            className="min-h-[80px] bg-card border-border focus:border-gold resize-none"
            disabled={isDisabled}
          />
        </div>

        {/* Size selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Размер украшения
          </label>
          <div className="grid grid-cols-3 gap-3">
            {sizeOptions.map((size) => (
              <SizeCard
                key={size}
                size={size}
                selected={config.sizeOption === size}
                onSelect={() => handleSizeSelect(size)}
                disabled={isDisabled}
              />
            ))}
          </div>
        </div>

        {/* Generate button */}
        <Button
          variant="gold"
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
                    Размер: {SIZE_CONFIG[config.sizeOption].label} (
                    {SIZE_CONFIG[config.sizeOption].dimensions})
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
