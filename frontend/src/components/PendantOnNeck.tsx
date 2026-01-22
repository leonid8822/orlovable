import { FC, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Material, SizeOption as PendantSizeOption, FormFactor } from "@/types/pendant";
import { getSizeConfigByMaterial } from "@/types/pendant";
import { useVisualization, useSettings } from "@/contexts/SettingsContext";

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
  const { settings } = useSettings();
  const visualization = useVisualization();
  const sizeConfig = getSizeConfigByMaterial(material);
  const currentSize = sizeConfig[selectedSize];

  // Determine which neck photo and attachment point to use based on form factor gender from settings
  const formFactorConfig = settings.form_factors[formFactor];
  const isMale = formFactorConfig?.gender === "male";
  const neckPhoto = isMale ? "/man-back.jpg" : "/woman-back.jpg";
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

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Preview container */}
      <div
        className="relative w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden"
      >
        {/* Content wrapper */}
        <div className="absolute inset-0">
          {/* Neck photo background */}
          <img
            src={neckPhoto}
            alt="Neck photo"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Pendant - positioned at attachment point (grows from top) */}
          {pendantImage && (
            <div
              className={cn(
                "absolute transition-all duration-300 ease-out",
                isAnimating && "scale-105"
              )}
              style={{
                left: `${pendantX}%`,
                top: `${pendantY}%`,
                width: `${pendantSizePercent}%`,
                transform: 'translate(-50%, -10%)',
                transformOrigin: 'top center',
              }}
            >
              <img
                src={pendantImage}
                alt="Pendant preview"
                className="w-full h-full object-contain"
                style={{
                  filter: pendantFilter,
                }}
              />
            </div>
          )}

          {/* Placeholder if no image */}
          {!pendantImage && (
            <div
              className="absolute transition-all duration-300 ease-out flex items-center justify-center rounded-xl"
              style={{
                left: `${pendantX}%`,
                top: `${pendantY}%`,
                width: `${pendantSizePercent}%`,
                aspectRatio: "1",
                transform: 'translate(-50%, -10%)',
                transformOrigin: 'top center',
                background: `linear-gradient(135deg, ${chainColor}40 0%, ${chainColor}20 100%)`,
                border: `2px dashed ${chainColor}60`,
              }}
            >
              <span className="text-xs opacity-50">Превью</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export type { SizeOption };
