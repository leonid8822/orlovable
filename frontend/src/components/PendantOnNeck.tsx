import { FC, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Material, SizeOption as PendantSizeOption, FormFactor } from "@/types/pendant";
import { getSizeConfigByMaterial } from "@/types/pendant";

// Visual configurations for pendant display
const visualConfigs = {
  s: { scale: 0.5, chainLength: 52 },
  m: { scale: 0.7, chainLength: 54 },
  l: { scale: 0.9, chainLength: 56 },
} as const;

type SizeOption = keyof typeof visualConfigs;

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
  const visualConfig = visualConfigs[selectedSize];
  const sizeConfig = getSizeConfigByMaterial(material);
  const currentSize = sizeConfig[selectedSize];

  // Determine which neck SVG to use based on form factor
  const neckSvg = formFactor === "oval" ? "/man-neck.svg" : "/woman-neck.svg";

  // Base pendant size in percentage of container
  const basePendantSize = 18;
  const pendantSize = basePendantSize * visualConfig.scale;

  // Position pendant - attachment point at TOP of pendant (chain connects to top)
  const pendantX = 50; // Center horizontally
  const pendantY = visualConfig.chainLength; // This is where the TOP of pendant attaches

  // Trigger animation on size change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [selectedSize]);

  // Chain/accent color from theme
  const displayAccent = accentColor || "hsl(0, 0%, 70%)";

  // Pendant tint based on material (applied as CSS filter)
  const pendantFilter = material === "gold"
    ? "sepia(0.5) saturate(1.5) brightness(1.1) hue-rotate(-10deg)"
    : "none";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Preview container */}
      <div
        className="relative w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(40, 30%, 96%) 0%, hsl(40, 25%, 90%) 100%)",
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

        {/* Chain SVG - drawn on top of neck */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Chain - curves from sides of neck down to pendant attachment point (TOP of pendant) */}
          <path
            d={`M 38 28
                Q 44 38, 50 ${pendantY - 1}
                M 62 28
                Q 56 38, 50 ${pendantY - 1}`}
            stroke={displayAccent}
            strokeWidth="0.5"
            fill="none"
            opacity="0.9"
            className="transition-all duration-300 ease-out"
          />

          {/* Small bail/loop where pendant attaches at the bottom of chain */}
          <circle
            cx="50"
            cy={pendantY - 1}
            r="0.8"
            fill={displayAccent}
            opacity="0.8"
          />
        </svg>

        {/* Pendant - positioned with TOP at attachment point, no shape overlay */}
        {pendantImage && (
          <div
            className={cn(
              "absolute transform -translate-x-1/2 overflow-hidden shadow-lg transition-all duration-300 ease-out",
              isAnimating && "scale-105"
            )}
            style={{
              left: `${pendantX}%`,
              top: `${pendantY}%`,
              width: `${pendantSize}%`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            }}
          >
            <img
              src={pendantImage}
              alt="Pendant preview"
              className="w-full h-full object-contain"
              style={{ filter: pendantFilter }}
            />
          </div>
        )}

        {/* Placeholder if no image */}
        {!pendantImage && (
          <div
            className="absolute transform -translate-x-1/2 transition-all duration-300 ease-out flex items-center justify-center rounded-xl"
            style={{
              left: `${pendantX}%`,
              top: `${pendantY}%`,
              width: `${pendantSize}%`,
              aspectRatio: "1",
              background: `linear-gradient(135deg, ${displayAccent}40 0%, ${displayAccent}20 100%)`,
              border: `2px dashed ${displayAccent}60`,
            }}
          >
            <span className="text-xs opacity-50">Превью</span>
          </div>
        )}

        {/* Size indicator badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-sm font-medium"
          style={{
            background: `${displayAccent}20`,
            color: displayAccent,
            border: `1px solid ${displayAccent}40`,
          }}
        >
          {currentSize.dimensions}
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

export { visualConfigs };
export type { SizeOption };
