import { createContext, useContext, ReactNode } from "react";

export type AppTheme = "main" | "kids" | "totems";

interface ThemeConfig {
  name: AppTheme;
  label: string;
  accentColor: string;
  accentColorLight: string;
  accentColorDark: string;
  gradientClass: string;
  textGradientClass: string;
  shadowClass: string;
  glowClass: string;
  uploadHint: string;
  uploadDescription: string;
  heroTitle: React.ReactNode;
  heroSubtitle: string;
}

export const themeConfigs: Record<AppTheme, ThemeConfig> = {
  main: {
    name: "main",
    label: "OLAI.ART",
    accentColor: "hsl(43, 74%, 45%)",
    accentColorLight: "hsl(43, 74%, 55%)",
    accentColorDark: "hsl(43, 74%, 35%)",
    gradientClass: "bg-gradient-gold",
    textGradientClass: "text-gradient-gold",
    shadowClass: "shadow-gold",
    glowClass: "shadow-glow",
    uploadHint: "Рисунок, фото, символ — всё, что несёт для вас смысл",
    uploadDescription: "Загрузите изображение, которое хотите превратить в украшение",
    heroTitle: <>Создайте <span className="text-gradient-gold">уникальное</span><br />украшение</>,
    heroSubtitle: "Превратите ваш рисунок или фотографию в эксклюзивное ювелирное изделие ручной работы",
  },
  kids: {
    name: "kids",
    label: "OLAI.KIDS",
    accentColor: "hsl(174, 58%, 38%)",
    accentColorLight: "hsl(174, 58%, 50%)",
    accentColorDark: "hsl(174, 58%, 28%)",
    gradientClass: "bg-gradient-tiffany",
    textGradientClass: "text-gradient-tiffany",
    shadowClass: "shadow-tiffany",
    glowClass: "shadow-glow-tiffany",
    uploadHint: "Сфотографируйте рисунок вашего ребёнка — карандашом, красками или фломастерами",
    uploadDescription: "Загрузите детский рисунок, который станет украшением",
    heroTitle: <>Сохраните <span className="text-gradient-tiffany">детское творчество</span><br />навсегда</>,
    heroSubtitle: "Превратите рисунок вашего ребёнка в драгоценный артефакт",
  },
  totems: {
    name: "totems",
    label: "OLAI.TOTEMS",
    accentColor: "hsl(25, 45%, 35%)",
    accentColorLight: "hsl(25, 50%, 45%)",
    accentColorDark: "hsl(25, 40%, 25%)",
    gradientClass: "bg-gradient-brown",
    textGradientClass: "text-gradient-brown",
    shadowClass: "shadow-brown",
    glowClass: "shadow-glow-brown",
    uploadHint: "Загрузите изображение животного, руны или символа, который для вас значим",
    uploadDescription: "Выберите свой тотем — животное-хранитель, руну или сакральный символ",
    heroTitle: <>Создайте свой <span className="text-gradient-brown">тотем</span><br />в скандинавском стиле</>,
    heroSubtitle: "Превратите значимый символ или животное-хранитель в ювелирный артефакт",
  },
};

interface ThemeContextType {
  theme: AppTheme;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "main",
  config: themeConfigs.main,
});

export const useAppTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  theme: AppTheme;
  children: ReactNode;
}

export const ThemeProvider = ({ theme, children }: ThemeProviderProps) => {
  const config = themeConfigs[theme];

  return (
    <ThemeContext.Provider value={{ theme, config }}>
      {children}
    </ThemeContext.Provider>
  );
};
