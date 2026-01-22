import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Lock, Loader2 } from "lucide-react";
import type { ProductConfig } from "@/types/product";
import { formatPrice, materialLabels } from "@/types/product";
import { api } from "@/lib/api";

interface Step5FinalizeProps {
  config: ProductConfig;
  onConfigChange: (updates: Partial<ProductConfig>) => void;
  onNext: () => void;
  onBack?: () => void;
  applicationId: string;
}

interface VariantInfo {
  id: string;
  size: string;
  material: string;
  diameter: string;
  weight?: string;
  volume?: string;
  price_cents: number;
}

// Функция для получения описания использования в зависимости от размера
function getUsageDescription(size: string): string {
  const descriptions: Record<string, string> = {
    lite: "Идеально подходит как изящное дополнение к повседневному образу. Легкий и компактный кулон отлично смотрится с тонкой цепочкой или кожаным шнурком. Прекрасный выбор для тех, кто предпочитает минималистичный стиль.",
    standard: "Универсальный размер, который подойдет для любого случая. Отлично смотрится как с деловым костюмом, так и с повседневной одеждой. Идеальный баланс между элегантностью и практичностью.",
    medium: "Впечатляющее украшение, которое станет центром внимания. Отлично подходит для особых случаев, вечерних мероприятий и важных встреч. Создает яркий акцент в образе.",
    maxi: "Роскошное украшение премиум-класса, созданное для особых моментов. Идеально для торжественных событий, презентаций и случаев, когда важно произвести впечатление. Настоящее произведение искусства."
  };
  return descriptions[size] || descriptions.standard;
}

// Функция для получения рекламного описания
function getMarketingDescription(size: string, material: string, diameter: string, weight?: string): string {
  const materialLabel = material === 'gold' ? 'золотого' : 'серебряного';
  const sizeLabels: Record<string, string> = {
    lite: 'изысканного миниатюрного',
    standard: 'элегантного',
    medium: 'впечатляющего',
    maxi: 'роскошного премиум-класса'
  };
  
  const sizeLabel = sizeLabels[size] || sizeLabels.standard;
  const weightText = weight ? `весом ${weight}` : '';
  
  return `Уникальный ${sizeLabel} кулон из ${materialLabel} металла диаметром ${diameter}${weightText ? ` ${weightText}` : ''}. Каждое изделие создается вручную с особой тщательностью и вниманием к деталям. Рельефная обработка создает игру света и тени, подчеркивая изысканность дизайна. Изделие выполнено в технике барельефа, что придает ему объем и глубину. Это не просто украшение - это произведение ювелирного искусства, которое станет частью вашей уникальной истории.`;
}

// Функция для расчета примерной толщины на основе диаметра
function estimateThickness(diameter: string): string {
  const diameterNum = parseFloat(diameter.replace(' см', '').replace('см', '').trim());
  // Толщина обычно составляет около 15-25% от диаметра для круглых кулонов
  const thickness = diameterNum * 0.2;
  return `${thickness.toFixed(2)} см`;
}

