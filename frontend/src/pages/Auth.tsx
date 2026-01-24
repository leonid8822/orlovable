import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { ArrowLeft, Mail, KeyRound, Loader2 } from 'lucide-react';

type AuthStep = 'email' | 'code';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [step, setStep] = useState<AuthStep>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error('Заполните все поля');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Введите корректный email');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.requestCode({ email, name });

      if (error || !data?.success) {
        toast.error(error || 'Ошибка отправки кода');
        return;
      }

      toast.success('Код отправлен на ваш email');
      setStep('code');
    } catch (error) {
      toast.error('Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error('Введите код');
      return;
    }

    if (code.length !== 6) {
      toast.error('Код должен состоять из 6 цифр');
      return;
    }

    setLoading(true);
    try {
      // For user auth without application_id, we pass empty string
      const { data, error } = await api.verifyCode({
        email,
        code,
        application_id: ''
      });

      if (error || !data?.success) {
        toast.error(data?.error || error || 'Неверный код');
        return;
      }

      // Save user info to localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userEmail', email);
      }

      toast.success('Вы успешно вошли!');

      // Redirect to returnTo or profile
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/profile');
      }
    } catch (error) {
      toast.error('Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.requestCode({ email, name });
      if (error || !data?.success) {
        toast.error('Ошибка повторной отправки');
        return;
      }
      toast.success('Код отправлен повторно');
    } catch {
      toast.error('Ошибка повторной отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl text-primary">
              {step === 'email' ? 'Вход в личный кабинет' : 'Подтверждение'}
            </CardTitle>
            <CardDescription>
              {step === 'email'
                ? 'Введите ваши данные для входа'
                : `Код отправлен на ${email}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ваше имя</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Иван"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ivan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {loading ? 'Отправка...' : 'Получить код'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Код из письма</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    autoFocus
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  {loading ? 'Проверка...' : 'Войти'}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Отправить код повторно
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
