import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, LogOut, LogIn, FolderOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { EmailAuthForm } from '@/components/EmailAuthForm';
import { UserAuthData } from '@/types/pendant';

interface UserData {
  id?: string;
  userId?: string;
  email: string;
  name?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export function AuthButton() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    // Check for user in localStorage
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();

    // Listen for storage changes (login/logout in other tabs or components)
    const handleStorageChange = () => {
      checkUser();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    toast.success('Вы вышли из аккаунта');
    navigate('/');
  };

  const handleAuthSuccess = (userData: UserAuthData) => {
    setUser({
      id: userData.userId,
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName
    });
    setIsAuthOpen(false);
    toast.success('Вы успешно вошли!');
  };

  const getDisplayName = () => {
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.name) {
      return user.name;
    }
    return user?.email?.split('@')[0] || 'Профиль';
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">
              {getDisplayName()}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Мои заказы
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Popover open={isAuthOpen} onOpenChange={setIsAuthOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="goldOutline"
          size="sm"
          className="gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden md:inline">Войти</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <EmailAuthForm
          mode="header"
          onSuccess={handleAuthSuccess}
          showMotivation={false}
        />
      </PopoverContent>
    </Popover>
  );
}
