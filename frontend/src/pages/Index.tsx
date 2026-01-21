import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { StepUpload } from "@/components/steps/StepUpload";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";
import {
  AppStep,
  PendantConfig,
  initialPendantConfig,
} from "@/types/pendant";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PendantConfig>(initialPendantConfig);

  const handleConfigChange = (updates: Partial<PendantConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // When generation starts, create application and redirect
  const handleStartGeneration = async () => {
    if (!config.imagePreview) {
      toast.error("Пожалуйста, загрузите изображение");
      return;
    }

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

    // Redirect to application page where generation will start
    navigate(`/application/${newApp.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-4">
              Создайте <span className="text-gradient-gold">уникальное</span>
              <br />
              украшение
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Превратите ваш рисунок или фотографию в эксклюзивное ювелирное
              изделие ручной работы
            </p>
            <Link to="/examples">
              <Button
                variant="outline"
                className="border-gold/50 text-gold hover:bg-gold/10"
              >
                <Images className="w-4 h-4 mr-2" />
                Посмотреть примеры работ
              </Button>
            </Link>
          </div>

          {/* Step indicator */}
          <div className="mb-12">
            <StepIndicator currentStep={AppStep.UPLOAD} />
          </div>

          {/* Step content */}
          <div className="min-h-[500px]">
            <StepUpload
              config={config}
              onConfigChange={handleConfigChange}
              onStartGeneration={handleStartGeneration}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 OLAI.art. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
