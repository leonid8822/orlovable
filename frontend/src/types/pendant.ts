export type FormFactor = 'round' | 'contour';
export type Material = 'silver' | 'gold';
export type Size = 'interior' | 'pendant' | 'bracelet';

export interface PendantConfig {
  image: File | null;
  imagePreview: string | null;
  generatedPreview: string | null;
  comment: string;
  formFactor: FormFactor;
  material: Material;
  size: Size;
  backImage: File | null;
  backImagePreview: string | null;
  backComment: string;
  hasBackEngraving: boolean;
}

export const initialPendantConfig: PendantConfig = {
  image: null,
  imagePreview: null,
  generatedPreview: null,
  comment: '',
  formFactor: 'round',
  material: 'gold',
  size: 'pendant',
  backImage: null,
  backImagePreview: null,
  backComment: '',
  hasBackEngraving: false,
};

export const sizeLabels: Record<Size, string> = {
  interior: 'В интерьер',
  pendant: 'В кулон',
  bracelet: 'В браслет',
};

export const sizeDimensions: Record<Size, string> = {
  interior: '40 мм',
  pendant: '25 мм',
  bracelet: '11 мм',
};

export const materialLabels: Record<Material, string> = {
  silver: 'Серебро 925',
  gold: 'Золото 585',
};

export const formFactorLabels: Record<FormFactor, string> = {
  round: 'Круглый кулон',
  contour: 'Контурный кулон',
};
