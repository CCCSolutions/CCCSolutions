export function languageLabel(language: string): string {
  if (language === 'cpp') return 'C++';
  if (language === 'python') return 'Python';
  if (language === 'java') return 'Java';
  if (language === 'turing') return 'Turing';
  return language.toUpperCase();
}

export function difficultyClass(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'normal':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'hard':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'insane':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'wicked':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-surface-200 text-foreground-light';
  }
}
