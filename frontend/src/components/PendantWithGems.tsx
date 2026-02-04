import { GemPlacement } from "@/types/pendant";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface GemData {
  id: string;
  name: string;
  name_en: string;
  shape: string;
  size_mm: number;
  color: string;
  image_url: string | null;
}

interface PendantWithGemsProps {
  imageUrl: string;
  gems: GemPlacement[];
  sizeOption: "s" | "m" | "l";
  className?: string;
  style?: React.CSSProperties;
  onImageRef?: (ref: HTMLDivElement | null) => void;
}

/**
 * Component that displays a pendant image with gems overlay.
 * Used in StepCheckout and StepConfirmation to show the final design.
 */
export function PendantWithGems({
  imageUrl,
  gems,
  sizeOption,
  className = "",
  style = {},
  onImageRef,
}: PendantWithGemsProps) {
  const [gemsData, setGemsData] = useState<GemData[]>([]);

  // Load gems data for rendering
  useEffect(() => {
    if (gems.length === 0) return;

    const loadGems = async () => {
      const { data } = await api.getGems();
      if (data?.gems) {
        setGemsData(data.gems);
      }
    };
    loadGems();
  }, [gems.length]);

  // Calculate gem size based on pendant size
  const getGemSizePercent = (gemSizeMm: number = 1.5) => {
    const pendantSizeMap: Record<string, number> = {
      s: 13,
      m: 19,
      l: 25,
    };
    const pendantMm = pendantSizeMap[sizeOption] || 19;
    // Gem percentage relative to pendant (which is ~80% of image)
    return (gemSizeMm / pendantMm) * 80;
  };

  // Get gem config by placement
  const getGemConfig = (placement: GemPlacement): GemData | undefined => {
    if (placement.gemId) {
      return gemsData.find((g) => g.id === placement.gemId);
    }
    return gemsData.find((g) => g.name_en === placement.type);
  };

  return (
    <div
      ref={onImageRef}
      className={`relative ${className}`}
      style={style}
    >
      <img
        src={imageUrl}
        alt="Pendant preview"
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* Render gems overlay */}
      {gems.map((placement) => {
        const gemConfig = getGemConfig(placement);
        if (!gemConfig) return null;

        const sizePercent = getGemSizePercent(gemConfig.size_mm);

        return (
          <div
            key={placement.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${placement.x}%`,
              top: `${placement.y}%`,
              width: `${sizePercent}%`,
              height: `${sizePercent}%`,
            }}
          >
            {gemConfig.image_url ? (
              <img
                src={gemConfig.image_url}
                alt={gemConfig.name}
                className="w-full h-full object-contain drop-shadow-lg"
                draggable={false}
              />
            ) : (
              <div
                className="w-full h-full rounded-full shadow-lg"
                style={{
                  backgroundColor: gemConfig.color,
                  boxShadow: `0 2px 8px ${gemConfig.color}80`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
