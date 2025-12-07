import { useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ImageUploaderProps {
  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onImageClear: () => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function ImageUploader({
  imagePreview,
  onImageSelect,
  onImageClear,
  label = "Загрузите изображение",
  hint = "PNG, JPG до 10MB",
  disabled = false,
}: ImageUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onImageSelect(file);
      }
    },
    [onImageSelect, disabled]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const file = e.target.files?.[0];
      if (file) {
        onImageSelect(file);
      }
    },
    [onImageSelect, disabled]
  );

  return (
    <div className={cn("w-full", disabled && "opacity-50 pointer-events-none")}>
      {imagePreview ? (
        <div className="relative group">
          <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border border-border bg-card">
            <img
              src={imagePreview}
              alt="Загруженное изображение"
              className="w-full h-full object-contain"
            />
            {!disabled && (
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
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "relative aspect-square max-w-sm mx-auto rounded-2xl border-2 border-dashed border-border",
            "bg-card/50 hover:bg-card hover:border-gold/50 transition-all duration-300",
            "flex flex-col items-center justify-center gap-4 cursor-pointer group",
            disabled && "cursor-not-allowed hover:bg-card/50 hover:border-border"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
          />
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-gold/20 transition-colors duration-300">
            <Upload className="w-7 h-7 text-muted-foreground group-hover:text-gold transition-colors duration-300" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">{label}</p>
            <p className="text-sm text-muted-foreground mt-1">{hint}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            <span>Перетащите или нажмите</span>
          </div>
        </div>
      )}
    </div>
  );
}
