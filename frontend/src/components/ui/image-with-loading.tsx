import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ImageWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  showSpinner?: boolean;
}

export function ImageWithLoading({
  src,
  alt,
  className,
  containerClassName,
  placeholderClassName,
  showSpinner = true,
}: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative", containerClassName)}>
      {/* Blurred placeholder / loading state */}
      {isLoading && !hasError && (
        <div
          className={cn(
            "absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10",
            placeholderClassName
          )}
        >
          {showSpinner && (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div
          className={cn(
            "absolute inset-0 bg-muted/80 flex items-center justify-center z-10",
            placeholderClassName
          )}
        >
          <span className="text-muted-foreground text-sm">Не удалось загрузить</span>
        </div>
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
