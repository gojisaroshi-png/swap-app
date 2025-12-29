"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomBar } from '@/components/ui/bottom-bar';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { LoliCharacter } from '@/components/ui/loli-character';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ProfileBuyRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buyRequests, setBuyRequests] = useState<any[]>([]);

  // Получение данных пользователя при загрузке страницы
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Получение данных текущего пользователя через API
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.status === 401) {
          // Если пользователь не авторизован, перенаправить на страницу входа
          router.push('/auth');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        setUser(data.user);
        setBuyRequests(data.buyRequests || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchUserData();
  }, [toast, router]);

  // Обработчик выхода из системы
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message
        });
        // Перенаправление на главную страницу
        router.push('/');
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while logging out',
        variant: 'destructive'
      });
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <>
        <BottomBar />
        
        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
          <div className="absolute inset-0">
            <FallingPattern />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('profile.loading')}</h1>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BottomBar />
      
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-8 pt-32 pb-24">
        {/* Falling Pattern Background */}
        <div className="absolute inset-0">
          <FallingPattern />
        </div>
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Заголовок */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center gap-4">
                <LoliCharacter type={user?.role || "user"} className="w-16 h-16" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {t('profile.buy_request_history')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('profile.your_buy_request_history')}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => router.push('/profile')}
                variant="outline"
                className="mt-4 md:mt-0 rounded-xl border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all"
              >
                {t('profile.back_to_profile')}
              </Button>
            </div>

            {/* История заявок на покупку */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                  {t('profile.buy_request_history')}
                </h2>
                
                {buyRequests.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground">{t('profile.no_buy_requests')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {buyRequests.map((request) => (
                      <motion.div
                        key={request.request_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-background/40 rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-violet-500/30 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                          <div className="mb-4 md:mb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                                {t('profile.request')} #{request.request_id}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base">{request.amount}</span>
                                <span className="text-xs sm:text-sm">{request.currency}</span>
                              </div>
                              <span className="text-muted-foreground">→</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base">{request.crypto_type}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : request.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : request.status === 'paid'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {request.status === 'pending' && t('status.pending')}
                              {request.status === 'processing' && t('status.processing')}
                              {request.status === 'paid' && t('status.paid')}
                              {request.status === 'completed' && t('status.completed')}
                              {request.status === 'cancelled' && t('status.cancelled')}
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {request.created_at ? new Date(request.created_at).toLocaleDateString(language) : t('profile.not_specified')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}