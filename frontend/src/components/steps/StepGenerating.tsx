import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PendantConfig, UserAuthData } from "@/types/pendant";
import { useFormFactors } from "@/contexts/SettingsContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { EmailAuthForm } from "@/components/EmailAuthForm";

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
  onGenerationComplete: (images: string[], userAuth?: UserAuthData) => void;
  onGenerationError: (error: string) => void;
  objectDescription?: string;  // For custom 3D form generation
  theme?: string;  // Theme for generation
}

export function StepGenerating({
  config,
  applicationId,
  onGenerationComplete,
  onGenerationError,
  objectDescription,
  theme,
}: StepGeneratingProps) {
  const [progress, setProgress] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const { toast } = useToast();

  const estimatedTime = 60; // seconds

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          // Check various fields that indicate logged in state
          // Auth.tsx uses 'verified', EmailAuthForm uses 'isVerified'
          if (user.isVerified || user.verified || user.userId || user.id) {
            setIsUserAuthenticated(true);
            return;
          }
        } catch {
          // ignore
        }
      }
      setIsUserAuthenticated(false);
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (login from header)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Handle auth success
  const handleAuthSuccess = (userData: UserAuthData) => {
    setIsUserAuthenticated(true);

    // If generation is already done, proceed immediately
    if (generationDone && generatedImages.length > 0) {
      toast({
        title: "Отлично!",
        description: "Теперь выберите понравившийся вариант",
      });
      onGenerationComplete(generatedImages, userData);
    }
  };

  // When generation is done and user is authenticated, proceed
  useEffect(() => {
    if (generationDone && generatedImages.length > 0 && isUserAuthenticated) {
      // Get user data from localStorage
      const storedUser = localStorage.getItem('user');
      let userData: UserAuthData | undefined;

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userData = {
            email: user.email,
            name: user.name || '',
            userId: user.userId || user.id,
            isVerified: true,
            firstName: user.firstName,
            lastName: user.lastName,
            telegramUsername: user.telegramUsername,
            subscribeNewsletter: user.subscribeNewsletter
          };
        } catch {
          // ignore
        }
      }

      onGenerationComplete(generatedImages, userData);
    }
  }, [generationDone, generatedImages, isUserAuthenticated]);

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
          theme: theme || 'main',
          objectDescription: objectDescription,  // For custom 3D form
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
            {generationDone
              ? (isUserAuthenticated ? "Варианты готовы!" : "Осталось только авторизоваться")
              : "Создаём варианты вашего украшения..."}
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

      {/* Email Auth form - show if not authenticated */}
      {!isUserAuthenticated && (
        <div className="w-full max-w-sm bg-card/50 rounded-xl border border-border/50">
          <div className="text-center pt-4 px-4">
            <p className="text-sm font-medium" style={{ color: themeConfig.accentColorLight }}>
              {generationDone ? "Войдите чтобы увидеть результат" : "Сохраните ваши эскизы"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Так мы не потеряем ваши рисунки и сможем связаться с вами
            </p>
          </div>

          <EmailAuthForm
            mode="inline"
            applicationId={applicationId}
            onSuccess={handleAuthSuccess}
            showMotivation={false}
          />
        </div>
      )}

      {/* Already authenticated message */}
      {isUserAuthenticated && !generationDone && (
        <div className="w-full max-w-sm p-4 bg-card/50 rounded-xl border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Вы авторизованы. Дождитесь завершения генерации...
          </p>
        </div>
      )}

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
