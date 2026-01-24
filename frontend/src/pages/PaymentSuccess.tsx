import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CheckCircle, Loader2, MessageCircle, Package } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      const { data } = await api.getPaymentStatus(orderId);
      setPaymentStatus(data);
      setLoading(false);
    };

    checkPayment();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-gold" />
              <p className="text-muted-foreground">Проверяем статус оплаты...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <div>
                <h1 className="text-3xl font-display mb-2">Оплата прошла успешно!</h1>
                <p className="text-muted-foreground">
                  Спасибо за ваш заказ. Мы уже начинаем работу над вашим украшением.
                </p>
              </div>

              {orderId && (
                <div className="bg-card rounded-xl border border-border p-4 w-full">
                  <p className="text-sm text-muted-foreground mb-1">Номер заказа</p>
                  <p className="font-mono text-lg">{orderId}</p>
                  {paymentStatus?.amount && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Сумма: {paymentStatus.amount.toLocaleString("ru-RU")} ₽
                    </p>
                  )}
                </div>
              )}

              <div className="bg-card/50 rounded-xl border border-border p-6 w-full text-left space-y-4">
                <h3 className="font-display text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-gold" />
                  Что дальше?
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Мы свяжемся с вами для уточнения деталей заказа</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Изготовим ваше украшение за 7-14 рабочих дней</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Отправим фото готового изделия для утверждения</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0">4</span>
                    <span>Доставим курьером после оплаты остатка</span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <a
                  href="https://t.me/olai_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Написать в Telegram
                  </Button>
                </a>
                <Link to="/" className="flex-1">
                  <Button className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                    На главную
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
