import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface Example {
  before: string;
  after: string;
  title: string;
}

interface BeforeAfterShowcaseProps {
  examples: Example[];
  accentColor?: "gold" | "tiffany";
  autoPlayInterval?: number;
}

export function BeforeAfterShowcase({
  examples,
  accentColor = "gold",
  autoPlayInterval = 4000,
}: BeforeAfterShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % examples.length);
        setIsTransitioning(false);
      }, 300);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [examples.length, autoPlayInterval]);

  const handleDotClick = (index: number) => {
    if (index === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const currentExample = examples[activeIndex];
  const isGold = accentColor === "gold";
  const tiffanyColor = "hsl(174,58%,38%)";

  return (
    <div className="space-y-6">
      {/* Main showcase */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-4 md:gap-8">
          {/* Before */}
          <div className="relative">
            <div
              className={cn(
                "absolute -inset-1 rounded-2xl blur-xl transition-opacity duration-500",
                isGold ? "bg-gold/20" : "bg-[hsl(174,58%,38%)]/20",
                isTransitioning ? "opacity-0" : "opacity-100"
              )}
            />
            <div
              className={cn(
                "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500",
                isGold ? "border-gold/30" : "border-[hsl(174,58%,38%)]/30",
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
            >
              <img
                src={currentExample.before}
                alt="До"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium">
                До
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div
              className={cn(
                "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500",
                isGold
                  ? "bg-gradient-gold shadow-gold"
                  : "bg-[linear-gradient(135deg,hsl(174,58%,45%)_0%,hsl(174,58%,32%)_100%)] shadow-[0_0_50px_hsl(350,80%,60%,0.3)]",
                isTransitioning ? "scale-75 opacity-50" : "scale-100 opacity-100"
              )}
            >
              <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </div>

          {/* After */}
          <div className="relative">
            <div
              className={cn(
                "absolute -inset-1 rounded-2xl blur-xl transition-opacity duration-500",
                isGold ? "bg-gold/30" : "bg-[hsl(174,58%,38%)]/30",
                isTransitioning ? "opacity-0" : "opacity-100"
              )}
            />
            <div
              className={cn(
                "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500",
                isGold ? "border-gold/50" : "border-[hsl(174,58%,38%)]/50",
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
            >
              <img
                src={currentExample.after}
                alt="После"
                className="w-full h-full object-cover"
              />
              <div
                className={cn(
                  "absolute bottom-3 right-3 px-3 py-1.5 backdrop-blur-sm rounded-full text-sm font-medium text-white",
                  isGold
                    ? "bg-gold/80"
                    : "bg-[hsl(174,58%,38%)]/80"
                )}
              >
                Кулон
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          className={cn(
            "text-center mt-4 transition-all duration-300",
            isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          <p className="text-muted-foreground">{currentExample.title}</p>
        </div>
      </div>

      {/* Dots navigation */}
      <div className="flex justify-center gap-2">
        {examples.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === activeIndex
                ? isGold
                  ? "w-8 bg-gold"
                  : "w-8 bg-[hsl(174,58%,38%)]"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
