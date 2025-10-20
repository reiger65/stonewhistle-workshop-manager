import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Header } from './header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/lib/languageContext';
import { TranslatedText } from '@/components/ui/translated-text';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  
  const handleTabChange = (value: string) => {
    // Use normal router navigation for all routes
    setLocation(value);
  };
  
  const getCurrentTab = () => {
    const path = location.split('/')[1] || '';
    if (path === '') return '/';
    return `/${path}`;
  };

  return (
    <div className="flex flex-col min-h-screen h-screen bg-background text-foreground overflow-hidden">
      <Header 
        currentPath={getCurrentTab()}
        onNavigate={handleTabChange}
      />
      <main className={cn("flex-grow w-full h-full overflow-auto p-0 pb-0 mb-0 flex flex-col space-y-0", className)}>
        {children}
      </main>
    </div>
  );
}
