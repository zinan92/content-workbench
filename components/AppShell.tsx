'use client';

import type { ReactNode } from 'react';
import { LocaleProvider, useLocale } from '@/lib/i18n/locale-context';
import LocaleToggle from './LocaleToggle';

function AppHeader() {
  const { t } = useLocale();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('app.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('app.subtitle')}
            </p>
          </div>
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </LocaleProvider>
  );
}
