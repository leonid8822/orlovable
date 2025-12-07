import { Gem } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthButton } from "./AuthButton";
interface HeaderProps {
  applicationId?: string | null;
}
export function Header({
  applicationId
}: HeaderProps) {
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold group-hover:shadow-glow transition-shadow duration-300">
            <Gem className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl text-foreground tracking-wide">OL<span className="text-gradient-gold">Jewelry</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {applicationId && <span className="text-xs text-muted-foreground hidden sm:block font-mono">
              #{applicationId.slice(0, 8)}
            </span>}
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
              Создать
            </Link>
            <Link to="/examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
              Примеры работ
            </Link>
          </nav>

          <AuthButton />
        </div>
      </div>
    </header>;
}