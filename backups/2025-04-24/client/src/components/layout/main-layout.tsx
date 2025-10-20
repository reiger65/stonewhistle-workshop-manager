import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Header } from './header';
import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/lib/languageContext';
import { TranslatedText } from '@/components/ui/translated-text';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  
  const openAddOrderDialog = () => {
    setIsAddOrderOpen(true);
  };
  
  const closeAddOrderDialog = () => {
    setIsAddOrderOpen(false);
  };
  
  const handleTabChange = (value: string) => {
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
        onOpenAddOrder={openAddOrderDialog} 
        currentPath={getCurrentTab()}
        onNavigate={handleTabChange}
      />
      <main className={cn("flex-grow w-full h-full overflow-auto p-0 pb-0 mb-0 flex flex-col space-y-0", className)}>
        {children}
      </main>
      <AddOrderDialog open={isAddOrderOpen} onClose={closeAddOrderDialog} />
    </div>
  );
}
