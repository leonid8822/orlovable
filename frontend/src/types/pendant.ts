// Step enum for state machine
export enum AppStep {
  UPLOAD = 'UPLOAD',
  GENERATING = 'GENERATING',
  SELECTION = 'SELECTION',
  CHECKOUT = 'CHECKOUT'
}

// Step titles for UI
export const STEP_TITLES: Record<AppStep, string> = {
  [AppStep.UPLOAD]: 'Загрузка',
  [AppStep.GENERATING]: 'Генерация',
  [AppStep.SELECTION]: 'Выбор',
  [AppStep.CHECKOUT]: 'Оформление'
};

// Visible steps in indicator (GENERATING is part of UPLOAD visually)
export const VISIBLE_STEPS: AppStep[] = [AppStep.UPLOAD, AppStep.SELECTION, AppStep.CHECKOUT];

// Form factors
export type FormFactor = 'round' | 'contour' | 'oval';
export type Material = 'silver' | 'gold';
export type Size = 'interior' | 'pendant' | 'bracelet';

// New size option system
export type SizeOption = 's' | 'm' | 'l';

export interface SizeConfig {
  label: string;
  dimensions: string;
  dimensionsMm: number;
  formFactor: FormFactor;
  gender: string;
  description: string;
  apiSize: Size; // for API compatibility
}

export const SIZE_CONFIG: Record<SizeOption, SizeConfig> = {
  s: {
    label: 'S',
    dimensions: '11мм',
    dimensionsMm: 11,
    formFactor: 'round',
    gender: 'женский',
    description: 'Круглый кулон',
    apiSize: 'bracelet'
  },
  m: {
    label: 'M',
    dimensions: '18мм',
    dimensionsMm: 18,
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

// Main pendant configuration
export interface PendantConfig {
  // Image data
  image: File | null;
  imagePreview: string | null;

  // Generation results
  generatedImages: string[];
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

  // Legacy fields (kept for compatibility, not used in new flow)
  backImage: File | null;
  backImagePreview: string | null;
  backComment: string;
  hasBackEngraving: boolean;
}

export const initialPendantConfig: PendantConfig = {
  image: null,
  imagePreview: null,
  generatedImages: [],
  selectedVariantIndex: 0,
  generatedPreview: null,
  comment: '',
  orderComment: '',
  sizeOption: 's',
  formFactor: 'round',
  material: 'silver',
  size: 'bracelet',
  // Legacy
  backImage: null,
  backImagePreview: null,
  backComment: '',
  hasBackEngraving: false,
};

// Helper to get size config and update related fields
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
  pendant: '18 мм',
  bracelet: '11 мм',
};

export const materialLabels: Record<Material, string> = {
  silver: 'Серебро 925',
  gold: 'Золото 585',
};

export const formFactorLabels: Record<FormFactor, string> = {
  round: 'Круглый',
  contour: 'Контурный',
  oval: 'Жетон',
};
