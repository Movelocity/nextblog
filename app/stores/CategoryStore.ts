import { create } from 'zustand';

interface CategoryState {
  categoryColors: { [key: string]: string };
  getColorForCategory: (category: string) => string;
}

// Predefined array of visually pleasing colors
const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-500',
  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400',
  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-400',
];

export const useCategoryStore = create<CategoryState>()((set, get) => ({
  categoryColors: {},
  
  getColorForCategory: (category: string) => {
    const { categoryColors } = get();
    
    if (!categoryColors[category]) {
      // Assign a color based on the length of current categories
      const colorIndex = Object.keys(categoryColors).length % CATEGORY_COLORS.length;
      const newColors = { ...categoryColors };
      newColors[category] = CATEGORY_COLORS[colorIndex];
      set({ categoryColors: newColors });
    }
    
    return categoryColors[category];
  },
})); 