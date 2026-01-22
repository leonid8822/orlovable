import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, MessageCircle, Lock, Loader2 } from "lucide-react";
import type { ProductConfig } from "@/types/product";
import { formatPrice, materialLabels } from "@/types/product";
import { api } from "@/lib/api";
import Model3DViewer from "@/components/Model3DViewer";

interface Step8PaymentProps {
  config: ProductConfig;
  onConfigChange: (updates: Partial<ProductConfig>) => void;
  onBack?: () => void;
  applicationId: string;
}

export function Step8Payment({ config, onConfigChange, onBack, applicationId }: Step8PaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(config.paymentStatus === 'paid');
  const [progress3d, setProgress3d] = useState(0);
  const [elapsedTime3d, setElapsedTime3d] = useState(0);
  const [variantInfo, setVariantInfo] = useState<any>(null);

  // Загружаем информацию о варианте из базы
  useEffect(() => {
    const loadVariantInfo = async () => {
      if (!config.size || !config.material) return;
      
      try {
        const { data, error } = await api.listVariants(config.size, config.material);
        if (!error && data && data.length > 0) {
          setVariantInfo(data[0]);
        }
      } catch (error) {
        console.error('Error loading variant info:', error);
      }
    };
    
    loadVariantInfo();
  }, [config.size, config.material]);

  // 3D generation is started automatically after variant selection in Step3
  // We only check status and display results here

  // Периодически проверяем статус 3D генерации и обновляем прогресс
  useEffect(() => {
    if (config.model3dRequestId && config.model3dStatus === 'pending') {
      // Симулируем прогресс (от 1 до 5 минут = 60-300 секунд)
      const startTime = Date.now();
      const estimatedTime = 180000; // 3 минуты в среднем
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const elapsedSeconds = Math.floor(elapsed / 1000);
        setElapsedTime3d(elapsedSeconds);
        
        // Прогресс от 10% до 90% (остальные 10% когда завершится)
        const progress = Math.min(90, 10 + (elapsed / estimatedTime) * 80);
        setProgress3d(progress);
      }, 1000);

      const check3DStatus = async () => {
        try {
          const { data, error } = await api.get3DStatus(config.model3dRequestId!);
          
          if (error || !data) {
            return;
          }

          if (data.status === 'completed' && data.model_glb_url) {
            clearInterval(progressInterval);
            setProgress3d(100);
            onConfigChange({
              model3dUrl: data.model_glb_url,
              model3dStatus: 'completed',
            });

            await api.updateApplication(applicationId, {
              model_glb_url: data.model_glb_url,
              model_zip_url: data.model_zip_url,
              model_3d_status: 'completed'
            });
          } else if (data.status === 'failed') {
            clearInterval(progressInterval);
            onConfigChange({
              model3dStatus: 'failed',
            });

            await api.updateApplication(applicationId, {
              model_3d_status: 'failed'
            });
          }
        } catch (error) {
          console.error('Error checking 3D status:', error);
        }
      };

      const statusInterval = setInterval(check3DStatus, 5000); // Проверяем каждые 5 секунд
      
      return () => {
        clearInterval(progressInterval);
        clearInterval(statusInterval);
      };
    } else if (config.model3dStatus === 'completed') {
      setProgress3d(100);
    }
  }, [config.model3dRequestId, config.model3dStatus]);

  // Получаем цену из базы данных
  const basePrice = variantInfo ? variantInfo.price_cents / 100 : 0;
  const baseCost = Math.round(basePrice);
  const stonesCost = config.stonesCostCents ? config.stonesCostCents / 100 : 0;
  const totalCost = baseCost + stonesCost;

  useEffect(() => {
    const totalCostCents = totalCost * 100;
    onConfigChange({ totalCostCents });
    api.updateApplication(applicationId, {
      total_cost_cents: totalCostCents,
      current_step: 8,
    });
  }, [totalCost]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // TODO: Integrate with payment provider
      // For now, simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await api.updateApplication(applicationId, {
        payment_status: 'paid',
        payment_id: `pay_${Date.now()}`,
      });

      onConfigChange({ paymentStatus: 'paid' });
      setIsPaid(true);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPaid) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-display">Оплата успешно завершена!</h2>
        <p className="text-muted-foreground">
          Ваш заказ принят в работу. Мы свяжемся с вами в ближайшее время.
        </p>
        <Card className="p-6 mt-6">
          <p className="text-sm text-muted-foreground mb-2">Номер заказа</p>
          <p className="text-xl font-mono font-bold">{applicationId.slice(0, 8)}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display">Оплата</h2>
        </div>
        <p className="text-muted-foreground">Проверьте детали заказа и завершите оплату</p>
      </div>

      {/* Order Summary */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-semibold mb-4">Детали заказа</h3>
        
        {/* Показываем финальные изображения с камнями, если есть */}
        {config.finalImages && config.finalImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {config.finalImages.map((imgUrl: string, idx: number) => (
              <div key={idx} className="aspect-square max-w-xs mx-auto">
                <img
                  src={imgUrl}
                  alt={`Финальное изображение ${idx + 1}`}
                  className="w-full h-full object-contain rounded border border-border"
                />
              </div>
            ))}
          </div>
        ) : config.selectedVariantUrl && (
          <div className="aspect-square max-w-xs mx-auto mb-6">
            <img
              src={config.selectedVariantUrl}
              alt="Выбранный вариант"
              className="w-full h-full object-contain rounded"
            />
          </div>
        )}

        {/* 3D модель (если готова или генерируется) */}
        {(config.model3dUrl || config.model3dRequestId) && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3">3D модель изделия</h4>
            {config.model3dUrl ? (
              <div className="border border-border rounded-lg p-4 bg-card">
                <Model3DViewer url={config.model3dUrl} />
              </div>
            ) : config.model3dStatus === 'pending' ? (
              <div className="border border-border rounded-lg p-8 bg-card">
                <div className="text-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
                  <p className="text-muted-foreground font-medium">Генерируется 3D модель...</p>
                  <p className="text-sm text-muted-foreground mt-1">Может занять от 1 до 5 минут</p>
                </div>
                <div className="space-y-2">
                  <Progress value={progress3d} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Прогресс: {Math.round(progress3d)}%</span>
                    <span>Прошло: {Math.floor(elapsedTime3d / 60)}:{(elapsedTime3d % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4 bg-card text-center text-muted-foreground">
                Ожидание генерации 3D модели
              </div>
            )}
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
            <span className="text-muted-foreground">Камни:</span>
            <span className="font-medium">
              {config.stones?.length || 0} шт. ({formatPrice(stonesCost)})
            </span>
          </div>
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Итого к оплате:</span>
              <span className="text-gold text-2xl">{formatPrice(totalCost)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Способы оплаты</h3>
        <div className="space-y-3">
          <button className="w-full p-4 border-2 border-border rounded-lg hover:border-gold transition-colors text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Банковская карта</p>
                <p className="text-sm text-muted-foreground">Visa, MasterCard, МИР</p>
              </div>
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
          <button className="w-full p-4 border-2 border-border rounded-lg hover:border-gold transition-colors text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">СБП (Система быстрых платежей)</p>
                <p className="text-sm text-muted-foreground">Оплата через приложение банка</p>
              </div>
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        </div>
      </Card>

      {/* Telegram Contact */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex items-start gap-4">
          <MessageCircle className="w-6 h-6 text-gold mt-1" />
          <div>
            <p className="font-medium mb-1">Есть вопросы?</p>
            <p className="text-sm text-muted-foreground mb-3">
              Свяжитесь с нами в Telegram для консультации
            </p>
            <a
              href="https://t.me/olai_support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline font-medium"
            >
              @olai_support
            </a>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        {onBack && !isPaid && (
          <Button onClick={onBack} variant="outline">
            Назад
          </Button>
        )}
        <Button
          onClick={handlePayment}
          disabled={isProcessing || isPaid}
          variant="gold"
          size="lg"
          className={onBack && !isPaid ? "ml-auto min-w-[200px]" : "min-w-[200px]"}
        >
          {isProcessing ? 'Обработка...' : `Оплатить ${formatPrice(totalCost)}`}
        </Button>
      </div>
    </div>
  );
}

