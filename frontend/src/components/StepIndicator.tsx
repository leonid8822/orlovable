import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { AppStep, STEP_TITLES, VISIBLE_STEPS } from "@/types/pendant";

interface StepIndicatorProps {
  currentStep: AppStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  // Map GENERATING to appear as part of UPLOAD visually
  const displayStep =
    currentStep === AppStep.GENERATING ? AppStep.UPLOAD : currentStep;
  const currentIndex = VISIBLE_STEPS.indexOf(displayStep);

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {VISIBLE_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isGenerating =
          currentStep === AppStep.GENERATING && step === AppStep.UPLOAD;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-display text-lg md:text-xl transition-all duration-500",
                  isCompleted
                    ? "bg-theme text-primary-foreground"
                    : isCurrent
                    ? "bg-gradient-theme text-primary-foreground shadow-theme"
                    : "bg-secondary text-muted-foreground border border-border",
                  isGenerating && "animate-pulse"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 hidden md:block transition-colors duration-300",
                  isCurrent
                    ? "text-theme-light font-medium"
                    : "text-muted-foreground"
                )}
              >
                {isGenerating ? STEP_TITLES[AppStep.GENERATING] : STEP_TITLES[step]}
              </span>
            </div>
            {index < VISIBLE_STEPS.length - 1 && (
              <div
                className={cn(
                  "w-8 md:w-16 h-0.5 mx-2 transition-colors duration-500",
                  isCompleted ? "bg-theme" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
