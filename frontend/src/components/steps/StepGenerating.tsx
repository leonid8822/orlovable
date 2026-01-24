import { useState, useEffect } from "react";
import { Sparkles, Mail, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PendantConfig, UserAuthData } from "@/types/pendant";
import { useFormFactors } from "@/contexts/SettingsContext";
import { useAppTheme } from "@/contexts/ThemeContext";

const funFacts = [
  "Первые ювелирные украшения появились более 100 000 лет назад...",
  "Серебро обладает антибактериальными свойствами и использовалось в медицине веками",
  "Самый большой серебряный кулон весил более 5 кг и был создан в Индии",
  "3D-печать ювелирных изделий позволяет создавать формы, невозможные при традиционных методах",
  "Техника литья по выплавляемым моделям используется уже более 5000 лет",
  "Каждое украшение проходит до 20 этапов обработки прежде чем попасть к владельцу",
  "Серебро 925 пробы содержит 92.5% чистого серебра и 7.5% меди для прочности",
  "Современные ювелиры используют лазеры для гравировки с точностью до 0.01мм",
];

interface StepGeneratingProps {
  config: PendantConfig;
  applicationId: string;
  onGenerationComplete: (images: string[], userAuth: UserAuthData) => void;
  onGenerationError: (error: string) => void;
}

