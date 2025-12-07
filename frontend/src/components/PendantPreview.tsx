import { cn } from "@/lib/utils";
import type { Material, Size, FormFactor } from "@/types/pendant";

interface PendantPreviewProps {
  imagePreview: string | null;
  material: Material;
  size: Size;
  formFactor: FormFactor;
  isGenerating?: boolean;
}

const sizeClasses: Record<Size, string> = {
  interior: "w-64 h-64 md:w-80 md:h-80",
  pendant: "w-48 h-48 md:w-56 md:h-56",
  bracelet: "w-32 h-32 md:w-40 md:h-40",
};

export function PendantPreview({
  imagePreview,
  material,
  size,
  formFactor,
  isGenerating = false,
}: PendantPreviewProps) {
  const isRound = formFactor === "round";

  // Color filter for material tint
  const materialFilter = material === "gold" 
    ? "sepia(30%) saturate(150%) hue-rotate(-10deg) brightness(1.1)"
    : "saturate(0%) brightness(1.2) contrast(1.1)";

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={cn(
          "relative transition-all duration-700 animate-float",
          sizeClasses[size]
        )}
      >
        {/* Glow effect */}
        <div
          className={cn(
            "absolute inset-0 blur-2xl transition-all duration-500 scale-110",
            material === "gold" ? "bg-gold/30" : "bg-silver/30"
          )}
          style={{
            borderRadius: isRound ? "50%" : "1rem",
          }}
        />

        {/* Image container - floating without frame */}
        <div
          className={cn(
            "relative w-full h-full overflow-hidden transition-all duration-500",
            isRound ? "rounded-full" : "rounded-2xl"
          )}
          style={{
            boxShadow:
              material === "gold"
                ? "0 0 60px rgba(212, 175, 55, 0.5), 0 20px 40px rgba(0, 0, 0, 0.3)"
                : "0 0 60px rgba(192, 192, 192, 0.4), 0 20px 40px rgba(0, 0, 0, 0.3)",
          }}
        >
          {isGenerating ? (
            <div className="w-full h-full bg-card flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Генерация...</span>
            </div>
          ) : imagePreview ? (
            <img
              src={imagePreview}
              alt="Превью кулона"
              className="w-full h-full object-cover transition-all duration-500"
              style={{ filter: materialFilter }}
            />
          ) : (
            <div className="w-full h-full bg-card flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div
                className={cn(
                  "w-16 h-16 border-2 border-dashed border-border flex items-center justify-center",
                  isRound ? "rounded-full" : "rounded-lg"
                )}
              >
                <span className="text-2xl">✦</span>
              </div>
              <span className="text-xs">Ваш дизайн</span>
            </div>
          )}
        </div>

        {/* Small bail / loop for pendant - subtle */}
        {size !== "interior" && imagePreview && (
          <div
            className={cn(
              "absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-4 rounded-t-full transition-colors duration-500",
              material === "gold"
                ? "bg-gradient-to-b from-gold-light to-gold"
                : "bg-gradient-to-b from-silver-light to-silver"
            )}
            style={{
              boxShadow:
                material === "gold"
                  ? "0 -2px 8px rgba(212, 175, 55, 0.3)"
                  : "0 -2px 8px rgba(192, 192, 192, 0.2)",
            }}
          />
        )}
      </div>

      {/* Material indicator */}
      <div
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
          material === "gold"
            ? "bg-gold/20 text-gold-light border border-gold/30"
            : "bg-silver/20 text-silver-light border border-silver/30"
        )}
      >
        {material === "gold" ? "Золото 585" : "Серебро 925"}
      </div>
    </div>
  );
}
