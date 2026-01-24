import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mail, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PendantConfig, UserAuthData } from "@/types/pendant";
import { useAppTheme } from "@/contexts/ThemeContext";

interface StepVerificationProps {
  config: PendantConfig;
  applicationId: string;
  onVerified: (userAuth: UserAuthData) => void;
  onBack: () => void;
}

export function StepVerification({
  config,
  applicationId,
  onVerified,
  onBack,
}: StepVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const { config: themeConfig } = useAppTheme();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-verify when all digits entered
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 6 && !isVerifying) {
      handleVerify(fullCode);
    }
  }, [code]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      // Focus last filled or next empty
      const lastIndex = Math.min(pastedData.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleVerify = async (fullCode: string) => {
    setIsVerifying(true);
    setError("");

    try {
      const { data, error: apiError } = await api.verifyCode({
        email: config.userAuth.email,
        code: fullCode,
        application_id: applicationId,
      });

      if (apiError || !data?.success) {
        setError("Неверный код. Попробуйте ещё раз.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      toast({
        title: "Успешно!",
        description: "Email подтверждён",
      });

      // Update user auth with verified status
      const verifiedAuth: UserAuthData = {
        ...config.userAuth,
        userId: data.user_id,
        isVerified: true,
      };

      onVerified(verifiedAuth);
    } catch (err) {
      setError("Ошибка проверки. Попробуйте ещё раз.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);

    try {
      const { data, error: apiError } = await api.requestVerificationCode({
        email: config.userAuth.email,
        name: config.userAuth.name,
        application_id: applicationId,
      });

      if (apiError || !data?.success) {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить код",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Код отправлен",
        description: `Проверьте почту ${config.userAuth.email}`,
      });

      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${themeConfig.accentColor}20` }}
        >
          <Mail className="w-10 h-10" style={{ color: themeConfig.accentColor }} />
        </div>

        <div className="space-y-2">
          <h2 className={`text-2xl md:text-3xl font-display ${themeConfig.textGradientClass}`}>
            Подтвердите email
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Мы отправили 6-значный код на{" "}
            <span className="font-medium text-foreground">{config.userAuth.email}</span>
          </p>
        </div>
      </div>

      {/* Code input */}
      <div className="space-y-4">
        <div className="flex gap-2 md:gap-3 justify-center">
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold border-2 ${
                error ? "border-destructive" : digit ? "border-theme" : "border-border"
              }`}
              disabled={isVerifying}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {isVerifying && (
          <p className="text-sm text-muted-foreground text-center animate-pulse">
            Проверяем код...
          </p>
        )}
      </div>

      {/* Resend button */}
      <button
        onClick={handleResend}
        disabled={isResending || resendCooldown > 0}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
        {resendCooldown > 0
          ? `Отправить повторно (${resendCooldown}с)`
          : "Отправить код повторно"}
      </button>

      {/* Navigation buttons - stacked on mobile */}
      <div className="flex flex-col-reverse md:flex-row gap-3 w-full max-w-sm">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="w-full md:w-auto border-border hover:border-theme/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    </div>
  );
}
