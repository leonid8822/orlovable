import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { UserAuthData } from '@/types/pendant';
import { Loader2, Mail, ArrowLeft, Check, User, PartyPopper } from 'lucide-react';

// Test email for development - auto-verifies with code 123456
const TEST_EMAIL = 'test@olai.art';
const TEST_CODE = '123456';

interface EmailAuthFormProps {
  mode?: 'inline' | 'modal' | 'header';
  applicationId?: string;
  onSuccess?: (user: UserAuthData) => void;
  onCodeSent?: () => void;
  motivation?: string;
  showMotivation?: boolean;
  className?: string;
}

type AuthStep = 'email' | 'code' | 'success';

export function EmailAuthForm({
  mode = 'inline',
  applicationId,
  onSuccess,
  onCodeSent,
  motivation = 'Так мы сохраним ваши эскизы и сможем связаться с вами',
  showMotivation = true,
  className = ''
}: EmailAuthFormProps) {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isTestEmail, setIsTestEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedUserData, setVerifiedUserData] = useState<UserAuthData | null>(null);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-verify for test email
  useEffect(() => {
    if (isTestEmail && step === 'code') {
      // Auto-fill and submit test code after a short delay
      setTimeout(() => {
        const testCodeArray = TEST_CODE.split('');
        setCode(testCodeArray);
        // Trigger verification
        handleVerifyCode(testCodeArray.join(''));
      }, 500);
    }
  }, [isTestEmail, step]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const isTest = trimmedEmail === TEST_EMAIL;
      setIsTestEmail(isTest);

      const { data, error: apiError } = await api.requestCode({
        email: trimmedEmail,
        name: name.trim() || undefined,
        application_id: applicationId,
        subscribe_newsletter: subscribeNewsletter
      });

      if (apiError) throw apiError;

      if (data?.success) {
        setUserId(data.user_id);
        setStep('code');
        setResendCooldown(60);
        onCodeSent?.();

        // Focus first code input
        setTimeout(() => {
          codeInputRefs.current[0]?.focus();
        }, 100);
      } else {
        throw new Error(data?.message || 'Ошибка отправки кода');
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');
    if (codeToVerify.length !== 6) return;

    setError('');
    setIsLoading(true);

    try {
      const { data, error: apiError } = await api.verifyCode({
        email: email.trim().toLowerCase(),
        code: codeToVerify,
        application_id: applicationId
      });

      if (apiError) throw apiError;

      if (data?.success) {
        const userData: UserAuthData = {
          email: email.trim().toLowerCase(),
          name: data.user?.name || name.trim() || '',
          phone: data.user?.phone || undefined,
          userId: data.user_id,
          isVerified: true,
          firstName: data.user?.first_name,
          lastName: data.user?.last_name,
          telegramUsername: data.user?.telegram_username,
          subscribeNewsletter: data.user?.subscribe_newsletter || subscribeNewsletter
        };

        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userEmail', userData.email);
        if (userData.name) {
          localStorage.setItem('userName', userData.name);
        }
        if (userData.phone) {
          localStorage.setItem('userPhone', userData.phone);
        }

        // Dispatch storage event for other components
        window.dispatchEvent(new Event('storage'));

        // Show success step before calling onSuccess
        setVerifiedUserData(userData);
        setStep('success');
      } else {
        setError(data?.error || 'Неверный код');
        setCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка проверки кода');
      setCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only last digit
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(d => d) && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedText.length === 6) {
      const newCode = pastedText.split('');
      setCode(newCode);
      handleVerifyCode(pastedText);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      const { data, error: apiError } = await api.requestCode({
        email: email.trim().toLowerCase(),
        application_id: applicationId,
        subscribe_newsletter: subscribeNewsletter
      });

      if (apiError) throw apiError;

      if (data?.success) {
        setResendCooldown(60);
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка повторной отправки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setCode(['', '', '', '', '', '']);
    setError('');
  };

  // Compact mode for header
  const isCompact = mode === 'header';

  return (
    <div className={`${className} ${isCompact ? 'p-3' : 'p-4'}`}>
      {step === 'email' ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          {showMotivation && !isCompact && (
            <p className="text-sm text-muted-foreground text-center">
              {motivation}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className={isCompact ? 'text-xs' : ''}>
              Ваше имя
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Как вас зовут?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`pl-10 ${isCompact ? 'h-9 text-sm' : ''}`}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className={isCompact ? 'text-xs' : ''}>
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${isCompact ? 'h-9 text-sm' : ''}`}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="newsletter"
              checked={subscribeNewsletter}
              onCheckedChange={(checked) => setSubscribeNewsletter(checked as boolean)}
              className="mt-0.5"
            />
            <Label
              htmlFor="newsletter"
              className={`leading-tight cursor-pointer ${isCompact ? 'text-xs' : 'text-sm'}`}
            >
              Получать уведомления о скидках и новинках
            </Label>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className={`w-full ${isCompact ? 'h-9' : ''}`}
            disabled={isLoading || !email.trim() || !name.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправляем...
              </>
            ) : (
              'Получить код'
            )}
          </Button>
        </form>
      ) : step === 'code' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </button>

          <div className="text-center space-y-1">
            <p className={isCompact ? 'text-sm' : ''}>
              Код отправлен на
            </p>
            <p className={`font-medium ${isCompact ? 'text-sm' : ''}`}>
              {email}
            </p>
            {isTestEmail && (
              <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                <Check className="h-3 w-3" />
                Тестовый аккаунт - код вводится автоматически
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (codeInputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                onPaste={index === 0 ? handleCodePaste : undefined}
                className={`w-10 h-12 text-center text-lg font-mono ${isCompact ? 'w-8 h-10' : ''}`}
                disabled={isLoading || isTestEmail}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isLoading}
              className={`text-sm ${
                resendCooldown > 0
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-primary hover:underline'
              }`}
            >
              {resendCooldown > 0
                ? `Отправить повторно через ${resendCooldown}с`
                : 'Отправить код повторно'}
            </button>
          </div>
        </div>
      ) : (
        // Success step - show cabinet created message
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {verifiedUserData?.name ? `${verifiedUserData.name}, добро пожаловать!` : 'Добро пожаловать!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Теперь у вас есть личный кабинет. Там сохраняются все ваши эскизы и заказы.
            </p>
          </div>

          <Button
            onClick={() => {
              if (verifiedUserData) {
                onSuccess?.(verifiedUserData);
              }
            }}
            className="w-full"
          >
            Продолжить
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmailAuthForm;
