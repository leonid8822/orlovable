import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Image, Calendar, Package, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
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
  paid_at: string | null;
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  generating: 'Генерация',
  generated: 'Сгенерировано',
  pending: 'В обработке',
  paid: 'Оплачено',
  completed: 'Завершено',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generating: 'bg-blue-500/20 text-blue-500',
  generated: 'bg-primary/20 text-primary',
  pending: 'bg-yellow-500/20 text-yellow-500',
  paid: 'bg-green-500/20 text-green-500',
  completed: 'bg-green-500/20 text-green-500',
};

const sizeLabels: Record<string, string> = {
  bracelet: 'S (11мм)',
  pendant: 'M (25мм)',
  interior: 'L (40мм)',
};

const materialLabels: Record<string, string> = {
  silver: 'Серебро 925',
  gold: 'Золото 585',
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth?returnTo=/profile');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchApplications(userData.id);
    } catch {
      localStorage.removeItem('user');
      navigate('/auth?returnTo=/profile');
    }
  }, [navigate]);

  const fetchApplications = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await api.listApplications(userId);
      if (data && !error) {
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatus = (app: Application) => {
    if (app.paid_at) return 'paid';
    return app.status || 'draft';
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display text-gradient-gold">Мои заказы</h1>
            <p className="text-muted-foreground mt-1">
              {user?.name} • {user?.email}
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              <Plus className="w-4 h-4 mr-2" />
              Новый заказ
            </Link>
          </Button>
        </div>

        {applications.length === 0 ? (
          <div className="bg-muted/30 p-12 rounded-lg text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">У вас пока нет заказов</h3>
            <p className="text-muted-foreground mb-6">
              Создайте свой первый уникальный кулон прямо сейчас
            </p>
            <Button asChild>
              <Link to="/">
                <Plus className="w-4 h-4 mr-2" />
                Создать украшение
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => {
              const status = getStatus(app);
              return (
                <Card
                  key={app.id}
                  className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/application/${app.id}`)}
                >
                  <div className="aspect-square bg-muted relative">
                    {app.generated_preview ? (
                      <img
                        src={app.generated_preview}
                        alt="Превью"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-3 right-3 ${statusColors[status] || statusColors.draft}`}
                    >
                      {statusLabels[status] || status}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {app.size ? sizeLabels[app.size] || app.size : 'Размер не выбран'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {app.material ? materialLabels[app.material] || app.material : ''}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(app.created_at)}
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <span className="text-sm text-primary flex items-center gap-1">
                        Открыть <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