export function Step5Finalize({ config, onConfigChange, onNext, onBack, applicationId }: Step5FinalizeProps) {
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [variantInfo, setVariantInfo] = useState<VariantInfo | null>(null);
  const [loadingVariant, setLoadingVariant] = useState(true);
  const [generatingVisualizations, setGeneratingVisualizations] = useState(false);
  const [visualizations, setVisualizations] = useState<Record<string, string>>({});
  const [visualizationPrompts, setVisualizationPrompts] = useState<Record<string, string>>({});

  // Загружаем информацию о варианте
  useEffect(() => {
    const loadVariantInfo = async () => {
      if (!config.size || !config.material) {
        setLoadingVariant(false);
        return;
      }

      try {
        const { data, error } = await api.listVariants(config.size, config.material);
        if (!error && data && data.length > 0) {
          setVariantInfo(data[0]);
          
          // Автоматически генерируем визуализации при загрузке варианта
          if (config.selectedVariantUrl && data[0].diameter) {
            generateVisualizations(config.selectedVariantUrl, data[0].diameter);
          }
        }
      } catch (error) {
        console.error('Error loading variant info:', error);
      } finally {
        setLoadingVariant(false);
      }
    };

    loadVariantInfo();
  }, [config.size, config.material]);

  const generateVisualizations = async (pendantUrl: string, diameter: string) => {
    if (!config.size || !config.material) return;

    setGeneratingVisualizations(true);
    try {
      const { data, error } = await api.generateStep5Visualization({
        pendant_image_url: pendantUrl,
        size: config.size,
        material: config.material,
        diameter: diameter,
        application_id: applicationId,
      });

      if (!error && data?.visualizations) {
        setVisualizations(data.visualizations);
        if (data.prompts) {
          setVisualizationPrompts(data.prompts);
        }
      }
    } catch (error) {
      console.error('Error generating visualizations:', error);
    } finally {
      setGeneratingVisualizations(false);
    }
  };

  // Получаем цену из базы данных
  const basePrice = variantInfo ? variantInfo.price_cents / 100 : 0;
  const currentPrice = Math.round(basePrice);

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const now = new Date().toISOString();
      await api.updateApplication(applicationId, {
        status: 'finalized',
        finalized_at: now,
        current_step: 6,
        total_cost_cents: currentPrice * 100,
        visualization_generation_prompts: visualizationPrompts,
      });
      
      setIsFinalized(true);
      onNext();
    } catch (error) {
      console.error('Finalization error:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isFinalized) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-display">Дизайн утвержден!</h2>
        <p className="text-muted-foreground">
          Теперь мы создадим визуализацию и 3D модель вашего украшения
        </p>
      </div>
    );
  }

  const diameter = variantInfo?.diameter || '';
  const weight = variantInfo?.weight;
  const thickness = diameter ? estimateThickness(diameter) : null;
  const usageDescription = getUsageDescription(config.size || 'standard');
  const marketingDescription = getMarketingDescription(
    config.size || 'standard',
    config.material || 'silver',
    diameter,
    weight
  );

  // Определяем какие визуализации показывать
  const isMaxi = config.size === 'maxi';
  const visualizationKeys = isMaxi 
    ? ['frame'] 
    : ['neck_1', 'neck_2', 'neck_3'].filter(key => visualizations[key]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display">Итоговая стоимость</h2>
        </div>
        <p className="text-muted-foreground">Проверьте детали перед подтверждением</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Левая колонка: Информация о изделии */}
        <div className="space-y-6">
          {/* Изображение кулона */}
          <Card className="p-6">
            {config.selectedVariantUrl && (
              <div className="aspect-square max-w-xs mx-auto mb-6">
                <img
                  src={config.selectedVariantUrl}
                  alt="Выбранный вариант"
                  className="w-full h-full object-contain rounded"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Размер:</span>
                <span className="font-medium capitalize">{config.size || 'standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Материал:</span>
                <span className="font-medium">{materialLabels[config.material || 'silver']}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Диаметр:</span>
                <span className="font-medium">{diameter}</span>
              </div>
              {weight && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Вес:</span>
                  <span className="font-medium">{weight}</span>
                </div>
              )}
              {thickness && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Толщина (примерно):</span>
                  <span className="font-medium">{thickness}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Итого:</span>
                  <span className="text-gold">{formatPrice(currentPrice)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Использование */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Как можно использовать</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{usageDescription}</p>
          </Card>

          {/* Рекламное описание */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">О вашем изделии</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{marketingDescription}</p>
          </Card>
        </div>

        {/* Правая колонка: Визуализации */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {isMaxi ? 'Ваше изделие в рамке' : 'Ваше изделие на шее'}
            </h3>
            
            {generatingVisualizations ? (
              <div className="aspect-square flex items-center justify-center bg-muted rounded">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Генерируем {isMaxi ? 'визуализацию в рамке' : '3 визуализации на шее'}...
                  </p>
                </div>
              </div>
            ) : visualizationKeys.length > 0 ? (
              <div className={isMaxi ? "space-y-4" : "grid grid-cols-1 gap-4"}>
                {visualizationKeys.map((key) => (
                  <div key={key} className="aspect-square bg-muted rounded overflow-hidden">
                    <img
                      src={visualizations[key]}
                      alt={isMaxi ? 'Кулон в рамке' : `Визуализация ${key.split('_')[1]}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : config.selectedVariantUrl ? (
              <div className="aspect-square bg-muted rounded flex items-center justify-center">
                <Button
                  onClick={() => generateVisualizations(config.selectedVariantUrl!, diameter)}
                  variant="outline"
                  disabled={generatingVisualizations}
                >
                  {generatingVisualizations ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    `Сгенерировать ${isMaxi ? 'в рамке' : '3 визуализации на шее'}`
                  )}
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Warning about no going back */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Важно!</p>
            <p className="text-sm text-amber-700 mt-1">
              После подтверждения дизайна вернуться назад будет невозможно.
              Убедитесь, что все параметры выбраны правильно.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Назад
          </Button>
        )}
        <Button
          onClick={handleFinalize}
          disabled={isFinalizing}
          className="bg-gold hover:bg-gold-dark text-white ml-auto"
        >
          {isFinalizing ? 'Подтверждаем...' : 'Подтвердить дизайн'}
        </Button>
      </div>
    </div>
  );
}
