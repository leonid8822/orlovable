import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AuthButton } from "./AuthButton";
import { EagleIcon } from "./icons/EagleIcon";
import { themeConfigs, AppTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  applicationId?: string | null;
  minimal?: boolean;  // Hide navigation links for focused experience
  theme?: AppTheme;   // Override active theme for application pages
  userName?: string;  // User name to display in minimal mode
}

const themeLinks: { theme: AppTheme; path: string; label: string }[] = [
  { theme: "main", path: "/", label: "Главная" },
  { theme: "totems", path: "/totems", label: "Тотемы" },
  { theme: "kids", path: "/kids", label: "Kids" },
];

export function Header({
  applicationId,
  minimal = false,
  theme,
  userName,
}: HeaderProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active theme based on current path or override
  const getActiveTheme = (): AppTheme => {
    if (theme) return theme;
    if (location.pathname === "/kids") return "kids";
    if (location.pathname === "/totems") return "totems";
    if (location.pathname === "/custom") return "custom";
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
              className="w-10 h-10 rounded-full flex items-center justify-center transition-shadow duration-300 overflow-hidden p-1"
              style={{
                background: `linear-gradient(135deg, ${themeConfig.accentColorLight} 0%, ${themeConfig.accentColor} 100%)`,
                boxShadow: `0 4px 14px ${themeConfig.accentColor}40`,
              }}
            >
              <EagleIcon className="w-full h-full" />
            </div>
            <span className="font-display text-xl tracking-wide">
              <span className="text-muted-foreground">{logoText.prefix}</span>
              <span style={{ color: themeConfig.accentColor }}>{logoText.suffix}</span>
            </span>
          </Link>

          {/* Theme navigation - hidden in minimal mode */}
          {!minimal && (
            <nav className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1 bg-card/50 rounded-lg p-1 border border-border/50 min-w-[220px]">
                {themeLinks.map(({ theme: linkTheme, path, label }) => {
                  const isActive = activeTheme === linkTheme;
                  const linkThemeConfig = themeConfigs[linkTheme];
                  return (
                    <Link
                      key={linkTheme}
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
              </div>

              {/* Ideas link */}
              <Link
                to="/ideas"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  location.pathname === "/ideas"
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
                style={location.pathname === "/ideas" ? {
                  backgroundColor: themeConfig.accentColor,
                } : undefined}
              >
                Галерея
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Show user name in minimal mode */}
          {minimal && userName && (
            <span className="text-sm font-medium" style={{ color: themeConfig.accentColor }}>
              {userName}
            </span>
          )}

          {applicationId && (
            <span className="text-xs text-muted-foreground hidden sm:block font-mono">
              #{applicationId.slice(0, 8)}
            </span>
          )}

          {/* Mobile menu button - show only when not minimal */}
          {!minimal && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-card/50 transition-colors"
              style={{ color: themeConfig.accentColor }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          {!minimal && <div className="hidden md:block"><AuthButton /></div>}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {!minimal && mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {/* Theme links */}
            {themeLinks.map(({ theme: linkTheme, path, label }) => {
              const isActive = activeTheme === linkTheme;
              const linkThemeConfig = themeConfigs[linkTheme];
              return (
                <Link
                  key={linkTheme}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                  style={isActive ? {
                    backgroundColor: linkThemeConfig.accentColor,
                  } : undefined}
                >
                  {label}
                </Link>
              );
            })}

            {/* Gallery link */}
            <Link
              to="/ideas"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2 rounded-lg text-sm font-medium transition-all",
                location.pathname === "/ideas"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
              style={location.pathname === "/ideas" ? {
                backgroundColor: themeConfig.accentColor,
              } : undefined}
            >
              Галерея
            </Link>

            {/* Auth button */}
            <div className="pt-2 border-t border-border/50">
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}