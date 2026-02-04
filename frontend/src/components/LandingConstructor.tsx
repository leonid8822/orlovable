import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Image as ImageIcon,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Circle,
  RectangleVertical,
  Pentagon
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { FormFactor, FORM_CONFIG } from "@/types/pendant";
import { cn } from "@/lib/utils";

export type ThemeType = 'main' | 'kids' | 'totems';

interface ThemeConfig {
  primaryColor: string;
  lightColor: string;
  gradientStyle: string;
  shadowStyle: string;
  borderColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  uploadText: string;
  buttonText: string;
}

const THEME_CONFIGS: Record<ThemeType, ThemeConfig> = {
  main: {
    primaryColor: 'hsl(45, 93%, 47%)',
    lightColor: 'hsl(45, 93%, 58%)',
    gradientStyle: 'linear-gradient(135deg, hsl(45, 93%, 58%) 0%, hsl(45, 93%, 40%) 100%)',
    shadowStyle: '0 0 50px hsl(45, 93%, 47%, 0.3)',
    borderColor: 'hsl(45, 93%, 47%, 0.3)',
    bgColor: 'hsl(45, 93%, 47%, 0.1)',
    title: 'Создайте украшение',
    subtitle: 'Загрузите изображение и выберите форму',
    uploadText: 'Загрузите изображение',
    buttonText: 'Создать украшение'
  },
  kids: {
    primaryColor: 'hsl(174, 58%, 38%)',
    lightColor: 'hsl(174, 58%, 50%)',
    gradientStyle: 'linear-gradient(135deg, hsl(174, 58%, 45%) 0%, hsl(174, 58%, 32%) 100%)',
    shadowStyle: '0 0 50px hsl(174, 58%, 38%, 0.3)',
    borderColor: 'hsl(174, 58%, 38%, 0.3)',
    bgColor: 'hsl(174, 58%, 38%, 0.1)',
    title: 'Создайте украшение из рисунка',
    subtitle: 'Загрузите детский рисунок и выберите форму кулона',
    uploadText: 'Загрузите детский рисунок',
    buttonText: 'Создать украшение'
  },
  totems: {
    primaryColor: 'hsl(25, 45%, 35%)',
    lightColor: 'hsl(25, 50%, 45%)',
    gradientStyle: 'linear-gradient(135deg, hsl(25, 50%, 45%) 0%, hsl(25, 45%, 30%) 100%)',
    shadowStyle: '0 0 50px hsl(25, 45%, 35%, 0.3)',
    borderColor: 'hsl(25, 45%, 35%, 0.3)',
    bgColor: 'hsl(25, 45%, 35%, 0.1)',
    title: 'Создайте свой тотем',
    subtitle: 'Загрузите изображение тотема и выберите форму',
    uploadText: 'Загрузите изображение тотема',
    buttonText: 'Создать тотем'
  }
};

// Icons for form factors
const FORM_ICONS: Record<FormFactor, React.ReactNode> = {
  round: <Circle className="w-6 h-6" />,
  oval: <RectangleVertical className="w-6 h-6" />,
  contour: <Pentagon className="w-6 h-6" />
};

interface LandingConstructorProps {
  theme: ThemeType;
  className?: string;
}

export function LandingConstructor({ theme, className }: LandingConstructorProps) {
  const navigate = useNavigate();
  const config = THEME_CONFIGS[theme];

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormFactor>('round');
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleCreate = async () => {
    if (!imagePreview) {
      toast.error("Загрузите изображение");
      return;
    }

    setIsCreating(true);

    const sessionId = localStorage.getItem("sessionId") || crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
    localStorage.setItem("appTheme", theme);

    // Get user_id from localStorage if user is logged in
    let userId: string | null = null;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.userId || user.id || null;
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }

    // Default comment based on theme
    const defaultComment = theme === 'kids'
      ? 'Детский рисунок'
      : theme === 'totems'
        ? 'Тотем'
        : '';

    const { data: newApp, error } = await api.createApplication({
      session_id: sessionId,
      user_id: userId,
      form_factor: selectedForm,
      material: 'silver',
      size: 'pendant',
      input_image_url: imagePreview,
      user_comment: comment || defaultComment,
      theme: theme,
    });

    if (error || !newApp) {
      toast.error("Не удалось создать заявку");
      setIsCreating(false);
      return;
    }

    // Redirect to application with generation starting
    navigate(`/application/${newApp.id}`);
  };

  return (
    <section
      id="constructor"
      className={cn("py-20 px-4", className)}
    >
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display mb-4">
            {config.title}
          </h2>
          <p className="text-muted-foreground">
            {config.subtitle}
          </p>
        </div>

        <div
          className="p-8 rounded-2xl bg-gradient-card border border-border/50"
          style={{ borderColor: config.borderColor }}
        >
          {/* Image Upload */}
          <div className="mb-8">
            {!imagePreview ? (
              <label
                className="flex flex-col items-center cursor-pointer p-8 rounded-xl border-2 border-dashed transition-colors hover:border-opacity-70"
                style={{ borderColor: config.borderColor }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: config.bgColor }}
                >
                  <Upload className="w-8 h-8" style={{ color: config.primaryColor }} />
                </div>
                <p className="text-lg font-display mb-2">{config.uploadText}</p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Перетащите или выберите файл
                </p>
                <input
                  id={`landing-file-input-${theme}`}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  style={{ borderColor: config.borderColor, color: config.primaryColor }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`landing-file-input-${theme}`)?.click();
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Выбрать файл
                </Button>
              </label>
            ) : (
              <div className="text-center">
                <div
                  className="relative w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden border-2"
                  style={{ borderColor: config.primaryColor }}
                >
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Factor Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-3 text-center">Выберите форму</p>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(FORM_CONFIG) as FormFactor[]).map((form) => {
                const formConfig = FORM_CONFIG[form];
                const isSelected = selectedForm === form;

                return (
                  <button
                    key={form}
                    onClick={() => setSelectedForm(form)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      isSelected
                        ? "border-opacity-100"
                        : "border-border/50 hover:border-opacity-50"
                    )}
                    style={{
                      borderColor: isSelected ? config.primaryColor : undefined,
                      background: isSelected ? config.bgColor : undefined
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        color: isSelected ? config.primaryColor : 'currentColor',
                        opacity: isSelected ? 1 : 0.6
                      }}
                    >
                      {FORM_ICONS[form]}
                    </div>
                    <span className="text-sm font-medium">{formConfig.label}</span>
                    <span className="text-xs text-muted-foreground">{formConfig.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Comment */}
          <div className="mb-6">
            <button
              onClick={() => setShowComment(!showComment)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              {showComment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Добавить пожелания
            </button>

            {showComment && (
              <div className="mt-3">
                <Textarea
                  placeholder="Опишите ваши пожелания к украшению (необязательно)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={!imagePreview || isCreating}
            className="w-full text-primary-foreground hover:opacity-90"
            style={{
              background: config.gradientStyle,
              boxShadow: imagePreview ? config.shadowStyle : 'none',
              opacity: imagePreview ? 1 : 0.5
            }}
          >
            {isCreating ? "Создаём..." : config.buttonText}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default LandingConstructor;
