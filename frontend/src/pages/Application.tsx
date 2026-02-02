import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { StepUpload } from "@/components/steps/StepUpload";
import { StepGenerating } from "@/components/steps/StepGenerating";
import { StepSelection } from "@/components/steps/StepSelection";
import { StepGems } from "@/components/steps/StepGems";
import { StepEngraving } from "@/components/steps/StepEngraving";
import { StepCheckout } from "@/components/steps/StepCheckout";
import { StepConfirmation } from "@/components/steps/StepConfirmation";
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

/// State machine: valid transitions
// New flow: UPLOAD → GENERATING → SELECTION → CHECKOUT → CONFIRMATION → [GEMS upsell]
// GEMS is optional upsell step accessible from CONFIRMATION
// ENGRAVING is integrated into CHECKOUT or removed
const VALID_TRANSITIONS: Record<AppStep, AppStep[]> = {
  [AppStep.UPLOAD]: [AppStep.GENERATING],
  [AppStep.GENERATING]: [AppStep.SELECTION, AppStep.UPLOAD], // UPLOAD on error
  [AppStep.SELECTION]: [AppStep.UPLOAD, AppStep.GENERATING, AppStep.CHECKOUT],
  [AppStep.CHECKOUT]: [AppStep.SELECTION, AppStep.CONFIRMATION],
  [AppStep.GEMS]: [AppStep.CONFIRMATION], // After gems, go back to confirmation
  [AppStep.ENGRAVING]: [AppStep.CHECKOUT], // Legacy: redirect to checkout
  [AppStep.CONFIRMATION]: [AppStep.GEMS], // Can add gems from confirmation
};

