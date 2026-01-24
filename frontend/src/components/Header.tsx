import { Link, useLocation } from "react-router-dom";
import { AuthButton } from "./AuthButton";
import { EagleIcon } from "./icons/EagleIcon";
import { themeConfigs, AppTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  applicationId?: string | null;
}

const themeLinks: { theme: AppTheme; path: string; label: string }[] = [
  { theme: "main", path: "/", label: "Главная" },
  { theme: "kids", path: "/kids", label: "Kids" },
  { theme: "totems", path: "/totems", label: "Тотемы" },
];

export function Header({
  applicationId
}: HeaderProps) {
  const location = useLocation();

  // Determine active theme based on current path
  const getActiveTheme = (): AppTheme => {
    if (location.pathname === "/kids") return "kids";
    if (location.pathname === "/totems") return "totems";
    return "main";
  };
  const activeTheme = getActiveTheme();
  const themeConfig = themeConfigs[activeTheme];

  // Logo text based on active theme
  const getLogoText = () => {
    switch (activeTheme) {
      case "kids":
        return { prefix: "OLAI", suffix: "Kids" };
      case "totems":
        return { prefix: "OLAI", suffix: "Totems" };
      default:
        return { prefix: "OLAI", suffix: "art" };
    }
  };
  const logoText = getLogoText();

  // Logo link goes to the current theme's landing
  const logoLink = activeTheme === "main" ? "/" : `/${activeTheme}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={logoLink} className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-shadow duration-300"
              style={{
                background: `linear-gradient(135deg, ${themeConfig.accentColorLight} 0%, ${themeConfig.accentColor} 100%)`,
                boxShadow: `0 4px 14px ${themeConfig.accentColor}40`,
              }}
            >
              <EagleIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl tracking-wide">
              <span className="text-muted-foreground">{logoText.prefix}</span>
              <span style={{ color: themeConfig.accentColor }}>{logoText.suffix}</span>
            </span>
          </Link>

          {/* Theme navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-card/50 rounded-lg p-1 border border-border/50">
            {themeLinks.map(({ theme, path, label }) => {
              const isActive = activeTheme === theme;
              const linkThemeConfig = themeConfigs[theme];
              return (
                <Link
                  key={theme}
                  to={path}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card"
                  )}
                  style={isActive ? {
                    backgroundColor: linkThemeConfig.accentColor,
                  } : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {applicationId && (
            <span className="text-xs text-muted-foreground hidden sm:block font-mono">
              #{applicationId.slice(0, 8)}
            </span>
          )}

<AuthButton />
        </div>
      </div>
    </header>
  );
}