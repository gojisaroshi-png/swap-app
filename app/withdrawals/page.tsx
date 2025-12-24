"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomBar } from '@/components/ui/bottom-bar';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WithdrawalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  
  // Состояния для фильтрации и сортировки
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('all');
  const [withdrawalSortOption, setWithdrawalSortOption] = useState('date');

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

  // Функция для получения заявок на вывод
  const fetchWithdrawalRequests = async () => {
    try {
      const response = await fetch('/api/withdrawal-requests');
      const data = await response.json();
      
      if (response.ok) {
        // Для обычных пользователей показываем только их заявки
        // Для админов и операторов также показываем только их заявки в профиле
        if (user && (user.role === 'admin' || user.role === 'operator')) {
          // Фильтруем заявки по текущему пользователю
          const userRequests = data.requests.filter((request: any) => request.user_id === user.id);
          setWithdrawalRequests(userRequests);
        } else {
          // Для обычных пользователей показываем все полученные заявки
          setWithdrawalRequests(data.requests);
        }
      } else {
        console.error('Error fetching withdrawal requests:', data.error);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };
  
  // Добавляем useEffect для периодического обновления заявок на вывод
  useEffect(() => {
    if (!loading) {
      fetchWithdrawalRequests();
      const interval = setInterval(fetchWithdrawalRequests, 10000); // Обновление каждые 10 секунд
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Функция для фильтрации и сортировки заявок на вывод
  const getFilteredAndSortedWithdrawals = () => {
    let filtered = [...withdrawalRequests];
    
    // Фильтрация по статусу
    if (withdrawalStatusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === withdrawalStatusFilter);
    }
    
    // Сортировка
    if (withdrawalSortOption === 'amount') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else {
      // Сортировка по дате (новые первые)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return filtered;
  };

  // Получаем отфильтрованные и отсортированные заявки
  const filteredAndSortedWithdrawals = getFilteredAndSortedWithdrawals();

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
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Заголовок страницы */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('profile.withdrawal_history')}
              </h1>
              <p className="text-base text-muted-foreground">
                {t('profile.view_all_withdrawals')}
              </p>
            </div>
            
            {/* Фильтры и сортировка */}
            <div className="mb-6 flex flex-wrap gap-4">
              {/* Фильтр по статусу */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">{t('profile.filter_by_status')}</label>
                <Select
                  value={withdrawalStatusFilter}
                  onValueChange={(value) => setWithdrawalStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('profile.filter_by_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('status.all')}</SelectItem>
                    <SelectItem value="pending">{t('status.pending')}</SelectItem>
                    <SelectItem value="processing">{t('status.processing')}</SelectItem>
                    <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Сортировка */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">{t('profile.sort_by')}</label>
                <Select
                  value={withdrawalSortOption}
                  onValueChange={(value) => setWithdrawalSortOption(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('profile.sort_by')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t('profile.sort_by_date')}</SelectItem>
                    <SelectItem value="amount">{t('profile.sort_by_amount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Кнопка возврата в профиль */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Если пользователь - оператор или админ, возвращаем в панель оператора
                    if (user && (user.role === 'operator' || user.role === 'admin')) {
                      router.push('/operator');
                    } else {
                      router.push('/profile');
                    }
                  }}
                >
                  {user && (user.role === 'operator' || user.role === 'admin')
                    ? t('operator.back_to_panel')
                    : t('profile.back_to_profile')}
                </Button>
              </div>
            </div>
            
            {/* Список заявок на вывод */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
              <CardContent className="p-6 sm:p-8">
                {filteredAndSortedWithdrawals.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground">{t('profile.no_withdrawal_requests')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAndSortedWithdrawals.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-background/40 rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-violet-500/30 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                          <div className="mb-4 md:mb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                               {t('profile.request')} #{request.id.substring(0, 8)}
                             </span>
                           </div>
                           <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                               <span className="font-bold text-sm sm:text-base">{request.amount}</span>
                               <span className="text-xs sm:text-sm">{request.crypto_type}</span>
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-4">
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             request.status === 'completed'
                               ? 'bg-green-500/20 text-green-400'
                               : request.status === 'processing'
                                 ? 'bg-blue-500/20 text-blue-400'
                                 : request.status === 'cancelled'
                                   ? 'bg-red-500/20 text-red-400'
                                   : 'bg-yellow-500/20 text-yellow-400'
                           }`}>
                             {request.status === 'pending' && t('status.pending')}
                             {request.status === 'processing' && t('status.processing')}
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