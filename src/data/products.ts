export interface SizeGuideRow {
  size: number;
  footLengthMin: number;
  footLengthMax: number;
  insoleLength: number;
}

export const SIZE_GUIDE_TABLE: SizeGuideRow[] = [
  { size: 34, footLengthMin: 22.1, footLengthMax: 22.7, insoleLength: 23.2 },
  { size: 35, footLengthMin: 22.8, footLengthMax: 23.4, insoleLength: 23.9 },
  { size: 36, footLengthMin: 23.5, footLengthMax: 24.1, insoleLength: 24.6 },
  { size: 37, footLengthMin: 24.2, footLengthMax: 24.8, insoleLength: 25.3 },
  { size: 38, footLengthMin: 24.9, footLengthMax: 25.5, insoleLength: 26.0 },
  { size: 39, footLengthMin: 25.6, footLengthMax: 26.2, insoleLength: 26.7 },
];
