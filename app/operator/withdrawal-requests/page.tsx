"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomBar } from '@/components/ui/bottom-bar';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { LoliCharacter } from '@/components/ui/loli-character';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Добавляем интерфейс для заявок на вывод
interface WithdrawalRequest {
  id: string;
  user_id: string;
  crypto_type: string;
  amount: number;
  wallet_address: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export default function OperatorWithdrawalRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawalRequestStatusFilter, setWithdrawalRequestStatusFilter] = useState<string>('all');
  const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] = useState<WithdrawalRequest | null>(null);
  const [transactionHash, setTransactionHash] = useState('');

  // Получение данных оператора при загрузке страницы
  useEffect(() => {
    const fetchOperatorData = async () => {
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
        if (currentUser.role !== 'operator' && currentUser.role !== 'admin') {
          router.push('/403');
          return;
        }
        
        setUser(currentUser);
        setLoading(false);
        
        // Получение заявок на вывод
        await fetchWithdrawalRequests();
      } catch (error) {
        console.error('Error fetching operator data:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные оператора',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchOperatorData();

    // Периодическое обновление заявок каждые 10 секунд
    const interval = setInterval(() => {
      fetchWithdrawalRequests();
    }, 10000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(interval);
  }, [toast, router]);
  
  // Функция для получения заявок на вывод
  const fetchWithdrawalRequests = async () => {
    try {
      const response = await fetch(`/api/withdrawal-requests${withdrawalRequestStatusFilter !== 'all' ? `?status=${withdrawalRequestStatusFilter}` : ''}`);
      const data = await response.json();
      
      if (response.ok) {
        setWithdrawalRequests(data.requests);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить данные заявок на вывод',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные заявок на вывод',
        variant: 'destructive'
      });
    }
  };

  // Обработчик обновления статуса заявки на вывод
  const handleUpdateWithdrawalStatus = async (requestId: string, status: 'processing' | 'completed' | 'cancelled') => {
    try {
      const response = await fetch('/api/withdrawal-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Статус заявки на вывод успешно обновлен'
        });
        
        // Обновление статуса заявки в локальном состоянии
        setWithdrawalRequests(withdrawalRequests.map(request =>
          request.id === requestId ? { ...request, status } : request
        ));
        
        // Сброс выбранной заявки
        setSelectedWithdrawalRequest(null);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить статус заявки на вывод',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении статуса заявки на вывод',
        variant: 'destructive'
      });
      console.error('Withdrawal request update error:', error);
    }
  };

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
          title: 'Успех',
          description: data.message
        });
        // Перенаправление на главную страницу
        router.push('/');
        router.refresh();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при выходе из системы',
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
          
          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-bold text-foreground">Загрузка панели оператора...</h1>
          </div>
        </main>
      </>
    );
  }

  // Проверка роли пользователя
  if (user?.role !== 'operator' && user?.role !== 'admin') {
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

  // Фильтрация заявок на вывод по поисковому запросу
  const filteredWithdrawalRequests = withdrawalRequests.filter(request =>
    request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.crypto_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <LoliCharacter type="operator" className="w-16 h-16" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Заявки на вывод
                  </h1>
                  <p className="text-muted-foreground">
                    Обработка заявок на вывод криптовалюты
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => router.push('/operator')}
                variant="outline"
                className="mt-4 md:mt-0 rounded-xl border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all"
              >
                Назад в панель оператора
              </Button>
            </div>
            
            {/* Фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Поиск заявок */}
              <div>
                <Input
                  type="text"
                  placeholder="Поиск заявок..."
                  className="rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Фильтр по статусу заявок на вывод */}
              <div>
                <select
                  value={withdrawalRequestStatusFilter}
                  onChange={(e) => setWithdrawalRequestStatusFilter(e.target.value)}
                  className="rounded-xl bg-background/40 border border-white/10 px-3 py-2 text-foreground focus:border-violet-500 transition-all w-full"
                >
                  <option value="all">Все заявки на вывод</option>
                  <option value="pending">Ожидает</option>
                  <option value="processing">Обрабатывается</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
            </div>
            
            {/* Список заявок на вывод */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Заявки на вывод
                </h2>
                
                <div className="space-y-4">
                  {filteredWithdrawalRequests.length > 0 ? (
                    filteredWithdrawalRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-violet-500/30 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">Заявка #{request.id.substring(0, 8)}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {request.amount} {request.crypto_type} → {request.wallet_address}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              request.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : request.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : request.status === 'cancelled'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {request.status === 'pending' && 'Ожидает'}
                              {request.status === 'processing' && 'Обрабатывается'}
                              {request.status === 'completed' && 'Завершена'}
                              {request.status === 'cancelled' && 'Отменена'}
                            </span>
                            <Button
                              onClick={() => setSelectedWithdrawalRequest(request)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-white/10 hover:bg-white/10 whitespace-nowrap"
                            >
                              Детали
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Заявки на вывод не найдены</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Модальное окно с деталями заявки на вывод */}
        {selectedWithdrawalRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-3xl shadow-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Детали заявки на вывод
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">ID заявки</p>
                    <p className="font-medium">#{selectedWithdrawalRequest.id.substring(0, 8)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Криптовалюта</p>
                    <p className="font-medium">{selectedWithdrawalRequest.crypto_type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Сумма</p>
                    <p className="font-medium">{selectedWithdrawalRequest.amount} {selectedWithdrawalRequest.crypto_type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Адрес кошелька</p>
                    <p className="font-medium break-all">{selectedWithdrawalRequest.wallet_address}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Дата создания</p>
                    <p className="font-medium">{new Date(selectedWithdrawalRequest.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                </div>
                
                {/* Форма обновления статуса */}
                <div className="space-y-4">
                  {selectedWithdrawalRequest.status === 'pending' && (
                    <div className="space-y-4">
                      <Button
                        onClick={() => handleUpdateWithdrawalStatus(selectedWithdrawalRequest.id, 'processing')}
                        className="w-full rounded-xl py-6 text-lg font-semibold"
                      >
                        Начать обработку
                      </Button>
                    </div>
                  )}
                  
                  {selectedWithdrawalRequest.status === 'processing' && (
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Хэш транзакции"
                        value={transactionHash}
                        onChange={(e) => setTransactionHash(e.target.value)}
                        className="rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all"
                      />
                      <Button
                        onClick={() => {
                          // Отправляем хэш транзакции и завершаем вывод
                          handleUpdateWithdrawalStatus(selectedWithdrawalRequest.id, 'completed');
                        }}
                        className="w-full rounded-xl py-6 text-lg font-semibold"
                      >
                        Отправить хэш транзакции
                      </Button>
                      
                      <Button
                        onClick={() => handleUpdateWithdrawalStatus(selectedWithdrawalRequest.id, 'cancelled')}
                        variant="outline"
                        className="w-full rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                      >
                        Отменить вывод
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setSelectedWithdrawalRequest(null)}
                    variant="outline"
                    className="w-full rounded-xl border-white/10 hover:bg-white/10"
                  >
                    Закрыть
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