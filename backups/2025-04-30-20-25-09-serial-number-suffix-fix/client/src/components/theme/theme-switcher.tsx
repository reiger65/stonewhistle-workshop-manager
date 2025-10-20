import { useState } from 'react';
import { useTheme, getThemeByName, themes, ThemeName } from './theme-context';
import { Check, Moon, Sun, Settings2, Contrast, Apple } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(currentTheme);

  // Add icons to themes for display
  const themesWithIcons = themes.map(theme => {
    return {
      ...theme,
      icon: getThemeIcon(theme.name)
    };
  });

  // Function to get icon for theme
  function getThemeIcon(themeName: ThemeName) {
    switch (themeName) {
      case 'stonefired':
        return <Settings2 className="h-4 w-4" />;
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'high-contrast':
        return <Contrast className="h-4 w-4" />;
      case 'apple':
        return <Apple className="h-4 w-4" />;
      default:
        return <Settings2 className="h-4 w-4" />;
    }
  }

  const handleThemeChange = (value: ThemeName) => {
    setSelectedTheme(value);
    setTheme(value);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Choose a theme for the workshop interface
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedTheme} 
          onValueChange={(value) => handleThemeChange(value as ThemeName)}
          className="grid grid-cols-1 gap-4"
        >
          {themesWithIcons.map((theme) => (
            <div key={theme.name} className="space-y-2">
              <Label
                htmlFor={`theme-${theme.name}`}
                className="flex flex-col space-y-2 cursor-pointer"
              >
                <RadioGroupItem 
                  value={theme.name} 
                  id={`theme-${theme.name}`} 
                  className="sr-only" 
                />
                <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${selectedTheme === theme.name ? 'border-primary' : 'border-border'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                      {theme.icon}
                    </div>
                    <div>
                      <div className="font-medium">{theme.label}</div>
                      <div className="text-xs text-muted-foreground">{theme.description}</div>
                    </div>
                  </div>
                  {selectedTheme === theme.name && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>

                {/* Theme preview */}
                <div className="border rounded-md overflow-hidden" style={{ background: theme.rowEven }}>
                  <div className="h-8" style={{ background: theme.headerBg, color: theme.headerText }}>
                    <div className="flex items-center h-full px-2 text-xs font-medium">
                      Worksheet Preview
                    </div>
                  </div>
                  <div style={{ fontSize: theme.fontSize || '0.8rem' }}>
                    <div className="flex border-b" style={{ backgroundColor: theme.rowOdd }}>
                      <div className="p-1 border-r font-medium" style={{ width: '30%', background: theme.headerBg, color: theme.headerText }}>SW-001</div>
                      <div className="p-1 border-r" style={{ width: '35%' }}>INNATO</div>
                      <div className="p-1" style={{ width: '35%', backgroundColor: theme.materialColumnBg }}>□</div>
                    </div>
                    <div className="flex border-b" style={{ backgroundColor: theme.rowEven }}>
                      <div className="p-1 border-r font-medium" style={{ width: '30%', background: theme.headerBg, color: theme.headerText }}>SW-002</div>
                      <div className="p-1 border-r" style={{ width: '35%' }}>ZEN</div>
                      <div className="p-1" style={{ width: '35%', backgroundColor: theme.materialColumnBg }}>□</div>
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        All theme settings are saved automatically and persist across sessions
      </CardFooter>
    </Card>
  );
}