export function StepGenerating({
  config,
  applicationId,
  onGenerationComplete,
  onGenerationError,
}: StepGeneratingProps) {
  const [progress, setProgress] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const { toast } = useToast();

  // User auth form state
  const [email, setEmail] = useState(config.userAuth?.email || "");
  const [name, setName] = useState(config.userAuth?.name || "");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  const estimatedTime = 60; // seconds

  // Validate email format
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Check if form is valid
  const isFormValid = () => {
    return email.trim() !== "" && validateEmail(email) && name.trim() !== "";
  };

  // Handle form submission when generation is done
  const handleContinue = async () => {
    // Validate
    let hasError = false;

    if (!name.trim()) {
      setNameError("Введите ваше имя");
      hasError = true;
    } else {
      setNameError("");
    }

    if (!email.trim()) {
      setEmailError("Введите email");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Некорректный email");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (hasError) return;

    // Request verification code
    const { data, error } = await api.requestVerificationCode({
      email: email.trim(),
      name: name.trim(),
      application_id: applicationId,
    });

    if (error || !data?.success) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить код. Попробуйте ещё раз.",
        variant: "destructive",
      });
      return;
    }

    // Pass user auth data to parent
    const userAuth: UserAuthData = {
      email: email.trim(),
      name: name.trim(),
      userId: data.user_id,
      isVerified: false,
    };

    toast({
      title: "Код отправлен",
      description: `Проверьте почту ${email}`,
    });

    onGenerationComplete(generatedImages, userAuth);
  };

  // Start generation on mount
  useEffect(() => {
    if (isGenerating) return;

    const runGeneration = async () => {
      setIsGenerating(true);

      try {
        console.log("Starting pendant generation...");

        // Update status to generating
        await api.updateApplication(applicationId, { status: "generating" });

        const { data, error } = await api.generate({
          imageBase64: config.imagePreview,
          prompt: config.comment,
          formFactor: config.formFactor,
          size: config.size,
          material: config.material,
          applicationId: applicationId,
        });

        if (error) {
          console.error("Generation error:", error);
          throw new Error(error.toString());
        }

        if (!data.success) {
          throw new Error(data.error || "Generation failed");
        }

        console.log("Generation successful:", data.images?.length, "images");

        // Update application with generated preview
        if (data.images && data.images.length > 0) {
          await api.updateApplication(applicationId, {
            generated_preview: data.images[0],
            status: "generated",
          });
        }

        setProgress(100);
        setGeneratedImages(data.images || []);
        setGenerationDone(true);

        toast({
          title: "Готово!",
          description: `Сгенерировано ${data.images?.length || 1} вариантов`,
        });

      } catch (error) {
        console.error("Generation error:", error);

        // Update status back to draft on error
        await api.updateApplication(applicationId, { status: "draft" });

        toast({
          title: "Ошибка генерации",
          description:
            error instanceof Error ? error.message : "Попробуйте еще раз",
          variant: "destructive",
        });

        onGenerationError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    };

    runGeneration();
  }, [applicationId]);

  // Progress animation
  useEffect(() => {
    if (generationDone) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Non-linear progress that slows down as it approaches 95%
        const increment = Math.max(0.5, (95 - prev) / 50);
        return Math.min(prev + increment, 95);
      });
    }, 600);

    return () => clearInterval(interval);
  }, [generationDone]);

  // Fun facts rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formFactors = useFormFactors();
  const { config: themeConfig } = useAppTheme();
  const formFactorConfig = formFactors[config.formFactor];

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-fade-in">
      {/* Uploaded image preview */}
      {config.imagePreview && (
        <div className="relative">
          <div
            className="absolute inset-0 blur-2xl rounded-full"
            style={{ backgroundColor: `${themeConfig.accentColor}20` }}
          />
          <div
            className="relative w-48 h-48 rounded-xl overflow-hidden bg-card"
            style={{ borderWidth: 2, borderColor: `${themeConfig.accentColor}50` }}
          >
            <img
              src={config.imagePreview}
              alt="Ваше изображение"
              className="w-full h-full object-cover opacity-60"
            />
            {/* Overlay with pulse animation */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        </div>
      )}

      {/* Loading animation */}
      <div className="text-center space-y-6">
        <div className="relative">
          <Sparkles
            className="w-16 h-16 animate-pulse mx-auto"
            style={{ color: themeConfig.accentColor }}
          />
          <div
            className="absolute inset-0 blur-xl rounded-full animate-pulse"
            style={{ backgroundColor: `${themeConfig.accentColor}30` }}
          />
        </div>

        <div className="space-y-2">
          <h2
            className={`text-2xl md:text-3xl font-display ${themeConfig.textGradientClass}`}
          >
            {generationDone ? "Варианты готовы!" : "Создаём варианты вашего украшения..."}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formFactorConfig?.label || config.formFactor}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 md:w-80 mx-auto space-y-2">
          <Progress
            value={progress}
            className="h-2"
            style={{
              // @ts-ignore - CSS variable for progress indicator color
              "--progress-color": themeConfig.accentColor
            } as React.CSSProperties}
          />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% завершено
          </p>
        </div>
      </div>

      {/* Email/Name form - always visible while waiting */}
      <div className="w-full max-w-sm space-y-4 bg-card/50 rounded-xl border border-border/50 p-6">
        <div className="text-center mb-4">
          <p className="text-sm font-medium" style={{ color: themeConfig.accentColorLight }}>
            {generationDone ? "Куда отправить результат?" : "Пока ждём, расскажите о себе"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Ваше имя
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Как к вам обращаться?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={emailError ? "border-destructive" : ""}
            />
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>
        </div>

        {/* Continue button - only when generation is done */}
        {generationDone && (
          <button
            onClick={handleContinue}
            disabled={!isFormValid()}
            className="w-full py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isFormValid() ? themeConfig.accentColor : undefined,
              color: isFormValid() ? "white" : undefined,
            }}
          >
            Продолжить
          </button>
        )}
      </div>

      {/* Fun facts - only while generating */}
      {!generationDone && (
        <div className="max-w-md p-4 bg-card/50 rounded-xl border border-border/50">
          <p
            className="text-sm font-medium mb-2"
            style={{ color: themeConfig.accentColorLight }}
          >
            А вы знали?
          </p>
          <p
            className="text-sm text-muted-foreground animate-fade-in"
            key={currentFactIndex}
          >
            {funFacts[currentFactIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
