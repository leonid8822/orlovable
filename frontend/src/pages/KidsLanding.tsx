import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BeforeAfterShowcase } from "@/components/BeforeAfterShowcase";
import { LandingConstructor } from "@/components/LandingConstructor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Heart,
  Gem,
  Star,
  Gift,
  Camera
} from "lucide-react";

// Fallback примеры для детских рисунков
const fallbackKidsExamples = [
  {
    before: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop",
    title: "Рисунок солнышка → Кулон для бабушки"
  },
  {
    before: "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop",
    title: "Семейный портрет → Памятный кулон"
  },
  {
    before: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
    title: "Любимый персонаж → Украшение на память"
  }
];

const scrollToConstructor = () => {
  document.getElementById('constructor')?.scrollIntoView({ behavior: 'smooth' });
};

const KidsLanding = () => {
  const tiffanyColor = "hsl(174, 58%, 38%)";
  const tiffanyLightColor = "hsl(174, 58%, 50%)";
  const [examples, setExamples] = useState(fallbackKidsExamples);
  const [isLoadingExamples, setIsLoadingExamples] = useState(true);

  useEffect(() => {
    const fetchExamples = async () => {
      setIsLoadingExamples(true);
      try {
        const { data, error } = await supabase
          .from('examples')
          .select('*')
          .eq('is_active', true)
          .eq('theme', 'kids')
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
    <div className="min-h-screen bg-background theme-kids">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Desktop: side by side, Mobile: stacked */}
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Text content */}
              <div className="flex-1 text-center lg:text-left animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ backgroundColor: 'hsl(174, 58%, 38%, 0.1)', borderColor: 'hsl(174, 58%, 38%, 0.2)' }}>
                  <span className="text-sm" style={{ color: tiffanyColor }}>Детские рисунки в украшениях</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-6 leading-tight">
                  Сохраните <span className="text-gradient-tiffany">детское творчество</span>
                  <br />навсегда
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-xl lg:max-w-none mb-10">
                  Превратите рисунок вашего ребёнка в ювелирное украшение —
                  драгоценный артефакт, который можно носить с собой
                </p>

                <Button
                  size="lg"
                  onClick={scrollToConstructor}
                  className="text-primary-foreground hover:opacity-90 px-10"
                  style={{ background: 'linear-gradient(135deg, hsl(174, 58%, 45%) 0%, hsl(174, 58%, 32%) 100%)', boxShadow: '0 0 50px hsl(174, 58%, 38%, 0.3)' }}
                >
                  Создать украшение
                  <Heart className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Video - vertical format */}
              <div className="w-full lg:w-auto lg:flex-shrink-0">
                <div className="relative rounded-2xl overflow-hidden border-2 mx-auto" style={{ borderColor: 'hsl(174, 58%, 38%, 0.3)', maxWidth: '320px' }}>
                  <div className="absolute -inset-1 rounded-2xl blur-xl" style={{ background: 'hsl(174, 58%, 38%, 0.2)' }} />
                  <div className="relative bg-gradient-card" style={{ aspectRatio: '9/16' }}>
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src="/olai_kids_main_2.mp4" type="video/mp4" />
                    </video>
                  </div>
                </div>
              </div>
            </div>

            {/* Before/After Showcase */}
            <div className="mt-16 max-w-2xl mx-auto">
              <BeforeAfterShowcase examples={examples} accentColor="tiffany" isLoading={isLoadingExamples} />
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="py-20 px-4 bg-card/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Почему <span className="text-gradient-tiffany">это важно</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Детские рисунки — это больше, чем просто картинки
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:transition-colors" style={{ borderColor: 'hsl(174, 58%, 38%, 0.3)' }}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(174, 58%, 38%, 0.2)' }}>
                  <Star className="w-8 h-8" style={{ color: tiffanyColor }} />
                </div>
                <h3 className="text-xl font-display mb-3">Уникальность момента</h3>
                <p className="text-muted-foreground">
                  Каждый рисунок отражает возраст, настроение и мир ребёнка именно в этот момент
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:transition-colors" style={{ borderColor: 'hsl(174, 58%, 38%, 0.3)' }}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(174, 58%, 38%, 0.2)' }}>
                  <Heart className="w-8 h-8" style={{ color: tiffanyColor }} />
                </div>
                <h3 className="text-xl font-display mb-3">Эмоциональная связь</h3>
                <p className="text-muted-foreground">
                  Украшение с рисунком — это физическое воплощение любви и заботы
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:transition-colors" style={{ borderColor: 'hsl(174, 58%, 38%, 0.3)' }}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(174, 58%, 38%, 0.2)' }}>
                  <Gem className="w-8 h-8" style={{ color: tiffanyColor }} />
                </div>
                <h3 className="text-xl font-display mb-3">Долгая память</h3>
                <p className="text-muted-foreground">
                  Бумажные рисунки теряются, а украшение остаётся на годы
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Как <span className="text-gradient-tiffany">создать</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold" style={{ background: tiffanyColor }}>
                  1
                </div>
                <div className="p-6 pt-8 rounded-2xl bg-gradient-card border border-border/50">
                  <Camera className="w-10 h-10 mb-4" style={{ color: tiffanyColor }} />
                  <h3 className="text-lg font-display mb-2">Сфотографируйте рисунок</h3>
                  <p className="text-sm text-muted-foreground">
                    Подойдёт любой рисунок — карандашом, красками, фломастерами
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold" style={{ background: tiffanyColor }}>
                  2
                </div>
                <div className="p-6 pt-8 rounded-2xl bg-gradient-card border border-border/50">
                  <Sparkles className="w-10 h-10 mb-4" style={{ color: tiffanyColor }} />
                  <h3 className="text-lg font-display mb-2">Выберите форму и материал</h3>
                  <p className="text-sm text-muted-foreground">
                    Круглый кулон или по контуру рисунка, серебро или позолота
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold" style={{ background: tiffanyColor }}>
                  3
                </div>
                <div className="p-6 pt-8 rounded-2xl bg-gradient-card border border-border/50">
                  <Gift className="w-10 h-10 mb-4" style={{ color: tiffanyColor }} />
                  <h3 className="text-lg font-display mb-2">Получите украшение</h3>
                  <p className="text-sm text-muted-foreground">
                    Мы создадим изделие вручную и бережно доставим
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-20 px-4 bg-card/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Идеи для <span className="text-gradient-tiffany">подарка</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:transition-all" style={{ borderColor: 'hsl(174, 58%, 38%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Для мамы или бабушки</h3>
                <p className="text-sm text-muted-foreground">
                  Кулон с рисунком внука — самый трогательный подарок на любой праздник
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:transition-all" style={{ borderColor: 'hsl(174, 58%, 38%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Для папы</h3>
                <p className="text-sm text-muted-foreground">
                  Брелок или кулон с первым рисунком ребёнка — на память навсегда
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:transition-all" style={{ borderColor: 'hsl(174, 58%, 38%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Для самого ребёнка</h3>
                <p className="text-sm text-muted-foreground">
                  Когда вырастет — увидит своё детское творчество в драгоценном металле
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:transition-all" style={{ borderColor: 'hsl(174, 58%, 38%, 0.2)' }}>
                <h3 className="text-lg font-display mb-2">Для воспитателя или учителя</h3>
                <p className="text-sm text-muted-foreground">
                  Особенный подарок от группы или класса с коллективным рисунком
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Constructor Section */}
        <LandingConstructor theme="kids" />
      </main>

      <Footer />
    </div>
  );
};

export default KidsLanding;
