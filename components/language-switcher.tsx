'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { locales, localeNames, Locale } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-white hover:text-white"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSelect(loc)}
            className={`cursor-pointer ${
              locale === loc
                ? 'bg-gray-800 text-white'
                : 'text-white hover:text-white hover:bg-gray-800'
            }`}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 简化版语言切换器（仅图标按钮，适用于空间紧凑的场景）
 */
export function LanguageSwitcherCompact() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-white"
        >
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSelect(loc)}
            className={`cursor-pointer ${
              locale === loc
                ? 'bg-gray-800 text-white'
                : 'text-white hover:text-white hover:bg-gray-800'
            }`}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
