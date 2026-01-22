import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BeforeAfterShowcase } from "@/components/BeforeAfterShowcase";
import { LandingConstructor } from "@/components/LandingConstructor";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Heart,
  Gift,
  ArrowRight,
  Star,
  Users,
  Palette,
  Gem
} from "lucide-react";

// Fallback примеры если база пустая
const fallbackExamples = [
  {
    before: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
    title: "Абстрактный рисунок → Серебряный кулон"
  },
  {
    before: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop",
    title: "Художественный эскиз → Золотой кулон"
  },
  {
    before: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=400&fit=crop",
    after: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
    title: "Любимый символ → Уникальное украшение"
  }
];

const scrollToConstructor = () => {
  document.getElementById('constructor')?.scrollIntoView({ behavior: 'smooth' });
};

const Landing = () => {
  const [examples, setExamples] = useState(fallbackExamples);

  useEffect(() => {
    const fetchExamples = async () => {
      const { data, error } = await supabase
        .from('examples')
        .select('*')
        .eq('is_active', true)
        .or('theme.eq.main,theme.is.null')
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
    };
    fetchExamples();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-sm text-gold">Превращаем смыслы в артефакты</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display mb-6 leading-tight">
                Ваши <span className="text-gradient-gold">смыслы</span>
                <br />в ювелирных украшениях
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Создайте уникальный кулон из любого изображения —
                для себя, близких или в подарок друзьям
              </p>

              <Button
                size="lg"
                onClick={scrollToConstructor}
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold px-10"
              >
                Создать украшение
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Before/After Showcase */}
            <div className="mt-16 max-w-2xl mx-auto">
              <BeforeAfterShowcase examples={examples} accentColor="gold" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-card/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Как это <span className="text-gradient-gold">работает</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Три простых шага от идеи до уникального украшения
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-gold/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-gold/20 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-display mb-3">1. Загрузите изображение</h3>
                <p className="text-muted-foreground">
                  Рисунок, фото, символ — всё, что несёт для вас смысл
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-gold/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-gold/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-display mb-3">2. Выберите форму</h3>
                <p className="text-muted-foreground">
                  Круглый кулон или по контуру изображения, серебро или золото
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-gold/30 transition-colors">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-gold/20 flex items-center justify-center">
                  <Gem className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-display mb-3">3. Получите артефакт</h3>
                <p className="text-muted-foreground">
                  Мы создадим украшение ручной работы и доставим вам
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Для кого <span className="text-gradient-gold">создавать</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-gold/30 transition-all hover:shadow-gold/10 hover:shadow-lg">
                <Heart className="w-10 h-10 text-gold mb-4" />
                <h3 className="text-lg font-display mb-2">Для себя</h3>
                <p className="text-sm text-muted-foreground">
                  Сохраните важный момент или символ в физическом артефакте
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-gold/30 transition-all hover:shadow-gold/10 hover:shadow-lg">
                <Users className="w-10 h-10 text-gold mb-4" />
                <h3 className="text-lg font-display mb-2">Для близких</h3>
                <p className="text-sm text-muted-foreground">
                  Подарите родителям украшение с рисунком внука или семейным символом
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-gold/30 transition-all hover:shadow-gold/10 hover:shadow-lg">
                <Gift className="w-10 h-10 text-gold mb-4" />
                <h3 className="text-lg font-display mb-2">В подарок друзьям</h3>
                <p className="text-sm text-muted-foreground">
                  Уникальный подарок с общим воспоминанием или шуткой
                </p>
              </div>
            </div>

            {/* Kids promo block */}
            <div className="mt-12 p-8 rounded-2xl bg-gradient-card border border-border/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ background: 'hsl(174, 58%, 38%, 0.1)' }} />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'hsl(174, 58%, 38%, 0.2)', borderWidth: '1px', borderColor: 'hsl(174, 58%, 38%, 0.3)' }}>
                    <Star className="w-4 h-4" style={{ color: 'hsl(174, 58%, 50%)' }} />
                    <span className="text-sm" style={{ color: 'hsl(174, 58%, 50%)' }}>Для родителей</span>
                  </div>
                  <h3 className="text-2xl font-display mb-2">Детские рисунки в украшениях</h3>
                  <p className="text-muted-foreground max-w-lg">
                    Превратите творчество вашего ребёнка в драгоценный артефакт, который можно носить с собой
                  </p>
                </div>
                <Link to="/kids">
                  <Button variant="outline" className="whitespace-nowrap" style={{ borderColor: 'hsl(174, 58%, 38%, 0.5)', color: 'hsl(174, 58%, 45%)' }}>
                    Узнать больше
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Constructor Section */}
        <LandingConstructor theme="main" className="bg-card/30" />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
