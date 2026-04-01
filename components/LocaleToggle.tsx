'use client';

import { useLocale } from '@/lib/i18n/locale-context';

export default function LocaleToggle() {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      onClick={toggleLocale}
      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
      aria-label="Switch language"
    >
      {locale === 'zh' ? 'EN' : '中文'}
    </button>
  );
}
