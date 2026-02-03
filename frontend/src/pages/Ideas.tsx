import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { ImageWithLoading } from "@/components/ui/image-with-loading";

interface Example {
  id: string;
  title: string;
  description: string | null;
  theme: string;
  before_image_url: string;
  after_image_url: string;
  display_order: number;
  is_active: boolean;
}

const THEME_LABELS: Record<string, string> = {
  main: "Классические украшения",
  kids: "Детские рисунки",
  totems: "Тотемы и символы",
  custom: "3D объекты",
};

const THEME_COLORS: Record<string, string> = {
  main: "hsl(43, 74%, 45%)", // gold
  kids: "hsl(174, 58%, 38%)", // tiffany
  totems: "hsl(25, 45%, 35%)", // brown
  custom: "hsl(270, 50%, 45%)", // purple
};

export default function Ideas() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamples();
  }, []);

  const loadExamples = async () => {
    try {
      const { data, error } = await api.getExamples();
      if (!error && data) {
        // Group and sort by theme and display_order
        const sorted = data.sort((a, b) => {
          if (a.theme !== b.theme) {
            const themeOrder = ["main", "kids", "totems", "custom"];
            return themeOrder.indexOf(a.theme) - themeOrder.indexOf(b.theme);
          }
          return a.display_order - b.display_order;
        });
        setExamples(sorted);
      }
    } catch (error) {
      console.error("Failed to load examples:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group examples by theme
  const examplesByTheme = examples.reduce((acc, example) => {
    if (!acc[example.theme]) {
      acc[example.theme] = [];
    }
    acc[example.theme].push(example);
    return acc;
  }, {} as Record<string, Example[]>);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display mb-4 bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
              Галерея идей
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Вдохновляйтесь примерами превращения рисунков и фотографий в уникальные ювелирные украшения
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(examplesByTheme).map(([theme, themeExamples]) => (
                <section key={theme} className="animate-fade-in">
                  {/* Theme header */}
                  <div className="mb-8">
                    <h2
                      className="text-3xl font-display mb-2"
                      style={{ color: THEME_COLORS[theme] || THEME_COLORS.main }}
                    >
                      {THEME_LABELS[theme] || theme}
                    </h2>
                    <div
                      className="h-1 w-24 rounded-full"
                      style={{ backgroundColor: THEME_COLORS[theme] || THEME_COLORS.main }}
                    />
                  </div>

                  {/* Examples grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {themeExamples.map((example) => (
                      <div
                        key={example.id}
                        className="group relative animate-scale-in"
                      >
                        {/* Before/After card */}
                        <div className="space-y-4">
                          {/* Before */}
                          <div className="relative">
                            <div
                              className="absolute -inset-1 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"
                              style={{ backgroundColor: THEME_COLORS[theme] || THEME_COLORS.main }}
                            />
                            <div className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-card">
                              {example.before_image_url ? (
                                <ImageWithLoading
                                  src={example.before_image_url}
                                  alt="До"
                                  size="thumbnail"
                                  className="w-full h-full object-cover"
                                  containerClassName="w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                                  <span className="text-muted-foreground text-sm">Нет изображения</span>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md text-xs font-medium">
                                До
                              </div>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex justify-center">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: THEME_COLORS[theme] || THEME_COLORS.main }}
                            >
                              <span className="text-xl">🪄</span>
                            </div>
                          </div>

                          {/* After */}
                          <div className="relative">
                            <div
                              className="absolute -inset-1 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"
                              style={{ backgroundColor: THEME_COLORS[theme] || THEME_COLORS.main }}
                            />
                            <div className="relative aspect-square rounded-xl overflow-hidden border-2 bg-card"
                              style={{ borderColor: THEME_COLORS[theme] || THEME_COLORS.main }}
                            >
                              <ImageWithLoading
                                src={example.after_image_url}
                                alt="После"
                                size="thumbnail"
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                              />
                              <div
                                className="absolute bottom-2 right-2 px-2 py-1 backdrop-blur-sm rounded-md text-xs font-medium text-white"
                                style={{ backgroundColor: `${THEME_COLORS[theme] || THEME_COLORS.main}CC` }}
                              >
                                Кулон
                              </div>
                            </div>
                          </div>

                          {/* Title/Description */}
                          {(example.title || example.description) && (
                            <div className="text-center pt-2">
                              {example.title && (
                                <h3 className="font-medium text-foreground mb-1">
                                  {example.title}
                                </h3>
                              )}
                              {example.description && (
                                <p className="text-sm text-muted-foreground">
                                  {example.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {examples.length === 0 && !loading && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Примеры скоро появятся</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
