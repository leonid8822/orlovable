import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

// Types for settings from backend
export interface FormFactorConfig {
  label: string;
  description: string;
  icon: string; // lucide icon name: 'circle', 'hexagon', 'rectangle-vertical'
  addition: string;
  shape: string;
}

export interface SizeConfig {
  label: string;
  dimensionsMm: number;
  apiSize: string;
  price: number;
}

export interface MaterialConfig {
  label: string;
  enabled: boolean;
}

// Visualization settings for pendant on neck preview
export interface VisualizationConfig {
  imageWidthMm: number; // Width of the preview image in mm (for scale calculation)
  female: {
    attachX: number; // X position of pendant attachment (0-1, from left)
    attachY: number; // Y position of pendant attachment (0-1, from top)
  };
  male: {
    attachX: number;
    attachY: number;
  };
}

export interface AppSettings {
  num_images: number;
  main_prompt: string;
  main_prompt_no_image: string;
  form_factors: Record<string, FormFactorConfig>;
  sizes: Record<string, Record<string, SizeConfig>>; // material -> size -> config
  materials: Record<string, MaterialConfig>;
  visualization: VisualizationConfig;
}

// Default settings (fallback)
const defaultSettings: AppSettings = {
  num_images: 4,
  main_prompt: "",
  main_prompt_no_image: "",
  form_factors: {
    round: {
      label: "Круглый кулон",
      description: "Круглая форма",
      icon: "circle",
      addition: "Объект вписан в круглую рамку-медальон, изящный дизайн.",
      shape: "круглая форма, объект вписан в круг"
    },
    oval: {
      label: "Жетон",
      description: "Форма жетона",
      icon: "rectangle-vertical",
      addition: "Вертикальный жетон, строгий дизайн.",
      shape: "вертикальный овал (жетон)"
    },
    contour: {
      label: "Контурный кулон",
      description: "По контуру рисунка",
      icon: "hexagon",
      addition: "Форма повторяет контур изображения, универсальный дизайн.",
      shape: "по контуру выбранного объекта"
    }
  },
  sizes: {
    silver: {
      s: { label: "S", dimensionsMm: 11, apiSize: "bracelet", price: 5000 },
      m: { label: "M", dimensionsMm: 18, apiSize: "pendant", price: 8000 },
      l: { label: "L", dimensionsMm: 25, apiSize: "interior", price: 12000 }
    },
    gold: {
      s: { label: "S", dimensionsMm: 10, apiSize: "bracelet", price: 15000 },
      m: { label: "M", dimensionsMm: 13, apiSize: "pendant", price: 22000 },
      l: { label: "L", dimensionsMm: 19, apiSize: "interior", price: 35000 }
    }
  },
  materials: {
    silver: { label: "Серебро 925", enabled: true },
    gold: { label: "Золото 585", enabled: false }
  },
  visualization: {
    imageWidthMm: 250, // Preview image represents 250mm width
    female: {
      attachX: 0.5,  // Center horizontally
      attachY: 0.5   // Middle of image
    },
    male: {
      attachX: 0.5,  // Center horizontally
      attachY: 0.75  // Lower on image (user specified -0.75 from top = 0.75 from top in 0-1 scale)
    }
  }
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refetch: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

// Convert old API format to new format
function normalizeSettings(data: any): AppSettings {
  const result = { ...defaultSettings };

  if (!data) return result;

  // Copy simple fields
  if (data.num_images) result.num_images = data.num_images;
  if (data.main_prompt) result.main_prompt = data.main_prompt;
  if (data.main_prompt_no_image) result.main_prompt_no_image = data.main_prompt_no_image;

  // Normalize form_factors - merge with defaults to preserve missing keys (like 'oval')
  if (data.form_factors) {
    result.form_factors = { ...defaultSettings.form_factors };
    for (const [key, value] of Object.entries(data.form_factors as Record<string, any>)) {
      result.form_factors[key] = {
        label: value.label || defaultSettings.form_factors[key]?.label || key,
        description: value.description || defaultSettings.form_factors[key]?.description || '',
        icon: value.icon || defaultSettings.form_factors[key]?.icon || 'square',
        addition: value.addition || defaultSettings.form_factors[key]?.addition || '',
        shape: value.shape || defaultSettings.form_factors[key]?.shape || '',
      };
    }
  }

  // Normalize sizes - handle old format (flat) vs new format (by material)
  if (data.sizes) {
    // Check if it's old format (has 'bracelet', 'pendant', 'interior' keys directly)
    if (data.sizes.bracelet || data.sizes.pendant || data.sizes.interior) {
      // Old format - convert to new
      const oldSizes = data.sizes as Record<string, { label: string; dimensions: string }>;
      result.sizes = {
        silver: {
          s: {
            label: oldSizes.bracelet?.label || 'S',
            dimensionsMm: parseInt(oldSizes.bracelet?.dimensions) || 13,
            apiSize: 'bracelet',
            price: 5000
          },
          m: {
            label: oldSizes.pendant?.label || 'M',
            dimensionsMm: parseInt(oldSizes.pendant?.dimensions) || 19,
            apiSize: 'pendant',
            price: 8000
          },
          l: {
            label: oldSizes.interior?.label || 'L',
            dimensionsMm: parseInt(oldSizes.interior?.dimensions) || 25,
            apiSize: 'interior',
            price: 12000
          },
        },
        gold: defaultSettings.sizes.gold,
      };
    } else if (data.sizes.silver || data.sizes.gold) {
      // New format - use as is
      result.sizes = data.sizes;
    }
  }

  // Normalize materials
  if (data.materials) {
    result.materials = data.materials;
  }

  // Normalize visualization
  if (data.visualization) {
    result.visualization = {
      imageWidthMm: data.visualization.imageWidthMm || defaultSettings.visualization.imageWidthMm,
      female: {
        attachX: data.visualization.female?.attachX ?? defaultSettings.visualization.female.attachX,
        attachY: data.visualization.female?.attachY ?? defaultSettings.visualization.female.attachY,
      },
      male: {
        attachX: data.visualization.male?.attachX ?? defaultSettings.visualization.male.attachX,
        attachY: data.visualization.male?.attachY ?? defaultSettings.visualization.male.attachY,
      }
    };
  }

  return result;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error: apiError } = await api.getSettings();
      if (apiError) {
        throw apiError;
      }
      if (data) {
        setSettings(normalizeSettings(data));
      }
      setError(null);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Helper hooks for specific data
export const useFormFactors = () => {
  const { settings } = useSettings();
  return settings.form_factors;
};

export const useSizes = (material: string) => {
  const { settings } = useSettings();
  return settings.sizes[material] || settings.sizes.silver;
};

export const useMaterials = () => {
  const { settings } = useSettings();
  return settings.materials;
};

export const usePrice = (material: string, size: string) => {
  const { settings } = useSettings();
  return settings.sizes[material]?.[size]?.price || 0;
};

export const useVisualization = () => {
  const { settings } = useSettings();
  return settings.visualization;
};
