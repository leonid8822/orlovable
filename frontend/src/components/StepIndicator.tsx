import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepTitles = [
  "Загрузка",
  "Настройка",
  "Обратная сторона",
  "Оформление",
];

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-display text-lg md:text-xl transition-all duration-500",
                step < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step === currentStep
                  ? "bg-gradient-gold text-primary-foreground shadow-gold animate-pulse-gold"
                  : "bg-secondary text-muted-foreground border border-border"
              )}
            >
              {step < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step
              )}
            </div>
            <span
              className={cn(
                "text-xs mt-2 hidden md:block transition-colors duration-300",
                step === currentStep
                  ? "text-gold-light font-medium"
                  : "text-muted-foreground"
              )}
            >
              {stepTitles[step - 1]}
            </span>
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                "w-8 md:w-16 h-0.5 mx-2 transition-colors duration-500",
                step < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
