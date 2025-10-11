import React from 'react';
import { useTranslations } from '../contexts/LanguageContext';
import { ArrowLeftIcon } from './icons';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';

interface ProfilePageProps {
    onNavigateBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateBack }) => {
    const { t } = useTranslations();

    return (
        <div className="bg-background text-foreground min-h-screen font-sans antialiased animate-fade-in">
            <div className="container mx-auto px-4 py-8">
                 <header className="flex items-center mb-8">
                    <Button variant="outline" size="sm" onClick={onNavigateBack} className="mr-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        {t('buttons.back')}
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
                </header>

                <main className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.subtitle')}</CardTitle>
                             <CardDescription>{t('profile.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">{t('profile.name')}</Label>
                                    <Input id="name" defaultValue="Recruiter Name" />
                                </div>
                                <div>
                                    <Label htmlFor="email">{t('profile.email')}</Label>
                                    <Input id="email" type="email" defaultValue="user@example.com" disabled />
                                </div>
                                <div>
                                    <Label htmlFor="company">{t('profile.company')}</Label>
                                    <Input id="company" placeholder="Your company name" />
                                </div>
                                <div>
                                    <Label htmlFor="role">{t('profile.role')}</Label>
                                    <Input id="role" placeholder="e.g., Talent Acquisition Specialist" />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-between items-center">
                                <Button variant="outline">{t('profile.changePassword')}</Button>
                                <Button>{t('profile.updateButton')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;
