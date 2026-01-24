import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { StepUpload } from "@/components/steps/StepUpload";
import { StepGenerating } from "@/components/steps/StepGenerating";
import { StepSelection } from "@/components/steps/StepSelection";
import { StepVerification } from "@/components/steps/StepVerification";
import { StepCheckout } from "@/components/steps/StepCheckout";
import {
  AppStep,
  PendantConfig,
  initialPendantConfig,
  getSizeConfigWithDefaults,
  UserAuthData,
} from "@/types/pendant";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeProvider, AppTheme, themeConfigs } from "@/contexts/ThemeContext";

// State machine: valid transitions
const VALID_TRANSITIONS: Record<AppStep, AppStep[]> = {
  [AppStep.UPLOAD]: [AppStep.GENERATING],
  [AppStep.GENERATING]: [AppStep.SELECTION, AppStep.UPLOAD], // UPLOAD on error
  [AppStep.SELECTION]: [AppStep.UPLOAD, AppStep.GENERATING, AppStep.VERIFICATION],
  [AppStep.VERIFICATION]: [AppStep.SELECTION, AppStep.CHECKOUT],
  [AppStep.CHECKOUT]: [AppStep.VERIFICATION],
};

const Application = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [config, setConfig] = useState<PendantConfig>(initialPendantConfig);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(true);
  const [appTheme, setAppTheme] = useState<AppTheme>("main");

  // Theme config derived from appTheme state
  const themeConfig = themeConfigs[appTheme];

  // State machine transition function with validation
  const transitionTo = useCallback(
    (nextStep: AppStep) => {
      if (VALID_TRANSITIONS[currentStep].includes(nextStep)) {
        console.log(`Transition: ${currentStep} -> ${nextStep}`);
        setCurrentStep(nextStep);

        // Persist step and status to DB
        if (applicationId) {
          const updates: Record<string, unknown> = { current_step: nextStep };

          // Update status when transitioning to checkout
          if (nextStep === AppStep.CHECKOUT) {
            updates.status = "checkout";
          } else if (nextStep === AppStep.SELECTION) {
            updates.status = "generated";
          }

          api.updateApplication(applicationId, updates);
        }
      } else {
        console.warn(`Invalid transition from ${currentStep} to ${nextStep}`);
      }
    },
    [currentStep, applicationId]
  );

  // Config change handler with DB sync
  const handleConfigChange = useCallback(
    async (updates: Partial<PendantConfig>) => {
      setConfig((prev) => ({ ...prev, ...updates }));

      // Sync to database
      if (applicationId) {
        const dbUpdates: Record<string, unknown> = {};
        if ("formFactor" in updates) dbUpdates.form_factor = updates.formFactor;
        if ("material" in updates) dbUpdates.material = updates.material;
        if ("size" in updates) dbUpdates.size = updates.size;
        if ("comment" in updates) dbUpdates.user_comment = updates.comment;
        if ("generatedPreview" in updates)
          dbUpdates.generated_preview = updates.generatedPreview;
        if ("imagePreview" in updates)
          dbUpdates.input_image_url = updates.imagePreview;

        if (Object.keys(dbUpdates).length > 0) {
          await api.updateApplication(applicationId, dbUpdates);
        }
      }
    },
    [applicationId]
  );

  // Start generation handler
  const handleStartGeneration = useCallback(async () => {
    // Create application if it doesn't exist
    if (!applicationId) {
      const sessionId =
        localStorage.getItem("sessionId") || crypto.randomUUID();
      localStorage.setItem("sessionId", sessionId);

      // Get theme from localStorage for new applications
      const currentTheme = localStorage.getItem("appTheme") || "main";

      const { data: newApp, error } = await api.createApplication({
        session_id: sessionId,
        form_factor: config.formFactor,
        material: config.material,
        size: config.size,
        input_image_url: config.imagePreview,
        user_comment: config.comment,
        theme: currentTheme,
      });

      if (error || !newApp) {
        toast.error("Не удалось создать заявку");
        return;
      }

      setApplicationId(newApp.id);
      // Set theme for new application
      if (currentTheme === "kids" || currentTheme === "totems" || currentTheme === "main") {
        setAppTheme(currentTheme as AppTheme);
      }
      navigate(`/application/${newApp.id}`, { replace: true });

      // Transition will happen after navigation completes and component reloads
      // For now, trigger generation directly
      setCurrentStep(AppStep.GENERATING);
      return;
    }

    transitionTo(AppStep.GENERATING);
  }, [applicationId, config, navigate, transitionTo]);

  // Generation complete handler
  const handleGenerationComplete = useCallback(
    (images: string[], userAuth: UserAuthData) => {
      setGeneratedImages(images);
      setConfig((prev) => ({
        ...prev,
        generatedImages: images,
        selectedVariantIndex: 0,
        generatedPreview: images[0] || null,
        userAuth,
      }));
      transitionTo(AppStep.SELECTION);
    },
    [transitionTo]
  );

  // Verification complete handler
  const handleVerificationComplete = useCallback(
    (userAuth: UserAuthData) => {
      setConfig((prev) => ({
        ...prev,
        userAuth,
      }));
      transitionTo(AppStep.CHECKOUT);
    },
    [transitionTo]
  );

  // Generation error handler
  const handleGenerationError = useCallback(
    (error: string) => {
      console.error("Generation failed:", error);
      transitionTo(AppStep.UPLOAD);
    },
    [transitionTo]
  );

  // Variant selection handler
  const handleSelectVariant = useCallback(
    (index: number) => {
      setConfig((prev) => ({
        ...prev,
        selectedVariantIndex: index,
        generatedPreview: generatedImages[index],
      }));

      // Sync selected preview to DB
      if (applicationId && generatedImages[index]) {
        api.updateApplication(applicationId, {
          generated_preview: generatedImages[index],
        });
      }
    },
    [generatedImages, applicationId]
  );

  // Regenerate handler
  const handleRegenerate = useCallback(() => {
    setGeneratedImages([]);
    setConfig((prev) => ({
      ...prev,
      generatedImages: [],
      selectedVariantIndex: 0,
      generatedPreview: null,
    }));
    transitionTo(AppStep.GENERATING);
  }, [transitionTo]);

  // Load application data on mount
  useEffect(() => {
    const loadApplication = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await api.getApplication(id);

      if (error || !data) {
        toast.error("Заявка не найдена");
        navigate("/");
        return;
      }

      // Determine step based on status
      let determinedStep: AppStep;

      switch (data.status) {
        case "generating":
          determinedStep = AppStep.GENERATING;
          break;
        case "checkout":
          // User is on checkout step - return them there
          determinedStep = AppStep.CHECKOUT;
          break;
        case "generated":
          // Generation complete - go to selection
          determinedStep = AppStep.SELECTION;
          break;
        case "pending_generation":
          if (data.input_image_url) {
            determinedStep = AppStep.GENERATING;
          } else {
            determinedStep = AppStep.UPLOAD;
          }
          break;
        default:
          // Draft or unknown - upload step
          determinedStep = AppStep.UPLOAD;
      }

      setCurrentStep(determinedStep);

      // Set theme from application (or fallback to localStorage)
      const savedTheme = data.theme as AppTheme;
      if (savedTheme === "kids" || savedTheme === "totems" || savedTheme === "main") {
        setAppTheme(savedTheme);
      } else {
        // Fallback to localStorage for old applications without theme
        const localTheme = localStorage.getItem("appTheme") as AppTheme;
        if (localTheme === "kids" || localTheme === "totems" || localTheme === "main") {
          setAppTheme(localTheme);
        }
      }

      // Map size to sizeOption
      const sizeToOption: Record<string, "s" | "m" | "l"> = {
        bracelet: "s",
        pendant: "m",
        interior: "l",
      };

      const sizeOption = sizeToOption[data.size] || "s";
      const sizeDefaults = getSizeConfigWithDefaults(sizeOption);

      // Use generated_images from API (all variants) or fallback to generated_preview
      const allGeneratedImages = data.generated_images && data.generated_images.length > 0
        ? data.generated_images
        : data.generated_preview
          ? [data.generated_preview]
          : [];

      // Find selected index based on generated_preview
      const selectedIndex = data.generated_preview
        ? Math.max(0, allGeneratedImages.indexOf(data.generated_preview))
        : 0;

      setConfig({
        ...initialPendantConfig,
        sizeOption,
        formFactor: data.form_factor || sizeDefaults.formFactor,
        material: data.material || "silver",
        size: data.size || sizeDefaults.size,
        imagePreview: data.input_image_url,
        generatedPreview: data.generated_preview || allGeneratedImages[0] || null,
        comment: data.user_comment || "",
        generatedImages: allGeneratedImages,
        selectedVariantIndex: selectedIndex,
      });

      // Set generated images for selection step
      setGeneratedImages(allGeneratedImages);

      setLoading(false);
    };

    loadApplication();
  }, [id, navigate]);

  // Get theme-specific classes
  const themeClass = appTheme === "kids" ? "theme-kids" : appTheme === "totems" ? "theme-totems" : "";

  // Render loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${themeClass}`}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeConfig.accentColor }} />
      </div>
    );
  }

  return (
    <ThemeProvider theme={appTheme}>
      <div className={`min-h-screen bg-background ${themeClass}`}>
        <Header applicationId={applicationId} />

        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Hero section - only on UPLOAD without image */}
            {currentStep === AppStep.UPLOAD && !config.imagePreview && (
              <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-4">
                  {themeConfig.heroTitle}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  {themeConfig.heroSubtitle}
                </p>
              </div>
            )}

          {/* Step indicator */}
          <div className="mb-12">
            <StepIndicator currentStep={currentStep} />
          </div>

          {/* Step content */}
          <div className="min-h-[500px]">
            {currentStep === AppStep.UPLOAD && (
              <StepUpload
                config={config}
                onConfigChange={handleConfigChange}
                onStartGeneration={handleStartGeneration}
              />
            )}

            {currentStep === AppStep.GENERATING && applicationId && (
              <StepGenerating
                config={config}
                applicationId={applicationId}
                onGenerationComplete={handleGenerationComplete}
                onGenerationError={handleGenerationError}
              />
            )}

            {currentStep === AppStep.SELECTION && (
              <StepSelection
                config={config}
                generatedImages={generatedImages}
                onSelectVariant={handleSelectVariant}
                onRegenerate={handleRegenerate}
                onNext={() => transitionTo(AppStep.VERIFICATION)}
                onBack={() => transitionTo(AppStep.UPLOAD)}
              />
            )}

            {currentStep === AppStep.VERIFICATION && applicationId && (
              <StepVerification
                config={config}
                applicationId={applicationId}
                onVerified={handleVerificationComplete}
                onBack={() => transitionTo(AppStep.SELECTION)}
              />
            )}

            {currentStep === AppStep.CHECKOUT && (
              <StepCheckout
                config={config}
                onConfigChange={handleConfigChange}
                onBack={() => transitionTo(AppStep.VERIFICATION)}
                applicationId={applicationId || undefined}
              />
            )}
          </div>
        </div>
      </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 OLAI.art. Все права защищены.</p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Application;
