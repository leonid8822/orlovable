import { useState, useEffect, Suspense, lazy, Component, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ArrowRight, Box, Loader2, AlertCircle } from 'lucide-react';

interface Example {
  id: string;
  title: string | null;
  description: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  model_3d_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

// Error boundary for 3D viewer
interface ErrorBoundaryState {
  hasError: boolean;
}

class Model3DErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="w-8 h-8" />
          <span className="text-xs">Ошибка загрузки 3D</span>
        </div>
      );
    }
    return this.props.children;
  }
}

const Model3DViewer = lazy(() => import('./Model3DViewer'));

export function ExamplesShowcase() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModels, setActiveModels] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchExamples = async () => {
      const { data, error } = await supabase
        .from('examples')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setExamples(data);
      }
      setLoading(false);
    };

    fetchExamples();
  }, []);

  const toggleModel = (id: string) => {
    setActiveModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (examples.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Примеры работ пока не добавлены
      </div>
    );
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-display text-gradient-gold mb-3">
          Примеры работ
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Посмотрите, как рисунки и фотографии превращаются в уникальные ювелирные изделия
        </p>
      </div>

      <div className="space-y-8">
        {examples.map((example) => (
          <Card 
            key={example.id} 
            className="overflow-hidden bg-card/50 border-border/50"
          >
            <div className="p-6">
              {/* Title */}
              {example.title && (
                <h3 className="font-display text-xl text-primary mb-4">{example.title}</h3>
              )}
              
              {/* Transformation row */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 justify-center">
                {/* Before image */}
                <div className="w-full md:w-auto">
                  <div className="text-xs text-muted-foreground mb-2 text-center">Исходное изображение</div>
                  <div className="w-full md:w-[200px] aspect-square rounded-lg overflow-hidden bg-muted">
                    {example.before_image_url ? (
                      <img 
                        src={example.before_image_url} 
                        alt="До"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        —
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-primary">
                  <ArrowRight className="w-8 h-8 rotate-90 md:rotate-0" />
                </div>

                {/* After image */}
                <div className="w-full md:w-auto">
                  <div className="text-xs text-muted-foreground mb-2 text-center">Результат генерации</div>
                  <div className="w-full md:w-[200px] aspect-square rounded-lg overflow-hidden bg-muted">
                    {example.after_image_url ? (
                      <img 
                        src={example.after_image_url} 
                        alt="После"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        —
                      </div>
                    )}
                  </div>
                </div>

                {/* 3D Viewer - only if model exists */}
                {example.model_3d_url && (
                  <>
                    <div className="flex-shrink-0 text-primary">
                      <ArrowRight className="w-8 h-8 rotate-90 md:rotate-0" />
                    </div>

                    <div className="w-full md:w-auto">
                      <div className="text-xs text-muted-foreground mb-2 text-center">3D модель</div>
                      <div className="w-full md:w-[200px] aspect-square rounded-lg overflow-hidden bg-card border border-border/50">
                        {activeModels.has(example.id) ? (
                          <Model3DErrorBoundary>
                            <Suspense fallback={
                              <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                              </div>
                            }>
                              <Model3DViewer url={example.model_3d_url} />
                            </Suspense>
                          </Model3DErrorBoundary>
                        ) : (
                          <button
                            onClick={() => toggleModel(example.id)}
                            className="w-full h-full flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
                          >
                            <Box className="w-10 h-10 text-primary/60" />
                            <span className="text-xs text-muted-foreground">
                              Загрузить 3D
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              {example.description && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {example.description}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
