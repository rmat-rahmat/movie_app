import i18next from 'i18next';
import type { CategoryItem } from '@/types/Dashboard';

/**
 * Get the localized category name from categoryLangLabel based on current language
 * @param category - The category item containing categoryLangLabel
 * @param fallbackLang - Fallback language if current language is not available (default: 'en')
 * @returns Localized category name or fallback
 */
export function getLocalizedCategoryName(category: CategoryItem, fallbackLang: string = 'en'): string {
  // Get current language from i18next, fallback to browser language or 'en'
  const currentLang = (i18next && i18next.language) 
    ? i18next.language 
    : (typeof window !== 'undefined' && navigator.language ? navigator.language.split('-')[0] : 'en');

  // If categoryLangLabel exists and has the current language, use it
  if (category.categoryLangLabel && category.categoryLangLabel[currentLang]) {
    return category.categoryLangLabel[currentLang];
  }

  // Try fallback language if current language not available
  if (category.categoryLangLabel && category.categoryLangLabel[fallbackLang]) {
    return category.categoryLangLabel[fallbackLang];
  }

  // Try English as ultimate fallback
  if (category.categoryLangLabel && category.categoryLangLabel['en']) {
    return category.categoryLangLabel['en'];
  }

  // If no categoryLangLabel, fall back to old categoryName or categoryAlias
  return category.categoryName || category.categoryAlias || category.id;
}