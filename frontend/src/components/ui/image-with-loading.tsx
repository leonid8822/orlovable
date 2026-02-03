import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { optimizeImageUrl, generateSrcSet, ImageSize } from "@/lib/image-optimizer";

interface ImageWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  showSpinner?: boolean;
  size?: ImageSize; // Auto-optimize based on size preset
  disableOptimization?: boolean; // Skip optimization if needed
}

export function ImageWithLoading({
  src,
  alt,
  className,
  containerClassName,
  placeholderClassName,
  showSpinner = true,
  size = 'preview',
  disableOptimization = false,
}: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Optimize image URL if not disabled
  const optimizedSrc = disableOptimization ? src : (optimizeImageUrl(src, size) || src);
  const srcSet = disableOptimization ? undefined : (generateSrcSet(src) || undefined);

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
        src={optimizedSrc}
        srcSet={srcSet}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
        alt={alt}
        loading="lazy"
        decoding="async"
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
