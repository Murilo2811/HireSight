import React, { useState, useEffect } from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import Sheet from '../ui/Sheet';
import { EyeIcon, SunIcon, MoonIcon, LogInIcon, LogOutIcon, MenuIcon } from '../icons';

interface NavbarProps {
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, onLoginClick, onLogoutClick }) => {
  const { language, setLanguage, t } = useTranslations();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    return 'light';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const navContent = (
    <>
      <Button variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
        {t('navbar.features')}
      </Button>
      
      {/* Language Dropdown */}
      <div className="flex items-center gap-1">
        <Button variant={language === 'pt' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('pt')}>🇧🇷 PT</Button>
        <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')}>🇺🇸 EN</Button>
        <Button variant={language === 'es' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('es')}>🇪🇸 ES</Button>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {isLoggedIn ? (
        <Button onClick={onLogoutClick}>
          <LogOutIcon className="mr-2 h-4 w-4" /> {t('navbar.logout')}
        </Button>
      ) : (
        <Button onClick={onLoginClick}>
          <LogInIcon className="mr-2 h-4 w-4" /> {t('navbar.login')}
        </Button>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center px-4">
        <a href="#" className="flex items-center gap-2 mr-6">
          <EyeIcon className="h-8 w-8" />
          <span className="font-bold text-lg">HireSight</span>
        </a>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4 ml-auto">
          {navContent}
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon className="h-6 w-6" />
          </Button>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <nav className="flex flex-col items-start gap-4 p-4">
              {navContent}
            </nav>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
