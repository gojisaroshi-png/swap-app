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

export default function OperatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [buyRequestStatusFilter, setBuyRequestStatusFilter] = useState<string>('all');
  const [withdrawalRequestStatusFilter, setWithdrawalRequestStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] = useState<WithdrawalRequest | null>(null);
  const [receiptImage, setReceiptImage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');

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
        
        // Получение заявок
        await fetchRequests();
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
      fetchRequests();
    }, 10000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(interval);
  }, [toast, router]);
  
  // Получение заявок на вывод при загрузке страницы
  useEffect(() => {
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
    
    if (!loading && user) {
      fetchWithdrawalRequests();
    }
  }, [loading, user, toast, withdrawalRequestStatusFilter]);

  // Функция для получения заявок
  const fetchRequests = async () => {
    try {
      const requestsResponse = await fetch('/api/buy-requests' + (buyRequestStatusFilter !== 'all' ? `?status=${buyRequestStatusFilter}` : ''));
      const requestsData = await requestsResponse.json();
      
      if (requestsResponse.ok) {
        setRequests(requestsData.requests);
      } else {
        toast({
          title: 'Ошибка',
          description: requestsData.error || 'Не удалось загрузить данные заявок',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные заявок',
        variant: 'destructive'
      });
    }
  };
  
  // Функция для получения заявок на вывод
  const fetchWithdrawalRequests = async () => {
    try {
      const response = await fetch('/api/withdrawal-requests' + (withdrawalRequestStatusFilter !== 'all' ? `?status=${withdrawalRequestStatusFilter}` : ''));
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

  // Обработчик обновления статуса заявки
  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      const updateData: any = { requestId, status };
      
      if (status === 'processing' && paymentDetails) {
        updateData.paymentDetails = paymentDetails;
      }
      
      if (status === 'paid' && receiptImage) {
        updateData.receiptImage = receiptImage;
      }
      
      if (status === 'completed' && transactionHash) {
        updateData.transactionHash = transactionHash;
      }
      
      const response = await fetch('/api/buy-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Статус заявки успешно обновлен'
        });
        
        // Обновление статуса заявки в локальном состоянии
        setRequests(requests.map(request =>
          request.request_id === requestId ? { ...request, status } : request
        ));
        
        // Обновление списка заявок с сервера
        await fetchRequests();
        
        // Сброс формы
        setSelectedRequest(null);
        setPaymentDetails('');
        setReceiptImage('');
        setTransactionHash('');
        setDisputeReason('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить статус заявки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении статуса заявки',
        variant: 'destructive'
      });
      console.error('Request update error:', error);
    }
  };

  // Обработчик создания спора
  const handleCreateDispute = async (requestId: string) => {
    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason: disputeReason })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Спор успешно создан'
        });
        
        // Обновление статуса заявки в локальном состоянии
        setRequests(requests.map(request =>
          request.request_id === requestId ? { ...request, status: 'disputed' } : request
        ));
        
        // Обновление списка заявок с сервера
        await fetchRequests();
        
        // Сброс формы
        setDisputeReason('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать спор',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при создании спора',
        variant: 'destructive'
      });
      console.error('Dispute creation error:', error);
    }
  };

  // Обработчик открытия деталей заявки
  const handleOpenRequest = (request: any) => {
    setSelectedRequest(request);
  };

  // Обработчик закрытия деталей заявки
  const handleCloseRequest = () => {
    setSelectedRequest(null);
    setPaymentDetails('');
    setReceiptImage('');
    setTransactionHash('');
    setDisputeReason('');
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

  // Фильтрация заявок по поисковому запросу и статусу
  const filteredRequests = requests.filter(request =>
    (user?.role === 'operator' ? request.status !== 'completed' : true) &&
    (buyRequestStatusFilter === 'all' || request.status === buyRequestStatusFilter) &&
    (request.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.user_username && request.user_username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    request.crypto_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Разделение заявок на активные и остальные
  const activeRequests = filteredRequests.filter(request =>
    request.status === 'pending' || request.status === 'processing' || request.status === 'paid'
  );
  const otherRequests = filteredRequests.filter(request =>
    request.status !== 'pending' && request.status !== 'processing' && request.status !== 'paid'
  );
  
  // Ограничиваем отображение до 3 последних активных заявок
  const limitedActiveRequests = activeRequests.slice(0, 3);
  const limitedOtherRequests = otherRequests.slice(0, 3);
  const sortedRequests = [...limitedActiveRequests, ...limitedOtherRequests];
  
  // Фильтрация заявок на вывод по поисковому запросу
  const filteredWithdrawalRequests = withdrawalRequests.filter(request =>
    request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.crypto_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Ограничиваем отображение до 3 последних заявок на вывод
  const limitedWithdrawalRequests = filteredWithdrawalRequests.slice(0, 3);

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
                    Панель оператора
                  </h1>
                  <p className="text-muted-foreground">
                    Обработка заявок на покупку криптовалюты
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="mt-4 md:mt-0 rounded-xl border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all"
              >
                Выйти
              </Button>
            </div>
            
            {/* Фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              
              {/* Фильтр по статусу заявок на покупку */}
              <div>
                <select
                  value={buyRequestStatusFilter}
                  onChange={(e) => setBuyRequestStatusFilter(e.target.value)}
                  className="rounded-xl bg-background/40 border border-white/10 px-3 py-2 text-foreground focus:border-violet-500 transition-all w-full"
                >
                  <option value="all">Все заявки на покупку</option>
                  <option value="pending">Ожидает</option>
                  <option value="processing">Обрабатывается</option>
                  <option value="paid">Оплачено</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                  <option value="disputed">Спор</option>
                </select>
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
            
            {/* Список заявок */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Заявки на покупку
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/purchases')}
                  >
                    Показать все
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {sortedRequests.length > 0 ? (
                    sortedRequests.map((request) => (
                      <motion.div
                        key={request.request_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-violet-500/30 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">Заявка #{request.request_id}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              Пользователь: {request.user_username}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {request.amount} {request.currency} → {request.crypto_amount ? request.crypto_amount.toFixed(4) : '0.0000'} {request.crypto_type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              request.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : request.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : request.status === 'paid'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : request.status === 'cancelled'
                                      ? 'bg-red-500/20 text-red-400'
                                      : request.status === 'disputed'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {request.status === 'pending' && 'Ожидает'}
                              {request.status === 'processing' && 'Обрабатывается'}
                              {request.status === 'paid' && 'Оплачено'}
                              {request.status === 'completed' && 'Завершена'}
                              {request.status === 'cancelled' && 'Отменена'}
                              {request.status === 'disputed' && 'Спор'}
                            </span>
                            <Button
                              onClick={() => handleOpenRequest(request)}
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
                      <p className="text-muted-foreground">Заявки не найдены</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Список заявок на вывод */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card mt-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Заявки на вывод
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/withdrawals')}
                  >
                    Показать все
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {limitedWithdrawalRequests.length > 0 ? (
                    limitedWithdrawalRequests.map((request) => (
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
        
        {/* Модальное окно с деталями заявки */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-3xl shadow-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Детали заявки
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">ID заявки</p>
                    <p className="font-medium">#{selectedRequest.request_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Пользователь</p>
                    <p className="font-medium">{selectedRequest.user_username}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Криптовалюта</p>
                    <p className="font-medium">{selectedRequest.crypto_type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Сумма</p>
                    <p className="font-medium">{selectedRequest.amount} {selectedRequest.currency} → {selectedRequest.crypto_amount ? selectedRequest.crypto_amount.toFixed(4) : '0.0000'} {selectedRequest.crypto_type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Способ оплаты</p>
                    <p className="font-medium">
                      {selectedRequest.payment_method === 'bank_transfer' && 'Банковский перевод'}
                      {selectedRequest.payment_method === 'card' && 'Банковская карта'}
                      {selectedRequest.payment_method === 'paypal' && 'PayPal'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Адрес кошелька</p>
                    <p className="font-medium break-all">{selectedRequest.wallet_address}</p>
                  </div>
                  
                  {selectedRequest.payment_details && (
                    <div>
                      <p className="text-sm text-muted-foreground">Реквизиты для оплаты</p>
                      <p className="font-medium break-all">{selectedRequest.payment_details}</p>
                    </div>
                  )}
                  
                  {selectedRequest.receipt_image && (
                    <div>
                      <p className="text-sm text-muted-foreground">Чек оплаты</p>
                      <a
                        href={selectedRequest.receipt_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline break-all"
                      >
                        {selectedRequest.receipt_image}
                      </a>
                    </div>
                  )}
                  
                  {selectedRequest.transaction_hash && (
                    <div>
                      <p className="text-sm text-muted-foreground">Хэш транзакции</p>
                      <p className="font-medium break-all">{selectedRequest.transaction_hash}</p>
                    </div>
                  )}
                </div>
                
                {/* Форма обновления статуса */}
                <div className="space-y-4">
                  {selectedRequest.status === 'pending' && (
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Реквизиты для оплаты"
                        value={paymentDetails}
                        onChange={(e) => setPaymentDetails(e.target.value)}
                        className="rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all"
                      />
                      <Button
                        onClick={() => handleUpdateStatus(selectedRequest.request_id, 'processing')}
                        className="w-full rounded-xl py-6 text-lg font-semibold"
                      >
                        Отправить реквизиты
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.status === 'processing' && (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Ожидание оплаты от пользователя</p>
                      </div>
                      <Button
                        onClick={() => handleUpdateStatus(selectedRequest.request_id, 'cancelled')}
                        variant="outline"
                        className="w-full rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                      >
                        Отменить заявку
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.status === 'paid' && (
                    <div className="space-y-4">
                      <div className="text-center py-2 bg-yellow-500/10 rounded-lg">
                        <p className="text-yellow-300 font-medium">Пользователь отправил чек оплаты</p>
                      </div>
                      <Input
                        type="text"
                        placeholder="Хэш транзакции"
                        value={transactionHash}
                        onChange={(e) => setTransactionHash(e.target.value)}
                        className="rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all"
                      />
                      <Button
                        onClick={() => handleUpdateStatus(selectedRequest.request_id, 'completed')}
                        className="w-full rounded-xl py-6 text-lg font-semibold"
                      >
                        Отправить криптовалюту
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'disputed' && selectedRequest.status !== 'processing' && selectedRequest.status !== 'paid' && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedRequest.request_id, 'cancelled')}
                      variant="outline"
                      className="w-full rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                    >
                      Отменить заявку
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleCloseRequest}
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