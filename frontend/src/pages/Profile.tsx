import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Image, Calendar } from 'lucide-react';
// import { api } from '@/lib/api'; // Assuming api import is needed, though we might rely on localStorage for session based "auth" for now

// Placeholder for User type since we removed Supabase
interface User {
  id: string;
  email?: string;
}

interface Application {
  id: string;
  created_at: string;
  status: string;
  form_factor: string | null;
  material: string | null;
  size: string | null;
  generated_preview: string | null;
  current_step: number;
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  generated: 'Сгенерировано',
  pending: 'В обработке',
  completed: 'Завершено',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generated: 'bg-primary/20 text-primary',
  pending: 'bg-yellow-500/20 text-yellow-500',
  completed: 'bg-green-500/20 text-green-500',
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // For now, we stub the auth process. In a real Python app, we'd use a different Auth provider or our own.
  // We'll treat the user as "Guest" for now, or just don't load profile if no auth system.
  // Actually, since this is a rewrite, let's just show a clear message or stub it.

  useEffect(() => {
    // Stub: Simulate guest user or just redirect to auth if strict
    // For this rewrite stage, let's assume we might not have a logged in user initially.
    // But to verify functionality, we can disable the redirect loop.

    const stubUser = { id: 'guest-123', email: 'guest@example.com' };
    setUser(stubUser);
    setLoading(false);
    // In real implementation: fetchApplications(stubUser.id);
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Simplified view for now as Auth is stripped
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display text-gradient-gold">Мои заявки</h1>
            <p className="text-muted-foreground mt-1">{user?.email || 'Гость'}</p>
          </div>
          <Button asChild>
            <Link to="/">
              <Plus className="w-4 h-4 mr-2" />
              Новая заявка
            </Link>
          </Button>
        </div>

        <div className="bg-muted/30 p-8 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-2">Авторизация в процессе разработки</h3>
          <p className="text-muted-foreground">
            В этой версии приложения система пользователей временно отключена.
            В будущем здесь будут отображаться ваши заявки.
          </p>
        </div>
      </div>
    </div>
  );
}
