import { cn } from "@/lib/utils";

interface EagleIconProps {
  className?: string;
}

export function EagleIcon({ className }: EagleIconProps) {
  return (
    <img
      src="/logo.png"
      alt="OLAI"
      className={cn("w-full h-full object-contain invert", className)}
    />
  );
}
