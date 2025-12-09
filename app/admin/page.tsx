"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/ui/top-bar';
import { BottomBar } from '@/components/ui/bottom-bar';
import { SupportButton } from '@/components/ui/support-button';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { LoliCharacter } from '@/components/ui/loli-character';

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [buyRequests, setBuyRequests] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [disputeSearchTerm, setDisputeSearchTerm] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState(1.0);
  const [isUpdatingMarkup, setIsUpdatingMarkup] = useState(false);

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
        
        // Получение данных пользователей
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        
        if (usersResponse.ok) {
          setUsers(usersData.users);
        } else {
          toast({
            title: 'Ошибка',
            description: usersData.error || 'Не удалось загрузить данные пользователей',
            variant: 'destructive'
          });
        }
        
        // Получение транзакций
        const transactionsResponse = await fetch('/api/transactions');
        const transactionsData = await transactionsResponse.json();
        
        if (transactionsResponse.ok) {
          setTransactions(transactionsData.transactions);
        } else {
          toast({
            title: 'Ошибка',
            description: transactionsData.error || 'Не удалось загрузить данные транзакций',
            variant: 'destructive'
          });
        }
        
        // Получение заявок на покупку
        const buyRequestsResponse = await fetch('/api/buy-requests');
        const buyRequestsData = await buyRequestsResponse.json();
        
        if (buyRequestsResponse.ok) {
          setBuyRequests(buyRequestsData.requests);
        } else {
          toast({
            title: 'Ошибка',
            description: buyRequestsData.error || 'Не удалось загрузить данные заявок на покупку',
            variant: 'destructive'
          });
        }
        
        // Получение споров
        const disputesResponse = await fetch('/api/disputes');
        const disputesData = await disputesResponse.json();
        
        if (disputesResponse.ok) {
          setDisputes(disputesData.disputes);
        } else {
          toast({
            title: 'Ошибка',
            description: disputesData.error || 'Не удалось загрузить данные споров',
            variant: 'destructive'
          });
        }
        
        // Расчет статистики
        if (transactionsResponse.ok) {
          const totalTransactions = transactionsData.transactions.length;
          const completedTransactions = transactionsData.transactions.filter((t: any) => t.status === 'completed').length;
          const pendingTransactions = transactionsData.transactions.filter((t: any) => t.status === 'pending').length;
          // Простая имитация объема транзакций
          const totalVolume = transactionsData.transactions.reduce((sum: number, t: any) => sum + (t.amount_from || 0), 0);
          
          setStats({
            totalUsers: usersData.users?.length || 0,
            totalTransactions: totalTransactions || 0,
            completedTransactions: completedTransactions || 0,
            pendingTransactions: pendingTransactions || 0,
            totalVolume: totalVolume || 0,
            openDisputes: disputesData.disputes?.filter((d: any) => d.status === 'open').length || 0
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
      }
    };

    fetchAdminData();
  }, [toast, router]);

  // Получение настроек при загрузке страницы
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (response.ok) {
          setMarkupPercentage(data.settings?.markup_percentage || 1.0);
        } else {
          toast({
            title: 'Ошибка',
            description: data.error || 'Не удалось загрузить настройки',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить настройки',
          variant: 'destructive'
        });
      }
    };

    fetchSettings();
  }, [toast]);

  // Обработчик изменения роли пользователя
  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Роль пользователя успешно обновлена'
        });
        
        // Обновление роли пользователя в локальном состоянии
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить роль пользователя',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении роли пользователя',
        variant: 'destructive'
      });
      console.error('Role update error:', error);
    }
  };

  // Обработчик разрешения спора
  const handleResolveDispute = async (disputeId: number) => {
    try {
      const response = await fetch('/api/disputes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId, status: 'resolved' })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Спор успешно разрешен'
        });
        
        // Обновление статуса спора в локальном состоянии
        setDisputes(disputes.map(dispute =>
          dispute.id === disputeId ? { ...dispute, status: 'resolved' } : dispute
        ));
        
        // Обновление статистики
        setStats({
          ...stats,
          openDisputes: stats.openDisputes - 1
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось разрешить спор',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при разрешении спора',
        variant: 'destructive'
      });
      console.error('Dispute resolve error:', error);
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

  // Обработчик обновления наценки
  const handleUpdateMarkup = async () => {
    setIsUpdatingMarkup(true);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markupPercentage })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Настройки успешно обновлены'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить настройки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении настроек',
        variant: 'destructive'
      });
      console.error('Markup update error:', error);
    } finally {
      setIsUpdatingMarkup(false);
    }
  };

  if (loading) {
    return (
      <>
        <BottomBar />
        <SupportButton />

        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
          <div className="absolute inset-0">
            <FallingPattern
              color="rgba(249, 115, 22, 0.4)"
              backgroundColor="rgb(0, 0, 0)"
              duration={150}
              blurIntensity="0.5em"
              density={1}
            />
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
        <SupportButton />

        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20 mt-16">
          <div className="absolute inset-0">
            <FallingPattern
              color="rgba(249, 115, 22, 0.4)"
              backgroundColor="rgb(0, 0, 0)"
              duration={150}
              blurIntensity="0.5em"
              density={1}
            />
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
      <SupportButton />

      <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
        {/* Falling Pattern Background */}
        <div className="absolute inset-0">
          <FallingPattern
            color="rgba(249, 115, 22, 0.4)"
            backgroundColor="rgb(0, 0, 0)"
            duration={150}
            blurIntensity="0.5em"
            density={1}
          />
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
                    Панель администратора
                  </h1>
                  <p className="text-muted-foreground">
                    Управление пользователями и транзакциями
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="mt-4 md:mt-0 rounded-xl border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-all"
              >
                Выйти
              </Button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <Card className="rounded-2xl shadow-lg border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Пользователи</h3>
                  <p className="text-3xl font-bold text-orange-400">{stats.totalUsers}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Транзакции</h3>
                  <p className="text-3xl font-bold text-orange-400">{stats.totalTransactions}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Завершено</h3>
                  <p className="text-3xl font-bold text-green-400">{stats.completedTransactions}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">В процессе</h3>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pendingTransactions}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Объем</h3>
                  <p className="text-3xl font-bold text-purple-400">${(stats.totalVolume || 0).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Настройки наценки */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card mb-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Настройки наценки
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Процент наценки
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      max="2"
                      value={markupPercentage}
                      onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 1.0)}
                      className="rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Текущая наценка: {((markupPercentage - 1) * 100).toFixed(2)}%
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleUpdateMarkup}
                    disabled={isUpdatingMarkup}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 transition-all whitespace-nowrap mt-4 sm:mt-6"
                  >
                    {isUpdatingMarkup ? 'Обновление...' : 'Обновить наценку'}
                  </Button>
                </div>
              </CardContent>
            </Card>
 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Пользователи */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Пользователи
                  </h2>

                  {/* Поиск пользователей */}
                  <div className="mb-6">
                    <Input
                      type="text"
                      placeholder="Поиск пользователей..."
                      className="rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    {users
                      .filter(user =>
                        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{user.username}</h3>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={user.role}
                                className="rounded-lg bg-background/40 border border-white/10 px-2 py-1 text-sm"
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              >
                                <option value="user">User</option>
                                <option value="operator">Operator</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Транзакции */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Последние транзакции
                  </h2>

                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-muted-foreground">
                                {transaction.exchangeId}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {transaction.username}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold">
                                {transaction.amountFrom} {transaction.fromCurrency}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                → {transaction.amountTo} {transaction.toCurrency}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Заявки на покупку и споры */}
              <div className="space-y-6">
                <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6">
                      Заявки на покупку
                    </h2>

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
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-foreground">
                        Споры
                      </h2>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                        Открытые: {stats.openDisputes || 0}
                      </span>
                    </div>

                    {/* Поиск споров */}
                    <div className="mb-6">
                      <Input
                        type="text"
                        placeholder="Поиск споров..."
                        className="rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all"
                        value={disputeSearchTerm}
                        onChange={(e) => setDisputeSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      {disputes && disputes.length > 0 ? (
                        disputes
                          .filter(dispute =>
                            dispute.user_username?.toLowerCase().includes(disputeSearchTerm.toLowerCase()) ||
                            dispute.reason?.toLowerCase().includes(disputeSearchTerm.toLowerCase())
                          )
                          .map((dispute: any) => (
                            <motion.div
                              key={dispute.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">Спор #{dispute.id}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Пользователь: {dispute.user_username}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Заявка #{dispute.request_id} • {dispute.amount} {dispute.currency} → {dispute.crypto_type}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  dispute.status === 'open'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-green-500/20 text-green-400'
                                }`}>
                                  {dispute.status === 'open' ? 'Открыт' : 'Решен'}
                                </span>
                              </div>
                              <p className="text-sm mb-3">{dispute.reason}</p>
                              {dispute.status === 'open' && (
                                <Button
                                  onClick={() => handleResolveDispute(dispute.id)}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl border-green-500/50 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-all"
                                >
                                  Разрешить спор
                                </Button>
                              )}
                            </motion.div>
                          ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Споры не найдены</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}