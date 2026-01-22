import { Link, useLocation } from "react-router-dom";
import { EagleIcon } from "./icons/EagleIcon";
import { themeConfigs, AppTheme } from "@/contexts/ThemeContext";

export function Footer() {
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

  return (
    <footer className="border-t border-border/50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${themeConfig.accentColorLight} 0%, ${themeConfig.accentColor} 100%)`,
              }}
            >
              <EagleIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg">
              <span className="text-muted-foreground">{logoText.prefix}</span>
              <span style={{ color: themeConfig.accentColor }}>{logoText.suffix}</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/examples" className="hover:text-foreground transition-colors">
              Примеры работ
            </Link>
            <a
              href="https://t.me/olaiartsupport"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Telegram
            </a>
            <a
              href="mailto:hello@olai.art"
              className="hover:text-foreground transition-colors"
            >
              hello@olai.art
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OLAI.art
          </p>
        </div>
      </div>
    </footer>
  );
}
