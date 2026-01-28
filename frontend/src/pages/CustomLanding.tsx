import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ImageUploader } from "@/components/ImageUploader";
import { api } from "@/lib/api";
import {
  Sparkles,
  Box,
  Wand2,
  ChevronRight,
  Loader2
} from "lucide-react";

const scrollToConstructor = () => {
  document.getElementById('constructor')?.scrollIntoView({ behavior: 'smooth' });
};

const CustomLanding = () => {
  const navigate = useNavigate();
  const purpleColor = "hsl(270, 50%, 45%)";
  const purpleLightColor = "hsl(270, 55%, 55%)";

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [objectDescription, setObjectDescription] = useState("");
  const [userComment, setUserComment] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Handle file selection - convert File to base64 string
  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClear = () => {
    setUploadedImage(null);
  };

  const handleCreateJewelry = async () => {
    if (!uploadedImage) return;

    setIsCreating(true);
    try {
      // Create application with custom theme
      const { data: app, error } = await api.createApplication({
        form_factor: 'contour', // Custom forms use contour by default
        material: 'silver',
        size: 'm',
        input_image_url: uploadedImage,
        user_comment: `Объект: ${objectDescription}\n${userComment}`.trim(),
        theme: 'custom',
      });

      if (error) {
        console.error("Error creating application:", error);
        return;
      }

      if (app?.id) {
        navigate(`/application/${app.id}?theme=custom&objectDescription=${encodeURIComponent(objectDescription)}`);
      }
    } catch (error) {
      console.error("Error creating application:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background theme-custom">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ backgroundColor: 'hsl(270, 50%, 45%, 0.1)', borderColor: 'hsl(270, 50%, 45%, 0.2)' }}>
                <Box className="w-4 h-4" style={{ color: purpleColor }} />
                <span className="text-sm" style={{ color: purpleColor }}>Произвольная 3D форма</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-6 leading-tight">
                Превратите <span style={{ background: `linear-gradient(135deg, ${purpleLightColor}, ${purpleColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>любой объект</span>
                <br />в украшение
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Загрузите фото с 3D объектом — мы превратим его в ювелирный кулон.
                Игрушка, статуэтка, любимая вещь — всё станет украшением.
              </p>

              <Button
                size="lg"
                onClick={scrollToConstructor}
                className="text-primary-foreground hover:opacity-90 px-10"
                style={{ background: `linear-gradient(135deg, ${purpleLightColor} 0%, ${purpleColor} 100%)`, boxShadow: '0 0 50px hsl(270, 50%, 45%, 0.3)' }}
              >
                Создать украшение
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4 bg-card/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Как это <span style={{ background: `linear-gradient(135deg, ${purpleLightColor}, ${purpleColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>работает</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold" style={{ background: purpleColor }}>
                  1
                </div>
                <div className="p-6 pt-8 rounded-2xl bg-gradient-card border border-border/50">
                  <Box className="w-10 h-10 mb-4" style={{ color: purpleColor }} />
                  <h3 className="text-lg font-display mb-2">Сфотографируйте объект</h3>
                  <p className="text-sm text-muted-foreground">
                    Игрушка, статуэтка, сувенир — любой 3D объект на чётком фото
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold" style={{ background: purpleColor }}>
                  2
                </div>
                <div className="p-6 pt-8 rounded-2xl bg-gradient-card border border-border/50">
                  <Wand2 className="w-10 h-10 mb-4" style={{ color: purpleColor }} />
                  <h3 className="text-lg font-display mb-2">Опишите что взять</h3>
                  <p className="text-sm text-muted-foreground">
                    Укажите какой именно объект на фото превратить в украшение
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold" style={{ background: purpleColor }}>
                  3
                </div>
                <div className="p-6 pt-8 rounded-2xl bg-gradient-card border border-border/50">
                  <Sparkles className="w-10 h-10 mb-4" style={{ color: purpleColor }} />
                  <h3 className="text-lg font-display mb-2">Получите кулон</h3>
                  <p className="text-sm text-muted-foreground">
                    AI создаст превью, а мы изготовим украшение из серебра
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Constructor Section */}
        <section id="constructor" className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Создайте <span style={{ background: `linear-gradient(135deg, ${purpleLightColor}, ${purpleColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>своё украшение</span>
              </h2>
              <p className="text-muted-foreground">
                Загрузите фото и опишите какой объект превратить в кулон
              </p>
            </div>

            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50" style={{ borderColor: 'hsl(270, 50%, 45%, 0.2)' }}>
              {/* Image upload */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">
                  Фото с 3D объектом
                </label>
                <ImageUploader
                  imagePreview={uploadedImage}
                  onImageSelect={handleImageSelect}
                  onImageClear={handleImageClear}
                  label="Загрузите фото с объектом"
                  hint="PNG, JPG до 10MB"
                />
              </div>

              {/* Object description */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Какой объект на фото превратить в украшение? *
                </label>
                <Textarea
                  placeholder="Например: маленькая фигурка слона на полке, красная машинка на столе, статуэтка кота..."
                  value={objectDescription}
                  onChange={(e) => setObjectDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                  style={{ borderColor: objectDescription ? 'hsl(270, 50%, 45%, 0.3)' : undefined }}
                />
              </div>

              {/* Additional comments */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">
                  Дополнительные пожелания (опционально)
                </label>
                <Textarea
                  placeholder="Особые детали, стиль, пожелания по форме..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>

              {/* Create button */}
              <Button
                size="lg"
                onClick={handleCreateJewelry}
                disabled={!uploadedImage || !objectDescription.trim() || isCreating}
                className="w-full text-primary-foreground hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${purpleLightColor} 0%, ${purpleColor} 100%)` }}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Создаём...
                  </>
                ) : (
                  <>
                    Создать украшение
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {!uploadedImage && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Загрузите фото чтобы продолжить
                </p>
              )}
              {uploadedImage && !objectDescription.trim() && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Опишите какой объект на фото вы хотите превратить в украшение
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Ideas section */}
        <section className="py-20 px-4 bg-card/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Что можно <span style={{ background: `linear-gradient(135deg, ${purpleLightColor}, ${purpleColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>превратить</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(270, 50%, 45%, 0.15)' }}>
                <h3 className="text-lg font-display mb-2">Детские игрушки</h3>
                <p className="text-sm text-muted-foreground">
                  Любимая фигурка ребёнка станет памятным украшением
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(270, 50%, 45%, 0.15)' }}>
                <h3 className="text-lg font-display mb-2">Статуэтки и сувениры</h3>
                <p className="text-sm text-muted-foreground">
                  Памятные вещи из путешествий в миниатюре
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(270, 50%, 45%, 0.15)' }}>
                <h3 className="text-lg font-display mb-2">Коллекционные фигурки</h3>
                <p className="text-sm text-muted-foreground">
                  Персонажи из игр, фильмов, аниме
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(270, 50%, 45%, 0.15)' }}>
                <h3 className="text-lg font-display mb-2">Ювелирные изделия</h3>
                <p className="text-sm text-muted-foreground">
                  Повторить любимое украшение в другом размере
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(270, 50%, 45%, 0.15)' }}>
                <h3 className="text-lg font-display mb-2">Элементы декора</h3>
                <p className="text-sm text-muted-foreground">
                  Интерьерные детали в миниатюрном украшении
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(270, 50%, 45%, 0.15)' }}>
                <h3 className="text-lg font-display mb-2">Любой 3D объект</h3>
                <p className="text-sm text-muted-foreground">
                  Если можно сфотографировать — можно превратить в кулон
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CustomLanding;
