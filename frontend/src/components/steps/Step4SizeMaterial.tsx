import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProductConfig, Material, Size } from "@/types/product";
import { materialLabels, formatPrice } from "@/types/product";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Step4SizeMaterialProps {
  config: ProductConfig;
  onConfigChange: (updates: Partial<ProductConfig>) => void;
  onNext: () => void;
  onBack: () => void;
  applicationId: string;
}

interface Variant {
  id: string;
  size: string;
  material: string;
  diameter: string;
  weight?: string;
  volume?: string;
  price_cents: number;
  background_image_url: string;
  form_prompt?: string;
  preview_prompt?: string;
  icon_url?: string;
  fitting_description?: string;
  display_order: number;
  is_active?: boolean;
}

// Функция для удаления черного фона из изображения
function removeBlackBackground(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Удаляем черный фон (пиксели с низкой яркостью)
      // Порог можно настроить - чем выше, тем больше удаляется
      const threshold = 50; // 0-255, ниже этого значения считаем черным
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Вычисляем яркость
        const brightness = (r + g + b) / 3;
        
        // Если пиксель темный (черный фон), делаем его прозрачным
        if (brightness < threshold) {
          data[i + 3] = 0; // alpha = 0 (прозрачный)
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Конвертируем в data URL
      const result = canvas.toDataURL('image/png');
      resolve(result);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

export function Step4SizeMaterial({ config, onConfigChange, onNext, onBack, applicationId }: Step4SizeMaterialProps) {
  const [selectedSize, setSelectedSize] = useState<Size>(config.size || 'standard');
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(config.material || 'silver');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load variants from API
  useEffect(() => {
    const loadVariants = async () => {
      setLoading(true);
      try {
        const { data, error } = await api.listVariants();
        if (error) {
          console.error('Failed to load variants:', error);
          toast.error('Не удалось загрузить варианты.');
          setLoading(false);
          return;
        }
        
        if (!data || data.length === 0) {
          setVariants([]);
          setLoading(false);
          return;
        }
        
        // Фильтруем только активные варианты для пользователей
        const activeVariants = data.filter((v: Variant) => v.is_active !== false);
        setVariants(activeVariants);
      } catch (err) {
        console.error('Error loading variants:', err);
        toast.error('Ошибка при загрузке вариантов');
      } finally {
        setLoading(false);
      }
    };
    loadVariants();
  }, []);

  // Обработка изображения при изменении выбранного варианта или размера/материала
  useEffect(() => {
    if (!config.selectedVariantUrl || variants.length === 0) {
      setProcessedImage(null);
      return;
    }

    const currentVariant = variants.find(v => v.size === selectedSize && v.material === selectedMaterial);
    if (!currentVariant || !currentVariant.background_image_url) {
      setProcessedImage(null);
      return;
    }

    const processAndRender = async () => {
      setProcessing(true);
      try {
        // Создаем canvas для композиции
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Загружаем изображение подвески
        const pendantImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = config.selectedVariantUrl!;
        });

        // Размер canvas фиксированный, не зависит от размера изделия
        // Размер изделия остается постоянным, меняется только окружение
        const canvasSize = 600; // Фиксированный размер
        
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        // Размер изделия фиксированный (центр canvas)
        const pendantSize = 200; // Фиксированный размер изделия в пикселях
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Рисуем нейтральный серый бархат фон
        const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGradient.addColorStop(0, '#2a2a2a');
        bgGradient.addColorStop(0.5, '#1f1f1f');
        bgGradient.addColorStop(1, '#2a2a2a');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем концентрические окружности с шагом 1 см
        // 1 см = примерно 37.8 пикселей при 96 DPI, но для визуализации используем пропорцию
        // Базовый радиус изделия (примерно 1 см в реальности)
        const baseRadiusCm = 1; // 1 см базовый радиус
        const pixelsPerCm = pendantSize / (baseRadiusCm * 2); // Пикселей на см
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Рисуем концентрические окружности с шагом 1 см
        for (let i = 1; i <= 10; i++) {
          const radius = (baseRadiusCm + i) * pixelsPerCm;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Добавляем текстуру бархата (легкий шум)
        const bgImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bgData = bgImageData.data;
        for (let i = 0; i < bgData.length; i += 4) {
          const noise = (Math.random() - 0.5) * 8; // Легкий шум
          bgData[i] = Math.max(0, Math.min(255, bgData[i] + noise));     // R
          bgData[i + 1] = Math.max(0, Math.min(255, bgData[i + 1] + noise)); // G
          bgData[i + 2] = Math.max(0, Math.min(255, bgData[i + 2] + noise)); // B
        }
        ctx.putImageData(bgImageData, 0, 0);
        
        // Затемняем края градиентом для фокуса на центре
        const radius = Math.max(canvas.width, canvas.height) * 0.7;
        
        const vignetteGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius);
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0.0)');  // Центр - без затемнения
        vignetteGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)'); // Средняя зона
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');   // Края - затемнение
        
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Обрабатываем подвеску - удаляем черный фон
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = pendantImg.width;
        tempCanvas.height = pendantImg.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) {
          setProcessing(false);
          return;
        }

        tempCtx.drawImage(pendantImg, 0, 0);
        const pendantImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pendantData = pendantImageData.data;

        // Удаляем черный фон
        const threshold = 50;
        for (let i = 0; i < pendantData.length; i += 4) {
          const r = pendantData[i];
          const g = pendantData[i + 1];
          const b = pendantData[i + 2];
          const brightness = (r + g + b) / 3;
          
          if (brightness < threshold) {
            pendantData[i + 3] = 0; // Прозрачный
          }
        }

        tempCtx.putImageData(pendantImageData, 0, 0);

        // Размер изделия фиксированный, не зависит от выбранного размера
        // Меняется только окружение (концентрические окружности)
        const pendantHeight = pendantSize; // Фиксированный размер
        const pendantWidth = (tempCanvas.width / tempCanvas.height) * pendantHeight;

        // Центрируем подвеску
        const x = centerX - pendantWidth / 2;
        const y = centerY - pendantHeight / 2;

        // Применяем фильтр материала
        ctx.save();
        if (selectedMaterial === 'gold') {
          ctx.filter = 'sepia(100%) saturate(200%) hue-rotate(30deg) brightness(1.1)';
        } else {
          ctx.filter = 'grayscale(100%) brightness(1.1) contrast(1.1)';
        }

        // Добавляем легкое свечение вокруг подвески для лучшего фокуса
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Рисуем подвеску поверх фона
        ctx.drawImage(tempCanvas, x, y, pendantWidth, pendantHeight);
        
        ctx.restore(); // Восстанавливаем состояние (убираем фильтр и shadow)

        // Получаем результат
        const result = canvas.toDataURL('image/png');
        setProcessedImage(result);
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Ошибка при обработке изображения');
      } finally {
        setProcessing(false);
      }
    };

    processAndRender();
  }, [config.selectedVariantUrl, selectedSize, selectedMaterial, variants]);

  const handleSizeChange = async (size: Size) => {
    setSelectedSize(size);
    onConfigChange({ size });
    await api.updateApplication(applicationId, { size });
  };

  const handleMaterialChange = async (material: Material) => {
    setSelectedMaterial(material);
    onConfigChange({ material });
    await api.updateApplication(applicationId, { material });
  };

  const handleNext = async () => {
    await api.updateApplication(applicationId, {
      size: selectedSize,
      material: selectedMaterial,
      current_step: 5,
    });
    onNext();
  };

  // Get current price
  const currentVariant = variants.find(v => v.size === selectedSize && v.material === selectedMaterial);
  const currentPrice = currentVariant ? currentVariant.price_cents / 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка вариантов...</p>
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-display">Выберите размер и материал</h2>
        </div>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Варианты еще не настроены в базе данных.
          </p>
          <Button onClick={onBack} variant="outline">
            Назад
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Configuration */}
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-foreground font-semibold mb-3">
            Настройте изделие
          </h2>
          <p className="text-foreground/70 mb-4">
            На этом шаге определяемся с итоговым размером изделия. Выберите материал и размер для вашего украшения.
          </p>
          <p className="text-sm text-muted-foreground">
            Дальше будут доступны опции: сделать надпись на обратной стороне кулона и добавить камни.
          </p>
        </div>

        {/* Material selection */}
        <div className="space-y-4">
          <label className="text-lg font-display text-foreground">
            Материал
          </label>
          <div className="grid grid-cols-2 gap-4">
            {(['silver', 'gold'] as Material[]).map((material) => {
              const isSelected = selectedMaterial === material;
              const isGold = material === 'gold';
              const isDisabled = material === 'gold'; // Gold coming soon

              return (
                <button
                  key={material}
                  onClick={() => !isDisabled && handleMaterialChange(material)}
                  disabled={isDisabled}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden group",
                    isDisabled && "opacity-60 cursor-not-allowed",
                    isSelected
                      ? isGold
                        ? "border-gold bg-gold/10"
                        : "border-silver bg-silver/10"
                      : "border-border bg-card",
                    !isDisabled && !isSelected && "hover:border-gold/30"
                  )}
                >
                  {/* Material preview circle */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full mx-auto mb-3 transition-transform duration-300",
                      !isDisabled && "group-hover:scale-110",
                      isGold
                        ? "bg-gradient-to-br from-gold-light via-gold to-gold-dark"
                        : "bg-gradient-to-br from-silver-light via-silver to-gray-400"
                    )}
                    style={{
                      boxShadow:
                        isGold
                          ? "0 4px 20px rgba(212, 175, 55, 0.3)"
                          : "0 4px 20px rgba(192, 192, 192, 0.2)",
                    }}
                  />
                  <p
                    className={cn(
                      "font-medium text-center transition-colors duration-300",
                      isSelected
                        ? isGold
                          ? "text-gold-light"
                          : "text-silver-light"
                        : "text-muted-foreground"
                    )}
                  >
                    {materialLabels[material]}
                  </p>
                  {isDisabled && (
                    <p className="text-xs text-center text-muted-foreground mt-1">Скоро</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size selection */}
        <div className="space-y-4">
          <label className="text-lg font-display text-foreground">
            Размер изделия
          </label>
          <div className="space-y-3">
            {(['lite', 'standard', 'medium', 'maxi'] as Size[]).map((size) => {
                    const variant = variants.find(v => v.size === size && v.material === selectedMaterial);
                    if (!variant) return null;
                    
                    const sizeInfo = { 
                      label: size, 
                      diameter: variant.diameter, 
                      price: variant.price_cents / 100 
                    };

              if (!sizeInfo) return null;

              return (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                    selectedSize === size
                      ? "border-gold bg-gold/10"
                      : "border-border bg-card hover:border-gold/30"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Иконка варианта или индикатор размера */}
                    {variant?.icon_url ? (
                      <img
                        src={variant.icon_url}
                        alt={sizeInfo.label}
                        className={cn(
                          "w-12 h-12 object-contain transition-all duration-300",
                          selectedSize === size && "ring-2 ring-gold rounded-lg"
                        )}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className={cn(
                          "rounded-full bg-secondary flex items-center justify-center transition-all duration-300",
                          size === "maxi" ? "w-12 h-12" :
                            size === "medium" ? "w-10 h-10" :
                              size === "standard" ? "w-8 h-8" : "w-6 h-6",
                          selectedSize === size && "bg-gold/20"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-full",
                            size === "maxi" ? "w-8 h-8" :
                              size === "medium" ? "w-6 h-6" :
                                size === "standard" ? "w-5 h-5" : "w-4 h-4",
                            selectedMaterial === "gold"
                              ? "bg-gradient-to-br from-gold-light to-gold"
                              : "bg-gradient-to-br from-silver-light to-silver"
                          )}
                        />
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <span
                        className={cn(
                          "font-medium block capitalize",
                          selectedSize === size ? "text-gold-light" : "text-foreground"
                        )}
                      >
                        {sizeInfo.label}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        Ø {sizeInfo.diameter || variant?.diameter}
                      </span>
                      {variant?.fitting_description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {variant.fitting_description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "font-semibold text-lg",
                    selectedSize === size ? "text-gold" : "text-foreground"
                  )}>
                    {formatPrice(sizeInfo.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price summary */}
        <div className="p-4 rounded-xl bg-card border border-gold/20">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Итого:</span>
            <span className="text-2xl font-display text-gold">
              {formatPrice(currentPrice)}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
            Назад
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={handleNext}
            className="flex-1"
          >
            Продолжить
          </Button>
        </div>
      </div>

      {/* Right: Preview with background */}
      <div className="flex items-center justify-center animate-scale-in" style={{ animationDelay: "0.2s" }}>
        <div className="relative w-full flex justify-center">
          {processing ? (
            <div 
              className="rounded-full flex items-center justify-center border-4 border-border"
              style={{
                width: '500px',
                height: '500px',
              }}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Обработка...</p>
              </div>
            </div>
          ) : processedImage ? (
            <div className="relative">
              {/* Круглая рамка - фиксированный размер с анимацией покачивания */}
              <div 
                className="relative rounded-full overflow-hidden border-4 border-gold shadow-2xl"
                style={{
                  width: '500px',
                  height: '500px',
                  animation: 'swing 3s ease-in-out infinite',
                  transformOrigin: 'center top',
                }}
              >
                <img
                  src={processedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              {currentVariant && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-lg p-3 border border-gold/30 shadow-lg min-w-[200px]">
                  <div className="flex justify-between items-center text-sm gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Размер: <span className="font-medium capitalize">{currentVariant.size}</span></p>
                      <p className="text-muted-foreground text-xs">Материал: <span className="font-medium">{materialLabels[selectedMaterial]}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gold">
                        {formatPrice(currentVariant.price_cents / 100)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="rounded-full bg-muted flex items-center justify-center border-4 border-border"
              style={{
                width: '500px',
                height: '500px',
              }}
            >
              <p className="text-muted-foreground text-center px-4">Выберите размер и материал</p>
            </div>
          )}
          
          {/* Скрытый canvas для обработки */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
}
