import { useCallback, useEffect, useState } from "react";
export const useTheme = () => {
  const [theme, setTheme] = useState("dark");
  const [componentMounted, setComponentMounted] = useState(false);

  const setMode = useCallback((mode: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("theme", mode);
    setTheme(mode);
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      setMode("dark");
    } else {
      setMode("light");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const systemDarkMode = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    if (systemDarkMode) {
      setComponentMounted(true);
      setMode("dark");
      return;
    }
    setMode("light");
    setComponentMounted(true);
  }, [setMode]);

  return [theme, toggleTheme, componentMounted];
};
