import { useState, useEffect } from "react";
import { Button } from "./button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  // Update theme on change
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="touch-target rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
