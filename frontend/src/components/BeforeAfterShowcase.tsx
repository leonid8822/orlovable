import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";
import { ImageWithLoading } from "@/components/ui/image-with-loading";

interface Example {
  before: string;
  after: string;
  title: string;
}

interface BeforeAfterShowcaseProps {
  examples: Example[];
  accentColor?: "gold" | "tiffany" | "brown";
  autoPlayInterval?: number;
  isLoading?: boolean;
}

export function BeforeAfterShowcase({
  examples,
  accentColor = "gold",
  autoPlayInterval = 4000,
  isLoading = false,
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

  // Color configurations
  const colorConfig = {
    gold: {
      bgLight: "bg-gold/20",
      bgMedium: "bg-gold/30",
      bgHeavy: "bg-gold/80",
      borderLight: "border-gold/30",
      borderMedium: "border-gold/50",
      gradient: "bg-gradient-gold shadow-gold",
      dot: "bg-gold",
    },
    tiffany: {
      bgLight: "bg-[hsl(174,58%,38%)]/20",
      bgMedium: "bg-[hsl(174,58%,38%)]/30",
      bgHeavy: "bg-[hsl(174,58%,38%)]/80",
      borderLight: "border-[hsl(174,58%,38%)]/30",
      borderMedium: "border-[hsl(174,58%,38%)]/50",
      gradient: "bg-[linear-gradient(135deg,hsl(174,58%,45%)_0%,hsl(174,58%,32%)_100%)] shadow-[0_0_50px_hsl(174,58%,38%,0.3)]",
      dot: "bg-[hsl(174,58%,38%)]",
    },
    brown: {
      bgLight: "bg-[hsl(25,45%,35%)]/20",
      bgMedium: "bg-[hsl(25,45%,35%)]/30",
      bgHeavy: "bg-[hsl(25,45%,35%)]/80",
      borderLight: "border-[hsl(25,45%,35%)]/30",
      borderMedium: "border-[hsl(25,45%,35%)]/50",
      gradient: "bg-[linear-gradient(135deg,hsl(25,50%,45%)_0%,hsl(25,45%,30%)_100%)] shadow-[0_0_50px_hsl(25,45%,35%,0.3)]",
      dot: "bg-[hsl(25,45%,35%)]",
    },
  };

  const colors = colorConfig[accentColor];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {/* Before skeleton */}
            <div className="relative">
              <div className={cn("absolute -inset-1 rounded-2xl blur-xl", colors.bgLight)} />
              <div className={cn("relative aspect-square rounded-2xl overflow-hidden border-2", colors.borderLight)}>
                <div className="w-full h-full bg-muted/50 animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center opacity-50", colors.gradient)}>
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>

            {/* After skeleton */}
            <div className="relative">
              <div className={cn("absolute -inset-1 rounded-2xl blur-xl", colors.bgMedium)} />
              <div className={cn("relative aspect-square rounded-2xl overflow-hidden border-2", colors.borderMedium)}>
                <div className="w-full h-full bg-muted/50 animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              </div>
            </div>
          </div>

          {/* Title skeleton */}
          <div className="text-center mt-4">
            <div className="h-5 w-48 mx-auto bg-muted/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Dots skeleton */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          ))}
        </div>
      </div>
    );
  }

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
                colors.bgLight,
                isTransitioning ? "opacity-0" : "opacity-100"
              )}
            />
            <div
              className={cn(
                "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500",
                colors.borderLight,
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
            >
              {currentExample.before ? (
                <ImageWithLoading
                  src={currentExample.before}
                  alt="До"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                  <span className="text-muted-foreground text-lg">До</span>
                </div>
              )}
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
                colors.gradient,
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
                colors.bgMedium,
                isTransitioning ? "opacity-0" : "opacity-100"
              )}
            />
            <div
              className={cn(
                "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500",
                colors.borderMedium,
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
            >
              <ImageWithLoading
                src={currentExample.after}
                alt="После"
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
              />
              <div
                className={cn(
                  "absolute bottom-3 right-3 px-3 py-1.5 backdrop-blur-sm rounded-full text-sm font-medium text-white",
                  colors.bgHeavy
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
                ? cn("w-8", colors.dot)
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
