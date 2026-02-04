import { Link, useLocation } from "react-router-dom";
import { EagleIcon } from "./icons/EagleIcon";
import { themeConfigs, AppTheme } from "@/contexts/ThemeContext";

// VK Icon (не входит в lucide-react)
const VkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.657 4 8.252c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.49 2.27 4.674 2.862 4.674.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.625 2.18-3.625.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z"/>
  </svg>
);

// Telegram Icon (для консистентности стиля)
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

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
        <div className="flex flex-col gap-6">
          {/* Top row */}
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
            <nav className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://t.me/olai_support"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Связаться в Telegram
              </a>
              <a
                href="mailto:help@olai.art"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Написать на help@olai.art
              </a>

              {/* Social icons */}
              <div className="flex items-center gap-3">
                <a
                  href="https://t.me/olai_art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: `${themeConfig.accentColor}20` }}
                  title="Telegram канал"
                >
                  <TelegramIcon className="w-4 h-4" style={{ color: themeConfig.accentColor }} />
                </a>
                <a
                  href="https://vk.com/olai_art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: `${themeConfig.accentColor}20` }}
                  title="ВКонтакте"
                >
                  <VkIcon className="w-4 h-4" style={{ color: themeConfig.accentColor }} />
                </a>
              </div>
            </nav>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © 2025-2026 OLAI.art
            </p>
          </div>

          {/* Bottom row - legal links and company info */}
          <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <nav className="flex flex-wrap justify-center gap-4">
              <Link to="/oferta" className="hover:text-foreground transition-colors">
                Публичная оферта
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Политика конфиденциальности
              </Link>
            </nav>
            <p className="text-center md:text-right">
              ИП Орлов Леонид Андреевич | ИНН 662342643820 | ОГРНИП 319665800217251
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