const Application = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [config, setConfig] = useState<PendantConfig>(initialPendantConfig);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(true);
  const [appTheme, setAppTheme] = useState<AppTheme>("main");
  const [paymentInfo, setPaymentInfo] = useState<{ amount: number; orderId: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{ email?: string; name?: string }>({});

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.userId || user.id) {
            const { data } = await api.checkAdminStatus(user.userId || user.id);
            setIsAdmin(data?.is_admin || false);
          }
        } catch {
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, []);

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
          } else if (nextStep === AppStep.CONFIRMATION) {
            updates.status = "completed"; // Order completed (payment is separate)
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
        if ("orderComment" in updates)
          dbUpdates.order_comment = updates.orderComment;
        // New fields for gems and engraving
        if ("gems" in updates)
          dbUpdates.gems = updates.gems;
        if ("backEngraving" in updates)
          dbUpdates.back_engraving = updates.backEngraving;
        if ("hasBackEngraving" in updates)
          dbUpdates.has_back_engraving = updates.hasBackEngraving;

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

      // Check if user is logged in and get their ID
      let userId: string | undefined;
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userId = user.id || user.userId;
        } catch {
          // Ignore parse errors
        }
      }

      const { data: newApp, error } = await api.createApplication({
        session_id: sessionId,
        user_id: userId,
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
      const validThemes: AppTheme[] = ["main", "kids", "totems", "custom"];
      if (validThemes.includes(currentTheme as AppTheme)) {
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
    (images: string[], thumbnails: string[], userAuth?: UserAuthData) => {
      setGeneratedImages(images);
      setConfig((prev) => ({
        ...prev,
        generatedImages: images,
        generatedThumbnails: thumbnails,
        selectedVariantIndex: 0,
        generatedPreview: images[0] || null,
        userAuth: userAuth || prev.userAuth,
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

  // Payment success handler
  const handlePaymentSuccess = useCallback((amount: number, orderId: string) => {
    setPaymentInfo({ amount, orderId });
    transitionTo(AppStep.CONFIRMATION);
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

      // Check if we're returning from payment
      const confirmStep = searchParams.get("step");
      const orderId = searchParams.get("order");

      // Determine step based on status
      let determinedStep: AppStep;

      if (confirmStep === "confirmation" || data.status === "completed" || data.status === "paid") {
        determinedStep = AppStep.CONFIRMATION;
        // Try to get payment info
        if (orderId) {
          const { data: paymentData } = await api.getPaymentStatus(orderId);
          if (paymentData) {
            setPaymentInfo({ amount: paymentData.amount, orderId });
          }
        }
      } else {
        switch (data.status) {
          case "generating":
            determinedStep = AppStep.GENERATING;
            break;
          case "checkout":
          case "pending_payment":
          case "pending_order":
            determinedStep = AppStep.CHECKOUT;
            break;
          case "generated":
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
            determinedStep = AppStep.UPLOAD;
        }
      }

      setCurrentStep(determinedStep);

      // Set theme from URL param, application, or localStorage
      const urlTheme = searchParams.get("theme") as AppTheme;
      const savedTheme = data.theme as AppTheme;
      const validThemes: AppTheme[] = ["main", "kids", "totems", "custom"];

      if (urlTheme && validThemes.includes(urlTheme)) {
        setAppTheme(urlTheme);
      } else if (savedTheme && validThemes.includes(savedTheme)) {
        setAppTheme(savedTheme);
      } else {
        // Fallback to localStorage for old applications without theme
        const localTheme = localStorage.getItem("appTheme") as AppTheme;
        if (localTheme && validThemes.includes(localTheme)) {
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
        orderComment: data.order_comment || "",
        generatedImages: allGeneratedImages,
        selectedVariantIndex: selectedIndex,
        // Gems and engraving
        gems: data.gems || [],
        backEngraving: data.back_engraving || "",
        hasBackEngraving: data.has_back_engraving || false,
      });

      // Set generated images for selection step
      setGeneratedImages(allGeneratedImages);

      // Set customer info for payments
      setCustomerInfo({
        email: data.customer_email,
        name: data.customer_name,
      });

      setLoading(false);
    };

    loadApplication();
  }, [id, navigate, searchParams]);

  // Get theme-specific classes
  const themeClass = appTheme === "kids" ? "theme-kids" : appTheme === "totems" ? "theme-totems" : appTheme === "custom" ? "theme-custom" : "";

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
        <Header applicationId={applicationId} minimal={true} theme={appTheme} userName={customerInfo.name} />

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

          {/* Step indicator - hide on CONFIRMATION */}
          {currentStep !== AppStep.CONFIRMATION && (
            <div className="mb-12">
              <StepIndicator currentStep={currentStep} />
            </div>
          )}

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
                theme={appTheme}
                objectDescription={searchParams.get("objectDescription") || undefined}
              />
            )}

            {currentStep === AppStep.SELECTION && (
              <StepSelection
                config={config}
                generatedImages={generatedImages}
                generatedThumbnails={config.generatedThumbnails}
                onSelectVariant={handleSelectVariant}
                onRegenerate={handleRegenerate}
                onNext={() => {
                  // New flow: always go to CHECKOUT after selection
                  transitionTo(AppStep.CHECKOUT);
                }}
                onBack={() => transitionTo(AppStep.UPLOAD)}
              />
            )}

            {currentStep === AppStep.GEMS && (
              <StepGems
                config={config}
                onConfigChange={handleConfigChange}
                onNext={() => {
                  // After adding gems, go back to confirmation
                  transitionTo(AppStep.CONFIRMATION);
                }}
                onBack={() => transitionTo(AppStep.CONFIRMATION)}
                onSkip={() => {
                  // Skip gems and go back to confirmation
                  transitionTo(AppStep.CONFIRMATION);
                }}
              />
            )}

            {currentStep === AppStep.ENGRAVING && (
              <StepEngraving
                config={config}
                onConfigChange={handleConfigChange}
                onNext={() => transitionTo(AppStep.CHECKOUT)}
                onBack={() => isAdmin ? transitionTo(AppStep.GEMS) : transitionTo(AppStep.SELECTION)}
                onSkip={() => transitionTo(AppStep.CHECKOUT)}
              />
            )}

            {currentStep === AppStep.CHECKOUT && (
              <StepCheckout
                config={config}
                onConfigChange={handleConfigChange}
                onBack={() => {
                  // New flow: always go back to selection
                  transitionTo(AppStep.SELECTION);
                }}
                onOrderSuccess={() => {
                  // New flow: after checkout, offer gems as upsell (optional)
                  // For now, go directly to confirmation
                  // TODO: Add gems upsell option in StepCheckout
                  transitionTo(AppStep.CONFIRMATION);
                }}
                onAddGems={() => transitionTo(AppStep.GEMS)}
                applicationId={applicationId || undefined}
              />
            )}

            {currentStep === AppStep.CONFIRMATION && applicationId && (
              <StepConfirmation
                config={config}
                applicationId={applicationId!}
                paymentAmount={paymentInfo?.amount}
                totalPaid={paymentInfo?.amount || 0}
                orderId={paymentInfo?.orderId}
                userEmail={customerInfo.email}
                userName={customerInfo.name}
                onConfigChange={handleConfigChange}
                onAddGems={() => transitionTo(AppStep.GEMS)}
              />
            )}
          </div>
        </div>
      </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; 2025-2026 OLAI.art. Все права защищены.</p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Application;
