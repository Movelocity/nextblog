import { create } from 'zustand';

interface CategoryState {
  categoryColors: { [key: string]: string };
  getColorForCategory: (category: string) => string;
}

// Predefined category classes
const CATEGORY_COLORS = [
  'category-blue',
  'category-green',
  'category-purple',
  'category-yellow',
  'category-pink',
  'category-indigo',
  'category-red',
  'category-teal',
  'category-orange',
  'category-cyan',
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