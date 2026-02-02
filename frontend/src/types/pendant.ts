// Step enum for state machine
// Flow: UPLOAD → GENERATING → SELECTION → CHECKOUT → [GEMS] → CONFIRMATION
export enum AppStep {
  UPLOAD = 'UPLOAD',
  GENERATING = 'GENERATING',
  SELECTION = 'SELECTION',
  CHECKOUT = 'CHECKOUT',       // Select material, size + order
  GEMS = 'GEMS',               // Optional: add gemstones (upsell after order)
  ENGRAVING = 'ENGRAVING',     // Legacy: kept for compatibility
  CONFIRMATION = 'CONFIRMATION'  // After payment/order success
}

// Step titles for UI
export const STEP_TITLES: Record<AppStep, string> = {
  [AppStep.UPLOAD]: 'Загрузка',
  [AppStep.GENERATING]: 'Генерация',
  [AppStep.SELECTION]: 'Выбор',
  [AppStep.CHECKOUT]: 'Оформление',
  [AppStep.GEMS]: 'Камни',
  [AppStep.ENGRAVING]: 'Гравировка',
  [AppStep.CONFIRMATION]: 'Готово'
};

// Visible steps in indicator (GENERATING is part of UPLOAD visually)
// GEMS is optional upsell after checkout, not shown in main indicator
export const VISIBLE_STEPS: AppStep[] = [AppStep.UPLOAD, AppStep.SELECTION, AppStep.CHECKOUT];

// Gem types
export type GemType = 'ruby' | 'emerald' | 'sapphire';

export interface GemPlacement {
  id: string;
  type: GemType;  // For backwards compatibility
  gemId?: string; // Reference to gem in database (new)
  x: number;  // percentage 0-100
  y: number;  // percentage 0-100
}

export interface GemConfig {
  label: string;
  color: string;
  image: string;  // Path to gem image
  gradient: string;  // Fallback gradient
}

export const GEM_CONFIG: Record<GemType, GemConfig> = {
  ruby: {
    label: 'Рубин',
    color: '#E31C25',
    image: '/gems/ruby.png',
    gradient: 'radial-gradient(circle at 30% 30%, #ff6b6b, #E31C25 40%, #8B0000 100%)'
  },
  emerald: {
    label: 'Изумруд',
    color: '#50C878',
    image: '/gems/emerald.png',
    gradient: 'radial-gradient(circle at 30% 30%, #98FB98, #50C878 40%, #006400 100%)'
  },
  sapphire: {
    label: 'Сапфир',
    color: '#0F52BA',
    image: '/gems/sapphire.png',
    gradient: 'radial-gradient(circle at 30% 30%, #6495ED, #0F52BA 40%, #000080 100%)'
  }
};

// Form factors - теперь выбираются отдельно от размера
export type FormFactor = 'round' | 'oval' | 'contour';
export type Material = 'silver' | 'gold';
export type Size = 'interior' | 'pendant' | 'bracelet';

// Size option - выбирается в конце, зависит от материала
export type SizeOption = 's' | 'm' | 'l';

// Конфигурация формы (выбирается в начале)
export interface FormConfig {
  label: string;
  description: string;
  gender: string;
  icon: string; // emoji или иконка
}

export const FORM_CONFIG: Record<FormFactor, FormConfig> = {
  round: {
    label: 'Женская',
    description: 'Круглый кулон',
    gender: 'женский',
    icon: '○'
  },
  oval: {
    label: 'Мужская',
    description: 'Вертикальный жетон',
    gender: 'мужской',
    icon: '⬭'
  },
  contour: {
    label: 'Контурная',
    description: 'По контуру рисунка',
    gender: 'универсальный',
    icon: '◇'
  }
};

// Конфигурация размера (зависит от материала)
export interface SizeConfig {
  label: string;
  dimensionsMm: number;
  dimensions: string;
  apiSize: Size;
}

// Размеры для серебра: S=13мм, M=19мм, L=25мм
export const SILVER_SIZE_CONFIG: Record<SizeOption, SizeConfig> = {
  s: {
    label: 'S',
    dimensionsMm: 13,
    dimensions: '13мм',
    apiSize: 'bracelet'
  },
  m: {
    label: 'M',
    dimensionsMm: 19,
    dimensions: '19мм',
    apiSize: 'pendant'
  },
  l: {
    label: 'L',
    dimensionsMm: 25,
    dimensions: '25мм',
    apiSize: 'interior'
  }
};

