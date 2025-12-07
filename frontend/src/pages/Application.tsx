import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Step1Upload } from "@/components/steps/Step1Upload";
import { Step2Configure } from "@/components/steps/Step2Configure";
import { Step3BackSide } from "@/components/steps/Step3BackSide";
import { Step4Checkout } from "@/components/steps/Step4Checkout";
import type { PendantConfig } from "@/types/pendant";
import { initialPendantConfig } from "@/types/pendant";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TOTAL_STEPS = 4;

const Application = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<PendantConfig>(initialPendantConfig);
  const [loading, setLoading] = useState(true);
  const [applicationId, setApplicationId] = useState<string | null>(id || null);
  const [shouldStartGeneration, setShouldStartGeneration] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('draft');

  // Load application data
  useEffect(() => {
    const loadApplication = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await api.getApplication(id);

      if (error || !data) {
        toast.error('Заявка не найдена');
        navigate('/');
        return;
      }

      setCurrentStep(data.current_step || 1);
      setConfig({
        ...initialPendantConfig,
        formFactor: data.form_factor as any || 'round',
        material: data.material as any || 'gold',
        size: data.size as any || 'pendant',
        imagePreview: data.input_image_url,
        generatedPreview: data.generated_preview,
        comment: data.user_comment || '',
        hasBackEngraving: data.has_back_engraving || false,
        backImagePreview: data.back_image_url,
        backComment: data.back_comment || '',
      });

      setApplicationStatus(data.status);

      // If status is pending_generation, we need to trigger generation
      if (data.status === 'pending_generation') {
        setShouldStartGeneration(true);
      }

      setLoading(false);
    };

    loadApplication();
  }, [id, navigate]);

  // Bind application to user after auth - TODO: Re-implement when Auth is available
  useEffect(() => {
    // For now, we just skip user binding as we rely on session_id or 'guest' mode
    // If we had a user system, we would check the current user and update the application
  }, [applicationId]);

  const handleConfigChange = async (updates: Partial<PendantConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));

    // Save to database if we have an application
    if (applicationId) {
      const dbUpdates: Record<string, any> = {};
      if ('formFactor' in updates) dbUpdates.form_factor = updates.formFactor;
      if ('material' in updates) dbUpdates.material = updates.material;
      if ('size' in updates) dbUpdates.size = updates.size;
      if ('comment' in updates) dbUpdates.user_comment = updates.comment;
      if ('generatedPreview' in updates) dbUpdates.generated_preview = updates.generatedPreview;
      if ('hasBackEngraving' in updates) dbUpdates.has_back_engraving = updates.hasBackEngraving;
      if ('backComment' in updates) dbUpdates.back_comment = updates.backComment;
      if ('imagePreview' in updates) dbUpdates.input_image_url = updates.imagePreview;
      if ('backImagePreview' in updates) dbUpdates.back_image_url = updates.backImagePreview;

      if (Object.keys(dbUpdates).length > 0) {
        await api.updateApplication(applicationId, dbUpdates);
      }
    }
  };

  const saveStep = async (step: number) => {
    if (applicationId) {
      await api.updateApplication(applicationId, { current_step: step });
    }
  };

  const nextStep = () => {
    const next = Math.min(currentStep + 1, TOTAL_STEPS);
    setCurrentStep(next);
    saveStep(next);
  };

  const prevStep = () => {
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    saveStep(prev);
  };

  // Handler for when generation starts - creates application and redirects
  const handleGenerationStart = async (generationApplicationId: string) => {
    setApplicationId(generationApplicationId);
    if (!id) {
      // Redirect to the application page
      navigate(`/application/${generationApplicationId}`, { replace: true });
    }
  };

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
          {/* Hero section - only on step 1 without generated preview */}
          {currentStep === 1 && !config.generatedPreview && (
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-4">
                Создайте <span className="text-gradient-gold">уникальное</span>
                <br />украшение
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Превратите ваш рисунок или фотографию в эксклюзивное
                ювелирное изделие ручной работы
              </p>
            </div>
          )}

          {/* Step indicator */}
          <div className="mb-12">
            <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>

          {/* Step content */}
          <div className="min-h-[500px]">
            {currentStep === 1 && (
              <Step1Upload
                config={config}
                onConfigChange={handleConfigChange}
                onNext={nextStep}
                applicationId={applicationId}
                onGenerationStart={handleGenerationStart}
                autoStartGeneration={shouldStartGeneration}
                onGenerationStarted={() => setShouldStartGeneration(false)}
                initialStatus={applicationStatus}
                onStatusChange={setApplicationStatus}
              />
            )}
            {currentStep === 2 && (
              <Step2Configure
                config={config}
                onConfigChange={handleConfigChange}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 3 && (
              <Step3BackSide
                config={config}
                onConfigChange={handleConfigChange}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 4 && (
              <Step4Checkout config={config} onBack={prevStep} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ArtisanJewel. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Application;
