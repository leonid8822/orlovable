import { cn } from "@/lib/utils";
import { SIZE_CONFIG, type SizeOption } from "@/types/pendant";

interface MeasuringRulerProps {
  sizeOption: SizeOption;
  className?: string;
}

export function MeasuringRuler({ sizeOption, className }: MeasuringRulerProps) {
  const config = SIZE_CONFIG[sizeOption];
  const mmValue = config.dimensionsMm;

  // Convert mm to pixels (96 DPI standard: 1 inch = 25.4mm = 96px)
  // 1mm = 96/25.4 = ~3.78px
  const pixelsPerMm = 3.78;
  const widthPx = mmValue * pixelsPerMm;

  // Generate tick marks
  const ticks: number[] = [];
  const tickInterval = mmValue <= 15 ? 1 : mmValue <= 30 ? 5 : 10;
  for (let i = 0; i <= mmValue; i += tickInterval) {
    ticks.push(i);
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <p className="text-sm text-muted-foreground">Реальный размер</p>

      {/* Ruler container */}
      <div className="relative">
        {/* Main ruler bar */}
        <div
          className="relative h-12 border-2 border-gold rounded-lg bg-gradient-to-r from-gold/5 to-gold/10"
          style={{ width: `${widthPx}px` }}
        >
          {/* Tick marks */}
          <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-between px-0">
            {ticks.map((tick, index) => {
              const isFirst = index === 0;
              const isLast = index === ticks.length - 1;
              const isMajor = tick % (tickInterval * 2) === 0 || isFirst || isLast;

              return (
                <div
                  key={tick}
                  className="flex flex-col items-center"
                  style={{
                    position: 'absolute',
                    left: `${(tick / mmValue) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div
                    className={cn(
                      "w-px bg-gold",
                      isMajor ? "h-3" : "h-2"
                    )}
                  />
                  {(isFirst || isLast) && (
                    <span className="text-[10px] text-gold-light mt-0.5">
                      {tick}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-display text-gold-light">
              {config.dimensions}
            </span>
          </div>
        </div>

        {/* Arrow indicators */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2">
          <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gold" />
        </div>
        <div className="absolute -right-2 top-1/2 -translate-y-1/2">
          <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gold" />
        </div>
      </div>

      {/* Size info */}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Размер {config.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {config.description} &bull; {config.gender}
        </p>
      </div>
    </div>
  );
}
