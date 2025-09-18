import { ThemeProvider } from "../ThemeProvider";
import { Button } from "@/components/ui/button";
import { useTheme } from "../ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("light")}
        data-testid="button-theme-light"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("dark")}
        data-testid="button-theme-dark"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("system")}
        data-testid="button-theme-system"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ThemeProviderExample() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="p-4 bg-background text-foreground min-h-screen">
        <h3 className="text-lg font-semibold mb-4">Theme Provider Example</h3>
        <ThemeToggle />
        <div className="mt-4 p-4 bg-card border border-card-border rounded-md">
          <p className="text-card-foreground">
            This demonstrates the theme provider in action. Try switching between themes.
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}