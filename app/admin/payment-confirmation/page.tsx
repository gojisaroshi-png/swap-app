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

export default function PaymentConfirmationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

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
        
        // Здесь можно загрузить данные платежа, если нужно
        // Для демонстрации используем тестовые данные
        setPaymentData({
          id: 'PAY123456',
          amount: 15000,
          currency: 'RUB',
          cryptoAmount: 0.25,
          cryptoType: 'BTC',
          userId: 'user123',
          username: 'testuser',
          status: 'pending'
        });
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

  if (loading) {
    return (
      <>
        <BottomBar />

        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
          <div className="absolute inset-0">
            <FallingPattern />
          </div>

          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-bold text-foreground">Загрузка...</h1>
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
                    Подтверждение оплаты
                  </h1>
                  <p className="text-muted-foreground">
                    Подтверждение платежа пользователя
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
              {/* Детали платежа */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Детали платежа
                  </h2>
                  
                  {paymentData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">ID платежа</p>
                          <p className="font-semibold">#{paymentData.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Пользователь</p>
                          <p className="font-semibold">{paymentData.username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Сумма</p>
                          <p className="font-semibold">{paymentData.amount} {paymentData.currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Криптовалюта</p>
                          <p className="font-semibold">{paymentData.cryptoAmount} {paymentData.cryptoType}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Код подтверждения
                        </label>
                        <Input
                          type="text"
                          placeholder="Введите код подтверждения"
                          value={confirmationCode}
                          onChange={(e) => setConfirmationCode(e.target.value)}
                          className="rounded-xl bg-background/40 border border-white/10 focus:border-orange-500 transition-all"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Введите код подтверждения для завершения платежа
                        </p>
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <Button
                          onClick={() => {
                            // Здесь будет логика подтверждения платежа
                            toast({
                              title: 'Платеж подтвержден',
                              description: 'Платеж успешно подтвержден'
                            });
                          }}
                          disabled={isConfirming || !confirmationCode}
                          className="rounded-xl bg-green-500 hover:bg-green-600 text-white px-6 py-2 transition-all"
                        >
                          {isConfirming ? 'Подтверждение...' : 'Подтвердить оплату'}
                        </Button>
                        
                        <Button
                          onClick={() => {
                            // Здесь будет логика отмены платежа
                            toast({
                              title: 'Платеж отменен',
                              description: 'Платеж был отменен',
                              variant: 'destructive'
                            });
                          }}
                          variant="outline"
                          className="rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                        >
                          Отменить платеж
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Данные платежа не найдены</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Инструкции */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Инструкции по подтверждению
                  </h2>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>Проверьте поступление средств на ваш кошелек</li>
                    <li>Сверьте сумму с указанной в платеже</li>
                    <li>Введите код подтверждения из платежного сообщения</li>
                    <li>Нажмите "Подтвердить оплату" для завершения операции</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}