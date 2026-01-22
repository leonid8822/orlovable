import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Gem, Check, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductConfig, Stone } from "@/types/product";
import { formatPrice } from "@/types/product";
import { api } from "@/lib/api";

const STONE_TYPES = [
  { 
    type: 'sapphire' as const, 
    label: 'Синий сапфир', 
    color: 'bg-blue-500', 
    price: 3000,
  },
  { 
    type: 'diamond' as const, 
    label: 'Белый бриллиант', 
    color: 'bg-white', 
    price: 3000,
  },
  { 
    type: 'ruby' as const, 
    label: 'Красный рубин', 
    color: 'bg-red-500', 
    price: 3000,
  },
] as const;

const STONE_SIZE_MM = 2; // 2mm stones

interface Step7StonesProps {
  config: ProductConfig;
  onConfigChange: (updates: Partial<ProductConfig>) => void;
  onNext: () => void;
  onBack?: () => void;
  applicationId: string;
}

export function Step7Stones({ config, onConfigChange, onNext, onBack, applicationId }: Step7StonesProps) {
  const [selectedStoneType, setSelectedStoneType] = useState<Stone['type']>('diamond');
  const [stones, setStones] = useState<Stone[]>(config.stones || []);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onConfigChange({ stones });
    const stonesCost = stones.length * 300000; // 3k rubles = 300000 cents
    onConfigChange({ stonesCostCents: stonesCost });
    
    // Update in DB (auto-save)
    api.updateApplication(applicationId, {
      stones,
      stones_cost_cents: stonesCost,
    });
  }, [stones]);

  // Generate preview with beautiful stone images
  const generatePreview = async () => {
    if (!config.selectedVariantUrl || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    
    baseImg.onload = async () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      ctx.drawImage(baseImg, 0, 0);

      // Рисуем красивые камни программно
      stones.forEach((stone) => {
        const stoneType = STONE_TYPES.find(s => s.type === stone.type);
        if (!stoneType) return;

        const x = (stone.x / 100) * canvas.width;
        const y = (stone.y / 100) * canvas.height;
        
        // Размер камня в пикселях (2mm, масштабируется пропорционально)
        const stoneSize = (STONE_SIZE_MM / 10) * (canvas.width / 200);
        const size = Math.max(stoneSize, 20); // Минимальный размер 20px для красоты
        const radius = size / 2;
        
        ctx.save();
        
        // Тень
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = size / 4;
        ctx.shadowOffsetX = size / 10;
        ctx.shadowOffsetY = size / 10;
        
        // Определяем цвета для каждого типа камня
        const stoneConfigs: Record<Stone['type'], { base: string; light: string; dark: string; highlight: string }> = {
          sapphire: {
            base: '#0ea5e9',
            light: '#38bdf8',
            dark: '#0284c7',
            highlight: '#bae6fd'
          },
          diamond: {
            base: '#ffffff',
            light: '#f8fafc',
            dark: '#e2e8f0',
            highlight: '#ffffff'
          },
          ruby: {
            base: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
            highlight: '#fecaca'
          }
        };
        
        const config = stoneConfigs[stone.type];
        
        // Основной круг камня с градиентом
        const gradient = ctx.createRadialGradient(
          x - radius * 0.3, y - radius * 0.3, 0,
          x, y, radius
        );
        gradient.addColorStop(0, config.highlight);
        gradient.addColorStop(0.5, config.light);
        gradient.addColorStop(1, config.dark);
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Обводка для алмаза (белый камень)
        if (stone.type === 'diamond') {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        
        // Блик (highlight) для реалистичности
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        const highlightGradient = ctx.createRadialGradient(
          x - radius * 0.4, y - radius * 0.4, 0,
          x - radius * 0.4, y - radius * 0.4, radius * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(x - radius * 0.4, y - radius * 0.4, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        ctx.restore();
      });
      setShowPreview(true);
    };

    baseImg.src = config.selectedVariantUrl;
  };

  const handleSaveResult = async () => {
    setIsSaving(true);
    try {
      // Generate preview image
      if (previewCanvasRef.current) {
        const dataUrl = previewCanvasRef.current.toDataURL('image/png');
        
        // Загружаем в S3 через API
        const { data, error } = await api.saveStonesImage(applicationId, dataUrl);
        
        if (error || !data) {
          throw new Error(error || 'Не удалось сохранить изображение');
        }
        
        // Обновляем конфиг с URL изображения
        const finalImages = data.final_images || [];
        onConfigChange({ 
          finalImages,
          stones,
          stonesCostCents: stones.length * 300000
        });
        
        // Сохраняем в application
        await api.updateApplication(applicationId, {
          stones,
          stones_cost_cents: stones.length * 300000,
          final_images: finalImages,
          current_step: 8,
        });

        setIsSaved(true);
        setTimeout(() => {
          onNext();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving result:', error);
      alert('Ошибка при сохранении изображения. Попробуйте еще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newStone: Stone = {
      x,
      y,
      type: selectedStoneType,
    };

    setStones([...stones, newStone]);
  };

  const handleRemoveStone = (index: number) => {
    setStones(stones.filter((_, i) => i !== index));
  };

  const stonesCost = stones.length * 3000;

  if (!config.selectedVariantUrl) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Выбранный вариант не найден</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display">Редактор камней</h2>
        </div>
        <p className="text-muted-foreground">
          Кликните на изображение, чтобы добавить камень. Каждый камень — 3 000 ₽
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Stone Type Selector */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Выберите тип камня</h3>
          {STONE_TYPES.map((stoneType) => (
            <button
              key={stoneType.type}
              onClick={() => setSelectedStoneType(stoneType.type)}
              className={cn(
                "w-full p-3 rounded-lg border-2 transition-all text-left",
                selectedStoneType === stoneType.type
                  ? "border-gold bg-gold/10"
                  : "border-border hover:border-gold/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded-full", stoneType.color)} />
                <div className="flex-1">
                  <p className="font-medium">{stoneType.label}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(stoneType.price)}</p>
                </div>
              </div>
            </button>
          ))}
        </Card>

        {/* Image with Stones */}
        <Card className="md:col-span-2 p-4">
          <div className="relative">
            <div
              ref={imageRef}
              className="relative cursor-crosshair bg-muted rounded overflow-hidden"
              onClick={handleImageClick}
            >
              <img
                src={config.selectedVariantUrl}
                alt="Выбранный вариант"
                className="w-full h-full object-contain"
                draggable={false}
              />
              
              {/* Render stones - красивые визуализированные камни */}
              {stones.map((stone, index) => {
                const stoneType = STONE_TYPES.find(s => s.type === stone.type);
                const stoneColors: Record<Stone['type'], { bg: string; border: string; shadow: string }> = {
                  sapphire: {
                    bg: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
                    border: 'border-blue-300',
                    shadow: 'shadow-blue-500/50'
                  },
                  diamond: {
                    bg: 'bg-gradient-to-br from-gray-100 via-white to-gray-200',
                    border: 'border-gray-300',
                    shadow: 'shadow-gray-400/50'
                  },
                  ruby: {
                    bg: 'bg-gradient-to-br from-red-400 via-red-500 to-red-600',
                    border: 'border-red-300',
                    shadow: 'shadow-red-500/50'
                  }
                };
                const colors = stoneType ? stoneColors[stone.type] : stoneColors.diamond;
                
                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${stone.x}%`,
                      top: `${stone.y}%`,
                    }}
                  >
                    {/* Красивый камень с градиентом и бликом */}
                    <div className="relative">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 shadow-xl",
                          colors.bg,
                          colors.border,
                          colors.shadow
                        )}
                        style={{
                          boxShadow: `0 2px 8px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.5)`
                        }}
                      >
                        {/* Блик на камне */}
                        <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-sm" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStone(index);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Stones Summary */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Камней добавлено</p>
            <p className="text-2xl font-bold mt-1">{stones.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Стоимость камней</p>
            <p className="text-2xl font-bold text-gold mt-1">
              {formatPrice(stonesCost)}
            </p>
          </div>
        </div>
      </Card>

      {/* Preview and Save Section */}
      {showPreview && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Предпросмотр результата</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-auto rounded border border-border"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
          </div>
          {isSaved ? (
            <div className="flex items-center justify-center gap-2 text-green-600 py-4">
              <Check className="w-5 h-5" />
              <p className="font-medium">Результат сохранен!</p>
            </div>
          ) : (
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Вернуться к редактированию
              </Button>
              <Button
                onClick={handleSaveResult}
                disabled={isSaving}
                variant="gold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить результат
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Назад
            </Button>
          )}
          <div className="text-sm text-muted-foreground">
            {stones.length > 0 && (
              <p>Добавлено камней: {stones.length}</p>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          {!showPreview && (
            <Button
              onClick={generatePreview}
              variant="outline"
              disabled={stones.length === 0}
            >
              Показать результат
            </Button>
          )}
          {!showPreview && (
            <Button onClick={onNext} variant="gold" disabled={stones.length === 0}>
              Продолжить без предпросмотра
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

