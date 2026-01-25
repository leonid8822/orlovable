import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ImageUploaderProps {
  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onImageClear: () => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function ImageUploader({
  imagePreview,
  onImageSelect,
  onImageClear,
  label = "Загрузите изображение",
  hint = "PNG, JPG до 10MB",
  disabled = false,
  isProcessing = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isProcessing) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onImageSelect(file);
      }
    },
    [onImageSelect, disabled, isProcessing]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || isProcessing) return;
      const file = e.target.files?.[0];
      if (file) {
        onImageSelect(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [onImageSelect, disabled, isProcessing]
  );

  const isDisabled = disabled || isProcessing;

  return (
    <div className={cn("w-full", isDisabled && "opacity-50 pointer-events-none")}>
      {imagePreview ? (
        <div className="relative group">
          <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border border-border bg-card">
            <img
              src={imagePreview}
              alt="Загруженное изображение"
              className="w-full h-full object-contain"
            />
            {!isDisabled && (
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button
                  variant="goldOutline"
                  size="sm"
                  onClick={onImageClear}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Удалить
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative aspect-square max-w-sm mx-auto rounded-2xl border-2 border-dashed",
            "bg-card/50 transition-all duration-200",
            "flex flex-col items-center justify-center gap-4 cursor-pointer group",
            isDragging
              ? "border-gold bg-gold/10 scale-[1.02]"
              : "border-border hover:bg-card hover:border-gold/50",
            isDisabled && "cursor-not-allowed hover:bg-card/50 hover:border-border"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isDisabled}
          />

          {isProcessing ? (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-gold animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">Обработка...</p>
                <p className="text-sm text-muted-foreground mt-1">Подготавливаем изображение</p>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200",
                isDragging ? "bg-gold/30" : "bg-secondary group-hover:bg-gold/20"
              )}>
                <Upload className={cn(
                  "w-7 h-7 transition-colors duration-200",
                  isDragging ? "text-gold" : "text-muted-foreground group-hover:text-gold"
                )} />
              </div>
              <div className="text-center">
                <p className={cn(
                  "font-medium transition-colors duration-200",
                  isDragging ? "text-gold" : "text-foreground"
                )}>
                  {isDragging ? "Отпустите для загрузки" : label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{hint}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                <span>Перетащите или нажмите</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
