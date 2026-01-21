import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BeforeAfterShowcase } from "@/components/BeforeAfterShowcase";
import { EagleIcon } from "@/components/icons/EagleIcon";
import {
  Sparkles,
  Shield,
  Compass,
  Gem,
  ArrowRight,
  Mountain,
  Moon,
  Feather,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Примеры до/после для тотемов
const totemExamples = [
  {
    before: "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
    title: "Волк-хранитель → Серебряный тотем"
  },
  {
    before: "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop",
    title: "Руна Одал → Кулон защиты"
  },
  {
    before: "https://images.unsplash.com/photo-1557401620-67270b4bb838?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
    title: "Ворон мудрости → Артефакт силы"
  }
];

const TotemsLanding = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const brownColor = "hsl(25, 45%, 35%)";
  const brownLightColor = "hsl(25, 50%, 45%)";

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

  const handleCreateTotem = async () => {
    if (!imagePreview) {
      toast.error("Загрузите изображение тотема");
      return;
    }

    setIsCreating(true);

    const sessionId = localStorage.getItem("sessionId") || crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
    localStorage.setItem("appTheme", "totems");

    const { data: newApp, error } = await api.createApplication({
      session_id: sessionId,
      form_factor: "round",
      material: "silver",
      size: "pendant",
      input_image_url: imagePreview,
      user_comment: "Тотем в скандинавском стиле",
    });

    if (error || !newApp) {
      toast.error("Не удалось создать заявку");
      setIsCreating(false);
      return;
    }

    navigate(`/application/${newApp.id}`);
  };

  return (
    <div className="min-h-screen bg-background theme-totems">
      {/* Custom Totems Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/totems" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-shadow duration-300" style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)`, boxShadow: `0 0 40px hsl(25, 45%, 35%, 0.25)` }}>
              <EagleIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl tracking-wide">
              <span className="text-muted-foreground">OLAI</span>
              <span style={{ color: brownColor }}>Totems</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                Главная
              </Link>
              <Link to="/kids" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                Kids
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ backgroundColor: 'hsl(25, 45%, 35%, 0.1)', borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <Shield className="w-4 h-4" style={{ color: brownColor }} />
                <span className="text-sm" style={{ color: brownColor }}>Скандинавский стиль</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-6 leading-tight">
                Создайте свой <span className="text-gradient-brown">тотем</span>
                <br />в украшении
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Превратите значимое животное, руну или символ
                в ювелирный артефакт силы
              </p>
            </div>

            {/* Upload Section - прямо на лендинге */}
            <div className="max-w-xl mx-auto mb-16">
              <div className="p-8 rounded-2xl bg-gradient-card border-2 border-dashed transition-colors" style={{ borderColor: imagePreview ? brownColor : 'hsl(25, 45%, 35%, 0.3)' }}>
                {!imagePreview ? (
                  <label className="flex flex-col items-center cursor-pointer">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'hsl(25, 45%, 35%, 0.1)' }}>
                      <Upload className="w-10 h-10" style={{ color: brownColor }} />
                    </div>
                    <p className="text-lg font-display mb-2">Загрузите изображение тотема</p>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Животное-хранитель, руна, сакральный символ
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline" style={{ borderColor: 'hsl(25, 45%, 35%, 0.5)', color: brownColor }}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Выбрать файл
                    </Button>
                  </label>
                ) : (
                  <div className="text-center">
                    <div className="relative w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden border-2" style={{ borderColor: brownColor }}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImagePreview(null)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background"
                      >
                        ×
                      </button>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleCreateTotem}
                      disabled={isCreating}
                      className="text-primary-foreground hover:opacity-90 px-8"
                      style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)`, boxShadow: '0 0 50px hsl(25, 45%, 35%, 0.3)' }}
                    >
                      {isCreating ? "Создаём..." : "Создать тотем"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Before/After Showcase */}
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-display text-center mb-8">
                Примеры <span className="text-gradient-brown">тотемов</span>
              </h3>
              <BeforeAfterShowcase examples={totemExamples} accentColor="brown" />
            </div>
          </div>
        </section>

        {/* Symbols Section */}
        <section className="py-20 px-4 bg-card/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Что можно <span className="text-gradient-brown">превратить</span> в тотем
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(25, 45%, 35%, 0.15)' }}>
                  <Feather className="w-8 h-8" style={{ color: brownColor }} />
                </div>
                <h3 className="text-xl font-display mb-3">Животные-хранители</h3>
                <p className="text-muted-foreground">
                  Волк, ворон, медведь, олень — ваше тотемное животное в металле
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(25, 45%, 35%, 0.15)' }}>
                  <Compass className="w-8 h-8" style={{ color: brownColor }} />
                </div>
                <h3 className="text-xl font-display mb-3">Руны и символы</h3>
                <p className="text-muted-foreground">
                  Руны Старшего Футарка, Вегвизир, узлы и орнаменты
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(25, 45%, 35%, 0.15)' }}>
                  <Mountain className="w-8 h-8" style={{ color: brownColor }} />
                </div>
                <h3 className="text-xl font-display mb-3">Мифологические образы</h3>
                <p className="text-muted-foreground">
                  Молот Тора, Иггдрасиль, драконы и змеи Мидгарда
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Moon className="w-12 h-12 mx-auto mb-6" style={{ color: brownColor }} />
              <h2 className="text-3xl md:text-4xl font-display mb-6">
                Сила <span className="text-gradient-brown">тотема</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                В северной традиции тотем — это не просто украшение.
                Это связь с силой природы, предков и внутренним "я".
                Носите свой символ как напоминание о том, кто вы есть.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Защита</h3>
                <p className="text-sm text-muted-foreground">
                  Тотем как оберег, связь с силой животного-хранителя
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Идентичность</h3>
                <p className="text-sm text-muted-foreground">
                  Символ ваших ценностей и внутренней природы
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Намерение</h3>
                <p className="text-sm text-muted-foreground">
                  Напоминание о целях и пути, который вы выбрали
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50" style={{ borderColor: 'hsl(25, 45%, 35%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Наследие</h3>
                <p className="text-sm text-muted-foreground">
                  Артефакт, который можно передать следующим поколениям
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-card/30">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-display mb-6">
              Найдите свой <span className="text-gradient-brown">тотем</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Загрузите изображение и превратите его в артефакт силы
            </p>
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-primary-foreground hover:opacity-90 px-10"
              style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)`, boxShadow: '0 0 50px hsl(25, 45%, 35%, 0.3)' }}
            >
              Создать тотем
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        {/* Other landings */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50">
                <h3 className="text-lg font-display mb-1">Из любых изображений</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Создавайте украшения из фото, рисунков и символов
                </p>
                <Link to="/">
                  <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                    На главную
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50">
                <h3 className="text-lg font-display mb-1">Детские рисунки</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Превратите творчество ребёнка в украшение
                </p>
                <Link to="/kids">
                  <Button variant="outline" style={{ borderColor: 'hsl(174, 58%, 38%, 0.5)', color: 'hsl(174, 58%, 38%)' }}>
                    OLAI Kids
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)` }}>
                <EagleIcon className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg">
                <span className="text-muted-foreground">OLAI</span>
                <span style={{ color: brownColor }}>Totems</span>
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
              <Link to="/kids" className="hover:text-foreground transition-colors">Kids</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 OLAI.art
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TotemsLanding;
