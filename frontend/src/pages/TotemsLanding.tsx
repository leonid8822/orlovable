import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BeforeAfterShowcase } from "@/components/BeforeAfterShowcase";
import { LandingConstructor } from "@/components/LandingConstructor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Compass,
  Mountain,
  Moon,
  Feather
} from "lucide-react";

// Fallback примеры для тотемов
const fallbackTotemExamples = [
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

const scrollToConstructor = () => {
  document.getElementById('constructor')?.scrollIntoView({ behavior: 'smooth' });
};

const TotemsLanding = () => {
  const brownColor = "hsl(25, 45%, 35%)";
  const brownLightColor = "hsl(25, 50%, 45%)";
  const [examples, setExamples] = useState(fallbackTotemExamples);
  const [isLoadingExamples, setIsLoadingExamples] = useState(true);

  useEffect(() => {
    const fetchExamples = async () => {
      setIsLoadingExamples(true);
      try {
        const { data, error } = await supabase
          .from('examples')
          .select('*')
          .eq('is_active', true)
          .eq('theme', 'totems')
          .order('display_order', { ascending: true })
          .limit(5);

        if (!error && data && data.length > 0) {
          const formatted = data
            .filter(e => e.after_image_url) // Only require after_image
            .map(e => ({
              before: e.before_image_url || '', // Can be empty
              after: e.after_image_url!,
              title: e.description || e.title || ''
            }));
          if (formatted.length > 0) {
            setExamples(formatted);
          }
        }
      } finally {
        setIsLoadingExamples(false);
      }
    };
    fetchExamples();
  }, []);

  return (
    <div className="min-h-screen bg-background theme-totems">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center animate-fade-in">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-6 leading-tight">
                Создайте свой <span className="text-gradient-brown">тотем</span>
                <br />в украшении
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Превратите значимое животное, руну или символ
                в ювелирный артефакт силы
              </p>

              <Button
                size="lg"
                onClick={scrollToConstructor}
                className="text-primary-foreground hover:opacity-90 px-10"
                style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)`, boxShadow: '0 0 50px hsl(25, 45%, 35%, 0.3)' }}
              >
                Создать тотем
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Before/After Showcase */}
            <div className="max-w-2xl mx-auto mt-16">
              <BeforeAfterShowcase examples={examples} accentColor="brown" isLoading={isLoadingExamples} />
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
                <h3 className="text-xl font-display mb-3">Символы и знаки</h3>
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
                В любой традиции тотем — это не просто украшение.
                Это связь с силой природы, богов, предков и внутренним "я".
                Носите свои символы как напоминание о том, кем вы являетесь.
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

        {/* Constructor Section */}
        <LandingConstructor theme="totems" className="bg-card/30" />
      </main>

      <Footer />
    </div>
  );
};

export default TotemsLanding;
