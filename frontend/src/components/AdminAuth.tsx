import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Loader2, Mail, Lock, LogOut } from "lucide-react";

interface AdminAuthProps {
  children: React.ReactNode;
}

interface AdminSession {
  token: string;
  email: string;
  expires_at: string;
}

const ADMIN_SESSION_KEY = "admin_session";

export const AdminAuth = ({ children }: AdminAuthProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionStr) {
        setIsLoading(false);
        return;
      }

      try {
        const session: AdminSession = JSON.parse(sessionStr);

        // Check if session is expired locally first
        if (new Date(session.expires_at) < new Date()) {
          localStorage.removeItem(ADMIN_SESSION_KEY);
          setIsLoading(false);
          return;
        }

        // Verify session with server
        const { data } = await api.verifyAdminSession(session.token, session.email);

        if (data?.valid) {
          setIsAuthenticated(true);
          setEmail(session.email);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch (err) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }

      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data, error } = await api.adminRequestCode(email);

      if (error) {
        setError("Ошибка отправки кода");
      } else {
        setStep("code");
      }
    } catch (err) {
      setError("Ошибка сервера");
    }

    setIsSubmitting(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data, error } = await api.adminVerifyCode(email, code);

      if (error || !data?.success) {
        setError(data?.error || "Неверный код");
        setIsSubmitting(false);
        return;
      }

      // Save session
      const session: AdminSession = {
        token: data.token,
        email: data.email,
        expires_at: data.expires_at,
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
    } catch (err) {
      setError("Ошибка проверки кода");
    }

    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    try {
      await api.adminLogout(email);
    } catch (err) {
      // Ignore errors on logout
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setStep("email");
    setEmail("");
    setCode("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* Logout button in top right */}
        <div className="fixed top-20 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="bg-background/80 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти ({email})
          </Button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display mb-2">Админ-панель</h1>
            <p className="text-muted-foreground">
              Вход только для администраторов
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email администратора</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@olai.art"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-gold text-primary-foreground"
                disabled={isSubmitting || !email}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Отправляем код...
                  </>
                ) : (
                  "Получить код"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Код отправлен на <span className="text-foreground">{email}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Код подтверждения</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="pl-10 text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-gold text-primary-foreground"
                disabled={isSubmitting || code.length !== 6}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Проверяем...
                  </>
                ) : (
                  "Войти"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                Изменить email
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Доступ только для авторизованных администраторов OLAI.art
        </p>
      </div>
    </div>
  );
};
