"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * ダークモード対応（92件改善 Phase5）
 * 5.66-5.68 テーマ切り替え
 */

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("light");

  useEffect(() => {
    // システム設定を確認
    const stored = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const initialTheme = stored || (systemPrefersDark ? "dark" : "light");
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // システム設定変更を監視
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const applyTheme = (newTheme) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// テーマトグルボタン
export const ThemeToggle = ({ variant = "icon" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "switch") {
    return (
      <button
        onClick={toggleTheme}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          isDark ? "bg-slate-700" : "bg-slate-200"
        }`}
        aria-label={
          isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"
        }
      >
        <span
          className={`absolute top-1 w-6 h-6 rounded-full transition-transform flex items-center justify-center text-sm ${
            isDark
              ? "translate-x-7 bg-slate-900"
              : "translate-x-1 bg-white shadow"
          }`}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
};

export default { ThemeProvider, useTheme, ThemeToggle };
