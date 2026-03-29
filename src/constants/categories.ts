export type Category =
  | 'Food'
  | 'Shopping'
  | 'Transport'
  | 'Entertainment'
  | 'Health'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food',
  'Shopping',
  'Transport',
  'Entertainment',
  'Health',
  'Other',
];

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍜',
  Shopping: '🛍️',
  Transport: '🚗',
  Entertainment: '🎬',
  Health: '💊',
  Other: '📦',
};
