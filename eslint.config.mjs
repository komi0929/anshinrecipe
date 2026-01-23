import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  // 無視するファイル
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },

  // JavaScript/JSX ファイル
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@next/next": nextPlugin,
    },
    rules: {
      // ESLint recommended
      ...js.configs.recommended.rules,

      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // Next.js recommended
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // カスタムルール
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off", // 開発中はconsole許可
      "react-refresh/only-export-components": "off", // Next.jsと競合するためオフ

      // 品質向上ルール
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "warn",
    },
  },
];
