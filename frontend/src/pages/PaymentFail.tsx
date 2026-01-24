import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { XCircle, MessageCircle, RefreshCw } from "lucide-react";

const PaymentFail = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>

            <div>
              <h1 className="text-3xl font-display mb-2">Оплата не прошла</h1>
              <p className="text-muted-foreground">
                К сожалению, платёж не был завершён. Вы можете попробовать ещё раз или связаться с нами.
              </p>
            </div>

            {orderId && (
              <div className="bg-card rounded-xl border border-border p-4 w-full">
                <p className="text-sm text-muted-foreground mb-1">Номер заказа</p>
                <p className="font-mono text-lg">{orderId}</p>
              </div>
            )}

            <div className="bg-card/50 rounded-xl border border-border p-6 w-full text-left">
              <h3 className="font-display text-lg mb-3">Возможные причины</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-red-400">•</span>
                  Недостаточно средств на карте
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">•</span>
                  Превышен лимит по карте
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">•</span>
                  Карта заблокирована или истёк срок действия
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">•</span>
                  Ошибка 3D-Secure авторизации
                </li>
              </ul>
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
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentFail;
