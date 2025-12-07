import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Step1Upload } from "@/components/steps/Step1Upload";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";
import type { PendantConfig } from "@/types/pendant";
import { initialPendantConfig } from "@/types/pendant";

const TOTAL_STEPS = 4;

const Index = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PendantConfig>(initialPendantConfig);

  const handleConfigChange = (updates: Partial<PendantConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // When generation starts, redirect to application page
  const handleGenerationStart = (applicationId: string) => {
    navigate(`/application/${applicationId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-4">
              Создайте <span className="text-gradient-gold">уникальное</span>
              <br />украшение
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Превратите ваш рисунок или фотографию в эксклюзивное
              ювелирное изделие ручной работы
            </p>
            <Link to="/examples">
              <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                <Images className="w-4 h-4 mr-2" />
                Посмотреть примеры работ
              </Button>
            </Link>
          </div>

          {/* Step indicator */}
          <div className="mb-12">
            <StepIndicator currentStep={1} totalSteps={TOTAL_STEPS} />
          </div>

          {/* Step content */}
          <div className="min-h-[500px]">
            <Step1Upload
              config={config}
              onConfigChange={handleConfigChange}
              onNext={() => {}}
              onGenerationStart={handleGenerationStart}
            />
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

export default Index;
