import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { StepUpload } from "@/components/steps/StepUpload";
import { StepGenerating } from "@/components/steps/StepGenerating";
import { StepSelection } from "@/components/steps/StepSelection";
import { StepCheckout } from "@/components/steps/StepCheckout";
import {
  AppStep,
  PendantConfig,
  initialPendantConfig,
  getSizeConfigWithDefaults,
} from "@/types/pendant";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// State machine: valid transitions
const VALID_TRANSITIONS: Record<AppStep, AppStep[]> = {
  [AppStep.UPLOAD]: [AppStep.GENERATING],
  [AppStep.GENERATING]: [AppStep.SELECTION, AppStep.UPLOAD], // UPLOAD on error
  [AppStep.SELECTION]: [AppStep.UPLOAD, AppStep.GENERATING, AppStep.CHECKOUT],
  [AppStep.CHECKOUT]: [AppStep.SELECTION],
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

  // State machine transition function with validation
  const transitionTo = useCallback(
    (nextStep: AppStep) => {
      if (VALID_TRANSITIONS[currentStep].includes(nextStep)) {
        console.log(`Transition: ${currentStep} -> ${nextStep}`);
        setCurrentStep(nextStep);

        // Persist step to DB (map enum to string for storage)
        if (applicationId) {
          api.updateApplication(applicationId, { current_step: nextStep });
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

      const { data: newApp, error } = await api.createApplication({
        session_id: sessionId,
        form_factor: config.formFactor,
        material: config.material,
        size: config.size,
        input_image_url: config.imagePreview,
        user_comment: config.comment,
      });

      if (error || !newApp) {
        toast.error("Не удалось создать заявку");
        return;
      }

      setApplicationId(newApp.id);
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
    (images: string[]) => {
      setGeneratedImages(images);
      setConfig((prev) => ({
        ...prev,
        generatedImages: images,
        selectedVariantIndex: 0,
        generatedPreview: images[0] || null,
      }));
      transitionTo(AppStep.SELECTION);
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

      // Map DB step to enum (handle legacy numeric steps)
      const stepMap: Record<string | number, AppStep> = {
        1: AppStep.UPLOAD,
        2: AppStep.SELECTION,
        3: AppStep.CHECKOUT,
        4: AppStep.CHECKOUT,
        UPLOAD: AppStep.UPLOAD,
        GENERATING: AppStep.GENERATING,
        SELECTION: AppStep.SELECTION,
        CHECKOUT: AppStep.CHECKOUT,
      };

      const mappedStep = stepMap[data.current_step] || AppStep.UPLOAD;

      // If status is generating, stay on generating
      const actualStep =
        data.status === "generating" ? AppStep.GENERATING : mappedStep;

      // If status is generated but no step set, go to selection
      const finalStep =
        data.status === "generated" && actualStep === AppStep.UPLOAD
          ? AppStep.SELECTION
          : actualStep;

      setCurrentStep(finalStep);

      // Map size to sizeOption
      const sizeToOption: Record<string, "s" | "m" | "l"> = {
        bracelet: "s",
        pendant: "m",
        interior: "l",
      };

      const sizeOption = sizeToOption[data.size] || "s";
      const sizeDefaults = getSizeConfigWithDefaults(sizeOption);

      setConfig({
        ...initialPendantConfig,
        sizeOption,
        formFactor: data.form_factor || sizeDefaults.formFactor,
        material: data.material || "silver",
        size: data.size || sizeDefaults.size,
        imagePreview: data.input_image_url,
        generatedPreview: data.generated_preview,
        comment: data.user_comment || "",
        generatedImages: data.generated_preview ? [data.generated_preview] : [],
        selectedVariantIndex: 0,
      });

      // If we have generated preview, set it in images array
      if (data.generated_preview) {
        setGeneratedImages([data.generated_preview]);
      }

      setLoading(false);
    };

    loadApplication();
  }, [id, navigate]);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header applicationId={applicationId} />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero section - only on UPLOAD without image */}
          {currentStep === AppStep.UPLOAD && !config.imagePreview && (
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-4">
                Создайте <span className="text-gradient-gold">уникальное</span>
                <br />
                украшение
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Превратите ваш рисунок или фотографию в эксклюзивное ювелирное
                изделие ручной работы
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
                onNext={() => transitionTo(AppStep.CHECKOUT)}
                onBack={() => transitionTo(AppStep.UPLOAD)}
              />
            )}

            {currentStep === AppStep.CHECKOUT && (
              <StepCheckout
                config={config}
                onConfigChange={handleConfigChange}
                onBack={() => transitionTo(AppStep.SELECTION)}
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
  );
};

export default Application;
