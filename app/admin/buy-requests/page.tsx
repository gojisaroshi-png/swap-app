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
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminBuyRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buyRequests, setBuyRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [buyRequestStatusFilter, setBuyRequestStatusFilter] = useState<string>('all');

  // Получение данных администратора при загрузке страницы
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Получение данных текущего пользователя
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (!response.ok) {
          // Если пользователь не авторизован, перенаправить на страницу входа
          router.push('/auth');
          return;
        }
        
        const currentUser = data.user;
        
        // Проверка роли пользователя
        if (currentUser.role !== 'admin') {
          router.push('/403');
          return;
        }
        
        setUser(currentUser);
        setLoading(false);
        
        // Получение заявок на покупку
        setRequestsLoading(true);
        const buyRequestsResponse = await fetch('/api/buy-requests' + (buyRequestStatusFilter !== 'all' ? `?status=${buyRequestStatusFilter}` : ''));
        const buyRequestsData = await buyRequestsResponse.json();
        setRequestsLoading(false);
        
        if (buyRequestsResponse.ok) {
          setBuyRequests(buyRequestsData.requests);
        } else {
          toast({
            title: 'Ошибка',
            description: buyRequestsData.error || 'Не удалось загрузить данные заявок на покупку',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные администратора',
          variant: 'destructive'
        });
        setLoading(false);
        setRequestsLoading(false);
      }
    };

    fetchAdminData();
  }, [toast, router, buyRequestStatusFilter]);

  if (loading) {
    return (
      <>
        <BottomBar />

        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
          <div className="absolute inset-0">
            <FallingPattern />
          </div>

          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-bold text-foreground">Загрузка панели администратора...</h1>
          </div>
        </main>
      </>
    );
  }

  // Проверка роли пользователя
  if (user?.role !== 'admin') {
    return (
      <>
        <BottomBar />
        
        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20 mt-16">
          <div className="absolute inset-0">
            <FallingPattern />
          </div>

          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Доступ запрещен</h1>
            <p className="text-muted-foreground mb-6">У вас нет прав для доступа к этой странице</p>
            <Button onClick={() => router.push('/')}>Вернуться на главную</Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BottomBar />

      <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
        {/* Falling Pattern Background */}
        <div className="absolute inset-0">
          <FallingPattern />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Заголовок */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center gap-4">
                <LoliCharacter type="admin" className="w-16 h-16" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Заявки на покупку
                  </h1>
                  <p className="text-muted-foreground">
                    Управление заявками на покупку
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="mt-4 md:mt-0 rounded-xl border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-all"
              >
                Назад в админку
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Заявки на покупку */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Заявки на покупку
                  </h2>
                  
                  {/* Фильтр по статусу */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Фильтр по статусу
                    </label>
                    <select
                      value={buyRequestStatusFilter}
                      onChange={(e) => setBuyRequestStatusFilter(e.target.value)}
                      className="rounded-xl bg-background/40 border border-white/10 px-3 py-2 text-foreground focus:border-orange-500 transition-all w-full"
                    >
                      <option value="all">Все статусы</option>
                      <option value="pending">Ожидает</option>
                      <option value="processing">Обрабатывается</option>
                      <option value="paid">Оплачено</option>
                      <option value="completed">Завершена</option>
                      <option value="cancelled">Отменена</option>
                      <option value="disputed">Спор</option>
                    </select>
                  </div>
                  
                  {requestsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {buyRequests && buyRequests.length > 0 ? (
                        buyRequests.map((request: any) => (
                          <motion.div
                            key={request.request_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold">Заявка #{request.request_id}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Пользователь: {request.user_username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {request.amount} {request.currency} → {request.crypto_type}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.status === 'completed'
                                    ? 'bg-green-500/20 text-green-400'
                                    : request.status === 'processing'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : request.status === 'cancelled'
                                        ? 'bg-red-500/20 text-red-400'
                                        : request.status === 'disputed'
                                          ? 'bg-purple-500/20 text-purple-400'
                                          : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {request.status === 'pending' && 'Ожидает'}
                                  {request.status === 'processing' && 'Обрабатывается'}
                                  {request.status === 'completed' && 'Завершена'}
                                  {request.status === 'cancelled' && 'Отменена'}
                                  {request.status === 'disputed' && 'Спор'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Заявки не найдены</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}