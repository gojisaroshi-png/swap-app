"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottomBar } from '@/components/ui/bottom-bar';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { LoliCharacter } from '@/components/ui/loli-character';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminPendingChecksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingChecks, setPendingChecks] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState('');

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
        
        // Получение чеков на подтверждении
        await fetchPendingChecks();
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные администратора',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [toast, router]);

  // Функция для получения чеков на подтверждении
  const fetchPendingChecks = async () => {
    try {
      setRequestsLoading(true);
      const response = await fetch('/api/buy-requests?status=paid');
      const data = await response.json();
      setRequestsLoading(false);
      
      if (response.ok) {
        setPendingChecks(data.requests);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить данные чеков',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching pending checks:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные чеков',
        variant: 'destructive'
      });
      setRequestsLoading(false);
    }
  };

  // Обработчик подтверждения чека
  const handleConfirmCheck = async (requestId: string) => {
    try {
      const response = await fetch('/api/buy-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          status: 'completed',
          transactionHash 
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Чек успешно подтвержден и средства зачислены пользователю'
        });
        
        // Обновление списка чеков
        await fetchPendingChecks();
        
        // Сброс формы
        setSelectedCheck(null);
        setTransactionHash('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось подтвердить чек',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при подтверждении чека',
        variant: 'destructive'
      });
      console.error('Check confirmation error:', error);
    }
  };

  // Обработчик отклонения чека
  const handleRejectCheck = async (requestId: string) => {
    try {
      const response = await fetch('/api/buy-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          status: 'processing'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Чек отклонен, заявка возвращена в обработку'
        });
        
        // Обновление списка чеков
        await fetchPendingChecks();
        
        // Сброс формы
        setSelectedCheck(null);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отклонить чек',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при отклонении чека',
        variant: 'destructive'
      });
      console.error('Check rejection error:', error);
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
                    Подтверждение чеков
                  </h1>
                  <p className="text-muted-foreground">
                    Подтверждение чеков оплаты пользователями
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
              {/* Чеки на подтверждении */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Чеки на подтверждении
                  </h2>
                  
                  {requestsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingChecks && pendingChecks.length > 0 ? (
                        pendingChecks.map((check: any) => (
                          <motion.div
                            key={check.request_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold">Заявка #{check.request_id}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Пользователь: {check.user_username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {check.amount} {check.currency} → {check.crypto_amount.toFixed(4)} {check.crypto_type}
                                </p>
                                {check.receipt_image && (
                                  <p className="text-sm text-muted-foreground">
                                    Чек: <a 
                                      href={check.receipt_image} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                      Просмотреть чек
                                    </a>
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => setSelectedCheck(check)}
                                  variant="default"
                                >
                                  Подтвердить
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Нет чеков на подтверждении</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
        
        {/* Модальное окно подтверждения чека */}
        {selectedCheck && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-3xl shadow-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Подтверждение чека
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">ID заявки</p>
                    <p className="font-medium">#{selectedCheck.request_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Пользователь</p>
                    <p className="font-medium">{selectedCheck.user_username}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Сумма</p>
                    <p className="font-medium">{selectedCheck.amount} {selectedCheck.currency} → {selectedCheck.crypto_amount.toFixed(4)} {selectedCheck.crypto_type}</p>
                  </div>
                  
                  {selectedCheck.receipt_image && (
                    <div>
                      <p className="text-sm text-muted-foreground">Чек оплаты</p>
                      <a
                        href={selectedCheck.receipt_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline break-all"
                      >
                        {selectedCheck.receipt_image}
                      </a>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Хэш транзакции (необязательно)
                    </label>
                    <Input
                      type="text"
                      placeholder="Введите хэш транзакции"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      className="rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleConfirmCheck(selectedCheck.request_id)}
                    variant="default"
                    className="flex-1"
                  >
                    Подтвердить и зачислить средства
                  </Button>
                  
                  <Button
                    onClick={() => handleRejectCheck(selectedCheck.request_id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    Отклонить чек
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedCheck(null)}
                    variant="outline"
                    className="flex-1 rounded-xl border-white/10 hover:bg-white/10"
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          </div>
        )}
      </main>
    </>
  );
}