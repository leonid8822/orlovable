import { FC, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Material, SizeOption as PendantSizeOption, FormFactor } from "@/types/pendant";
import { getSizeConfigByMaterial } from "@/types/pendant";
import { useVisualization } from "@/contexts/SettingsContext";

type SizeOption = "s" | "m" | "l";

interface PendantOnNeckProps {
  pendantImage: string | null;
  selectedSize: SizeOption;
  onSizeChange: (size: SizeOption) => void;
  accentColor?: string;
  material?: Material;
  formFactor?: FormFactor;
  className?: string;
}

export const PendantOnNeck: FC<PendantOnNeckProps> = ({
  pendantImage,
  selectedSize,
  onSizeChange,
  accentColor,
  material = "silver",
  formFactor = "round",
  className = "",
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const visualization = useVisualization();
  const sizeConfig = getSizeConfigByMaterial(material);
  const currentSize = sizeConfig[selectedSize];

  // Determine which neck SVG and attachment point to use based on form factor
  const isMale = formFactor === "oval";
  const neckSvg = isMale ? "/man-neck-2.svg" : "/woman-neck.svg";
  const attachPoint = isMale ? visualization.male : visualization.female;

  // Calculate pendant size based on real mm dimensions and image width
  // imageWidthMm is how many mm the preview image represents
  const pendantSizeMm = currentSize.dimensionsMm;
  const pendantSizePercent = (pendantSizeMm / visualization.imageWidthMm) * 100;

  // Position pendant at attachment point (in percentage)
  const pendantX = attachPoint.attachX * 100;
  const pendantY = attachPoint.attachY * 100;

  // Trigger animation on size change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [selectedSize]);

  // Chain color based on material
  const chainColor = material === "gold"
    ? "hsl(43, 74%, 65%)" // Gold color
    : "hsl(0, 0%, 75%)";   // Silver color

  // Pendant tint based on material (applied as CSS filter)
  const pendantFilter = material === "gold"
    ? "sepia(0.5) saturate(1.5) brightness(1.1) hue-rotate(-10deg)"
    : "none";

  // Calculate zoom transform origin to center on pendant
  const zoomScale = 2.2;
  const zoomOriginX = pendantX;
  const zoomOriginY = pendantY;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Preview container */}
      <div
        className="relative w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: "linear-gradient(180deg, hsl(0, 0%, 100%) 0%, hsl(40, 20%, 97%) 100%)",
        }}
        onClick={() => setIsZoomed(!isZoomed)}
      >
        {/* Zoomable content wrapper */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: isZoomed ? `scale(${zoomScale})` : "scale(1)",
            transformOrigin: `${zoomOriginX}% ${zoomOriginY}%`,
          }}
        >
          {/* Neck silhouette from SVG file */}
          <img
            src={neckSvg}
            alt="Neck silhouette"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              opacity: 0.3,
              filter: "sepia(0.3) brightness(0.8)",
            }}
          />

          {/* Pendant - positioned at attachment point */}
          {pendantImage && (
            <div
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out",
                isAnimating && "scale-105"
              )}
              style={{
                left: `${pendantX}%`,
                top: `${pendantY}%`,
                width: `${pendantSizePercent}%`,
              }}
            >
              <img
                src={pendantImage}
                alt="Pendant preview"
                className="w-full h-full object-contain"
                style={{
                  filter: pendantFilter,
                  mixBlendMode: "multiply", // Makes black background transparent on light bg
                }}
              />
            </div>
          )}

          {/* Placeholder if no image */}
          {!pendantImage && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out flex items-center justify-center rounded-xl"
              style={{
                left: `${pendantX}%`,
                top: `${pendantY}%`,
                width: `${pendantSizePercent}%`,
                aspectRatio: "1",
                background: `linear-gradient(135deg, ${chainColor}40 0%, ${chainColor}20 100%)`,
                border: `2px dashed ${chainColor}60`,
              }}
            >
              <span className="text-xs opacity-50">Превью</span>
            </div>
          )}
        </div>

        {/* Size indicator badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-sm font-medium z-10"
          style={{
            background: `${chainColor}20`,
            color: chainColor,
            border: `1px solid ${chainColor}40`,
          }}
        >
          {currentSize.dimensions}
        </div>

        {/* Zoom hint */}
        <div
          className={cn(
            "absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs z-10 transition-opacity duration-300",
            isZoomed ? "opacity-0" : "opacity-70"
          )}
          style={{
            background: "rgba(0,0,0,0.5)",
            color: "white",
          }}
        >
          Нажмите для увеличения
        </div>
      </div>

      {/* Size description */}
      <p className="mt-4 text-sm text-muted-foreground text-center max-w-[280px]">
        {selectedSize === "s" && "Компактный размер — изящный миниатюрный кулон"}
        {selectedSize === "m" && "Классический размер — универсальный выбор"}
        {selectedSize === "l" && "Выразительный размер — заметный акцент"}
      </p>
    </div>
  );
};

export type { SizeOption };
