import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Same ruleset as the old .eslintrc.json. `next lint` was removed in Next 16, so this runs
// through the ESLint CLI instead.
const eslintConfig = [
  ...nextCoreWebVitals,
  // New in eslint-config-next 16 (React Compiler rules). Existing code trips them in ~17 files;
  // warn until those effects are refactored so the Next bump does not also rewrite components.
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      '.wrangler/**',
      'node_modules/**',
      'public/**',
      'next-env.d.ts',
      'cloudflare-env.d.ts',
    ],
  },
];

export default eslintConfig;
