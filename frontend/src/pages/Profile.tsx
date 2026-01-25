import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Image, Calendar, Package, ArrowRight, User, Save, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id?: string;
  userId?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
  subscribeNewsletter?: boolean;
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
  checkout: 'Оформление',
  pending_payment: 'Ожидает оплаты',
  paid: 'Оплачено',
  completed: 'Завершено',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generating: 'bg-blue-500/20 text-blue-500',
  generated: 'bg-primary/20 text-primary',
  pending: 'bg-yellow-500/20 text-yellow-500',
  checkout: 'bg-yellow-500/20 text-yellow-500',
  pending_payment: 'bg-orange-500/20 text-orange-500',
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

  // Profile editing state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth?returnTo=/profile');
      return;
    }

    try {
      const userData = JSON.parse(storedUser) as User;
      setUser(userData);

      // Initialize form fields
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setTelegramUsername(userData.telegramUsername || '');
      setSubscribeNewsletter(userData.subscribeNewsletter || false);

      const userId = userData.userId || userData.id;
      if (userId) {
        fetchApplications(userId);
      } else {
        setLoading(false);
      }
    } catch {
      localStorage.removeItem('user');
      navigate('/auth?returnTo=/profile');
    }
  }, [navigate]);

  // Track changes
  useEffect(() => {
    if (!user) return;

    const changed =
      firstName !== (user.firstName || '') ||
      lastName !== (user.lastName || '') ||
      telegramUsername !== (user.telegramUsername || '') ||
      subscribeNewsletter !== (user.subscribeNewsletter || false);

    setHasChanges(changed);
  }, [firstName, lastName, telegramUsername, subscribeNewsletter, user]);

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

  const handleSaveProfile = async () => {
    if (!user) return;

    const userId = user.userId || user.id;
    if (!userId) {
      toast.error('Не удалось определить ID пользователя');
      return;
    }

    setIsSaving(true);

    try {
      // Format telegram username
      let formattedTelegram = telegramUsername.trim();
      if (formattedTelegram && !formattedTelegram.startsWith('@')) {
        formattedTelegram = `@${formattedTelegram}`;
      }

      const updates = {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        telegram_username: formattedTelegram || undefined,
        subscribe_newsletter: subscribeNewsletter,
      };

      const { error } = await api.updateUserProfile(userId, updates);

      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Ошибка сохранения');
      }

      // Update localStorage
      const updatedUser = {
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        telegramUsername: formattedTelegram,
        subscribeNewsletter,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setTelegramUsername(formattedTelegram);

      toast.success('Профиль сохранён');
      setHasChanges(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
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
            <h1 className="text-3xl font-display text-gradient-gold">Мой профиль</h1>
            <p className="text-muted-foreground mt-1">
              {user?.email}
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              <Plus className="w-4 h-4 mr-2" />
              Новый заказ
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Личные данные
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    placeholder="Введите имя"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    placeholder="Введите фамилию"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    placeholder="@username"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Для связи по заказам
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsletter">Рассылка</Label>
                    <p className="text-xs text-muted-foreground">
                      Скидки и новинки
                    </p>
                  </div>
                  <Switch
                    id="newsletter"
                    checked={subscribeNewsletter}
                    onCheckedChange={setSubscribeNewsletter}
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !hasChanges}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : hasChanges ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Сохранено
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-medium mb-4">Мои заказы</h2>

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
              <div className="grid gap-4 md:grid-cols-2">
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
      </div>
    </div>
  );
}
