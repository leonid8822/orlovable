import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Loader2, LogIn, ShieldX } from "lucide-react";

interface AdminAuthProps {
  children: React.ReactNode;
}

interface UserData {
  id?: string;
  userId?: string;
  email: string;
}

export const AdminAuth = ({ children }: AdminAuthProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Check for user in localStorage
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const userData: UserData = JSON.parse(storedUser);
        setUser(userData);

        const userId = userData.userId || userData.id;
        if (!userId) {
          setIsLoading(false);
          return;
        }

        // Check if user is admin via API
        const { data } = await api.checkAdminStatus(userId);

        if (data?.is_admin) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
      }

      setIsLoading(false);
    };

    checkAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  // User not logged in - show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
            <LogIn className="w-16 h-16 text-gold mx-auto mb-6" />
            <h1 className="text-2xl font-display mb-4">Требуется авторизация</h1>
            <p className="text-muted-foreground mb-6">
              Для доступа к админ-панели необходимо войти в аккаунт
            </p>
            <Button asChild className="w-full bg-gradient-gold text-primary-foreground">
              <Link to="/">
                На главную
              </Link>
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Используйте кнопку "Войти" в шапке сайта
          </p>
        </div>
      </div>
    );
  }

  // User logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
            <ShieldX className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h1 className="text-2xl font-display mb-4">Доступ запрещён</h1>
            <p className="text-muted-foreground mb-2">
              У вашего аккаунта нет прав администратора
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {user.email}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                На главную
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User is admin - show admin panel
  return <>{children}</>;
};
