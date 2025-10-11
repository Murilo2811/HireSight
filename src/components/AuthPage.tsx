import React, { useState } from 'react';
import { useTranslations } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { EyeIcon } from './icons';

interface AuthPageProps {
  onAuthSuccess: (remember: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const { t } = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simula uma chamada de API de autenticação
    setTimeout(() => {
      setIsLoading(false);
      onAuthSuccess(rememberMe);
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <EyeIcon className="h-10 w-10 text-primary" />
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('auth.login.tab')}</TabsTrigger>
            <TabsTrigger value="signup">{t('auth.signup.tab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.login.title')}</CardTitle>
                <CardDescription>{t('auth.login.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.emailLabel')}</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.passwordLabel')}</Label>
                    <Input id="login-password" type="password" required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                    <Label htmlFor="remember-me" className="text-sm font-normal">
                      {t('auth.rememberMe')}
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
                    {t('auth.login.button')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.signup.title')}</CardTitle>
                <CardDescription>{t('auth.signup.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.emailLabel')}</Label>
                    <Input id="signup-email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.passwordLabel')}</Label>
                    <Input id="signup-password" type="password" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
                    {t('auth.signup.button')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;