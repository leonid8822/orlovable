export type FormFactor = 'round' | 'contour';
export type Material = 'silver' | 'gold';
export type Size = 'lite' | 'standard' | 'medium' | 'maxi';

export interface SizeInfo {
  label: string;
  diameter: string;
  price: number;
}

export interface Stone {
  x: number;
  y: number;
  type: 'sapphire' | 'diamond' | 'ruby';
}

export interface VisualizationImages {
  hand?: string;
  neck?: string;
  frame?: string;
}

export interface ProductConfig {
  // Step 1: Input
  image: File | null;
  imagePreview: string | null;
  comment: string;
  formFactor: FormFactor;
  
  // Step 2: Generated variants
  generatedVariants?: string[];  // Array of 2 variant image URLs
  
  // Step 3: Selected variant
  selectedVariantIndex?: number;  // 0 or 1
  selectedVariantUrl?: string;
  
  // Step 4: Size and material
  material: Material;
  size: Size;
  visualizationImages?: VisualizationImages;
  
  // Step 6: 3D model
  model3dUrl?: string;
  model3dRequestId?: string;
  model3dStatus?: 'pending' | 'completed' | 'failed';
  
  // Step 7: Stones
  stones?: Stone[];
  stonesCostCents?: number;
  finalImages?: string[];  // Массив URL изображений с камнями (S3 URLs)
  
  // Step 8: Payment
  totalCostCents?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  
  // Legacy fields (for backward compatibility)
  generatedPreview?: string | null;
  backImage?: File | null;
  backImagePreview?: string | null;
  backComment?: string;
  hasBackEngraving?: boolean;
}

export const initialProductConfig: ProductConfig = {
  image: null,
  imagePreview: null,
  comment: '',
  formFactor: 'round',
  material: 'silver',
  size: 'standard',
  stones: [],
  stonesCostCents: 0,
};

// Silver sizes with diameters and prices
export const silverSizes: Record<Size, SizeInfo> = {
  lite: { label: 'Lite', diameter: '1.64 см', price: 6800 },
  standard: { label: 'Standard', diameter: '2.02 см', price: 9800 },
  medium: { label: 'Medium', diameter: '3.11 см', price: 16800 },
  maxi: { label: 'Maxi', diameter: '4.56 см', price: 28800 },
};

// Legacy size labels for backward compatibility
export const sizeLabels: Record<Size, string> = {
  lite: 'Lite',
  standard: 'Standard',
  medium: 'Medium',
  maxi: 'Maxi',
};

export const sizeDimensions: Record<Size, string> = {
  lite: '1.64 см',
  standard: '2.02 см',
  medium: '3.11 см',
  maxi: '4.56 см',
};

export const sizePrices: Record<Size, number> = {
  lite: 6800,
  standard: 9800,
  medium: 16800,
  maxi: 28800,
};

export const materialLabels: Record<Material, string> = {
  silver: 'Серебро 925',
  gold: 'Золото 585',
};

export const formFactorLabels: Record<FormFactor, string> = {
  round: 'Круглый кулон',
  contour: 'Контурный кулон',
};

// Helper to format price
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

