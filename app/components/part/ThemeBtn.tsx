"use client";

import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeBtn() {
  const [theme, setTheme] = useState<Theme>("light");

  const updateTheme = (newTheme: "light" | "dark") => {
    if(newTheme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setTheme(newTheme);
  }

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme || "light";
    updateTheme(storedTheme);
  }, []);

  const handleToggle = () => {
    updateTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      onClick={handleToggle}
    >
      {theme === "light" ? (
        <RiSunFill className="w-4 h-4" />
      ) : (
        <RiMoonFill className="w-4 h-4" />
      )}
    </button>
  );
}