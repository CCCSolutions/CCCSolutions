import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mirrors Supabase's GitHubButton kFormatter: 12 → "12", 1500 → "1.5K", 101700 → "101.7K"
export function kFormatter(num: number): string {
  if (num < 1000) return String(num);
  const kFormat = Math.floor(num / 1000);
  const lastTwoDigits = num % 1000;
  const decimalPart = Math.floor((lastTwoDigits % 100) / 10);
  const hundreds = Math.floor(lastTwoDigits / 100);
  const isAlmostNextThousand = decimalPart >= 8 && hundreds >= 9;
  const showDecimals =
    (!isAlmostNextThousand && hundreds >= 1) || (hundreds === 0 && decimalPart >= 8);
  return showDecimals
    ? `${kFormat}.${decimalPart >= 8 ? hundreds + 1 : hundreds}K`
    : `${isAlmostNextThousand ? kFormat + 1 : kFormat}K`;
}