// Размеры для золота: S=10мм, M=13мм, L=19мм
export const GOLD_SIZE_CONFIG: Record<SizeOption, SizeConfig> = {
  s: {
    label: 'S',
    dimensionsMm: 10,
    dimensions: '10мм',
    apiSize: 'bracelet'
  },
  m: {
    label: 'M',
    dimensionsMm: 13,
    dimensions: '13мм',
    apiSize: 'pendant'
  },
  l: {
    label: 'L',
    dimensionsMm: 19,
    dimensions: '19мм',
    apiSize: 'interior'
  }
};

// Функция для получения конфига размеров по материалу
export function getSizeConfigByMaterial(material: Material): Record<SizeOption, SizeConfig> {
  return material === 'gold' ? GOLD_SIZE_CONFIG : SILVER_SIZE_CONFIG;
}

// Legacy SIZE_CONFIG для совместимости (используем серебро по умолчанию)
export const SIZE_CONFIG: Record<SizeOption, SizeConfig & { formFactor: FormFactor; gender: string; description: string }> = {
  s: {
    label: 'S',
    dimensions: '13мм',
    dimensionsMm: 13,
    formFactor: 'round',
    gender: 'женский',
    description: 'Круглый кулон',
    apiSize: 'bracelet'
  },
  m: {
    label: 'M',
    dimensions: '19мм',
    dimensionsMm: 19,
    formFactor: 'oval',
    gender: 'мужской',
    description: 'Жетон',
    apiSize: 'pendant'
  },
  l: {
    label: 'L',
    dimensions: '25мм',
    dimensionsMm: 25,
    formFactor: 'contour',
    gender: 'универсальный',
    description: 'Контурный',
    apiSize: 'interior'
  }
};

// User auth data collected during generation
export interface UserAuthData {
  email: string;
  name: string;
  phone?: string;
  userId?: string;
  isVerified: boolean;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
  subscribeNewsletter?: boolean;
}

// Main pendant configuration
export interface PendantConfig {
  // Image data
  image: File | null;
  imagePreview: string | null;

  // Generation results
  generatedImages: string[];
  generatedThumbnails: string[];  // Smaller versions for selection grid
  selectedVariantIndex: number;
  generatedPreview: string | null;

  // User input
  comment: string;
  orderComment: string;

  // Configuration
  sizeOption: SizeOption;
  formFactor: FormFactor;
  material: Material;
  size: Size; // for API compatibility

  // User auth data (collected during GENERATING step)
  userAuth: UserAuthData;

  // Gems placement (admin feature)
  gems: GemPlacement[];

  // Back engraving (flat pendants only)
  backEngraving: string;
  hasBackEngraving: boolean;

  // Legacy fields (kept for compatibility)
  backImage: File | null;
  backImagePreview: string | null;
  backComment: string;
}

export const initialPendantConfig: PendantConfig = {
  image: null,
  imagePreview: null,
  generatedImages: [],
  generatedThumbnails: [],
  selectedVariantIndex: 0,
  generatedPreview: null,
  comment: '',
  orderComment: '',
  sizeOption: 'm',  // Default: M
  formFactor: 'round',
  material: 'silver',
  size: 'pendant',  // M = pendant
  // User auth
  userAuth: {
    email: '',
    name: '',
    isVerified: false,
  },
  // Gems
  gems: [],
  // Engraving
  backEngraving: '',
  hasBackEngraving: false,
  // Legacy
  backImage: null,
  backImagePreview: null,
  backComment: '',
};

// Helper to get API size from size option and material
export function getApiSizeFromOption(sizeOption: SizeOption, material: Material): Size {
  const config = getSizeConfigByMaterial(material);
  return config[sizeOption].apiSize;
}

// Legacy helper (kept for compatibility)
export function getSizeConfigWithDefaults(sizeOption: SizeOption): {
  formFactor: FormFactor;
  size: Size;
} {
  const config = SIZE_CONFIG[sizeOption];
  return {
    formFactor: config.formFactor,
    size: config.apiSize
  };
}

// Legacy labels (kept for compatibility)
export const sizeLabels: Record<Size, string> = {
  interior: 'В интерьер',
  pendant: 'В кулон',
  bracelet: 'В браслет',
};

export const sizeDimensions: Record<Size, string> = {
  interior: '25 мм',
  pendant: '19 мм',
  bracelet: '13 мм',
};

export const materialLabels: Record<Material, string> = {
  silver: 'Серебро 925',
  gold: 'Золото 585',
};

export const formFactorLabels: Record<FormFactor, string> = {
  round: 'Круглая',
  oval: 'Жетон',
  contour: 'Контурная',
};
