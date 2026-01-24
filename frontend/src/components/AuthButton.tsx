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
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  name: string;
}

export function AuthButton() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    // Listen for storage changes (in case of login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    setUser(null);
    toast.success('Вы вышли из аккаунта');
    navigate('/');
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">
              {user.name || user.email?.split('@')[0]}
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
    <Button
      variant="goldOutline"
      size="sm"
      onClick={() => navigate('/auth')}
      className="gap-2"
    >
      <LogIn className="w-4 h-4" />
      <span className="hidden md:inline">Войти</span>
    </Button>
  );
}
