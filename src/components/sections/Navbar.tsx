import React from 'react';
import { useTranslations } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { EyeIcon, MoonIcon, SunIcon } from '../icons';
import UserNav from '../UserNav';

interface NavbarProps {
    isAuthenticated: boolean;
    onLogout: () => void;
    onNavigate: (view: 'app' | 'settings' | 'profile') => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, onLogout, onNavigate, theme, toggleTheme }) => {
    const { language, setLanguage, t } = useTranslations();
    
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                <div className="flex gap-6 md:gap-10">
                    <a href="/" className="flex items-center space-x-2">
                        <EyeIcon className="h-6 w-6 text-primary" />
                        <span className="inline-block font-bold">{t('appTitle')}</span>
                    </a>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    {/* Language Switcher */}
                    <div className="flex items-center text-sm font-medium">
                        <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')}>EN</Button>
                        <Button variant={language === 'pt' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('pt')}>PT</Button>
                        <Button variant={language === 'es' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('es')}>ES</Button>
                    </div>

                    <div className="h-6 w-px bg-border mx-2"></div>

                    {/* Theme Toggle */}
                    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                    
                    {isAuthenticated && (
                        <>
                            <div className="h-6 w-px bg-border mx-2"></div>
                            <UserNav onLogout={onLogout} onNavigate={onNavigate} />
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
