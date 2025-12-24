"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/ui/top-bar';
import { BottomBar } from '@/components/ui/bottom-bar';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { LoliCharacter } from '@/components/ui/loli-character';
import { cn } from "@/lib/utils";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from "react";

// Создание текстового поля для текста
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 caret-orange-500",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

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
  const [markupPercentage, setMarkupPercentage] = useState(0);
  const [isUpdatingMarkup, setIsUpdatingMarkup] = useState(false);
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [newFaqItem, setNewFaqItem] = useState({ question: '', answer: '' });
  const [editingFaqItem, setEditingFaqItem] = useState<any>(null);
  const [faqLoading, setFaqLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [buyRequestStatusFilter, setBuyRequestStatusFilter] = useState<string>('all');
  const [withdrawalRequestStatusFilter, setWithdrawalRequestStatusFilter] = useState<string>('all');
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);

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
        setUsersLoading(true);
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        setUsersLoading(false);
        
        if (usersResponse.ok) {
          setUsers(usersData.users);
        } else {
          toast({
            title: 'Ошибка',
            description: usersData.error || 'Не удалось загрузить данные пользователей',
            variant: 'destructive'
          });
        }
        
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
        
        // Получение заявок на вывод
        const withdrawalRequestsResponse = await fetch('/api/withdrawal-requests' + (withdrawalRequestStatusFilter !== 'all' ? `?status=${withdrawalRequestStatusFilter}` : ''));
        const withdrawalRequestsData = await withdrawalRequestsResponse.json();
        
        if (withdrawalRequestsResponse.ok) {
          setWithdrawalRequests(withdrawalRequestsData.requests);
        } else {
          toast({
            title: 'Ошибка',
            description: withdrawalRequestsData.error || 'Не удалось загрузить данные заявок на вывод',
            variant: 'destructive'
          });
        }
        
        // Упрощенная статистика без транзакций и споров
        setStats({
          totalUsers: usersData.users?.length || 0
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные администратора',
          variant: 'destructive'
        });
        setLoading(false);
        setUsersLoading(false);
        setRequestsLoading(false);
      }
    };

    fetchAdminData();
  }, [toast, router, buyRequestStatusFilter, withdrawalRequestStatusFilter]);

  // Получение FAQ при загрузке страницы
  useEffect(() => {
    const fetchFAQItems = async () => {
      setFaqLoading(true);
      try {
        const response = await fetch('/api/faq');
        const data = await response.json();
        
        if (response.ok) {
          setFaqItems(data.faq || []);
        } else {
          toast({
            title: 'Ошибка',
            description: data.error || 'Не удалось загрузить FAQ',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching FAQ items:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить FAQ',
          variant: 'destructive'
        });
      } finally {
        setFaqLoading(false);
      }
    };

    fetchFAQItems();
  }, [toast]);

  // Получение настроек при загрузке страницы
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (response.ok) {
          setMarkupPercentage(((data.settings?.markup_percentage - 1) * 100) || 0);
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
        body: JSON.stringify({ markupPercentage: markupPercentage })
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

  // Обработчик создания нового FAQ элемента
  const handleCreateFaqItem = async () => {
    if (!newFaqItem.question || !newFaqItem.answer) {
      toast({
        title: 'Ошибка',
        description: 'Вопрос и ответ обязательны для заполнения',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaqItem)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'FAQ элемент успешно создан'
        });
        
        // Обновление списка FAQ элементов
        setFaqItems([...faqItems, data.faqItem]);
        
        // Очистка формы
        setNewFaqItem({ question: '', answer: '' });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать FAQ элемент',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при создании FAQ элемента',
        variant: 'destructive'
      });
      console.error('FAQ creation error:', error);
    }
  };

  // Обработчик обновления FAQ элемента
  const handleUpdateFaqItem = async () => {
    if (!editingFaqItem.question || !editingFaqItem.answer) {
      toast({
        title: 'Ошибка',
        description: 'Вопрос и ответ обязательны для заполнения',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFaqItem)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'FAQ элемент успешно обновлен'
        });
        
        // Обновление списка FAQ элементов
        setFaqItems(faqItems.map(item =>
          item.id === editingFaqItem.id ? data.faqItem : item
        ));
        
        // Сброс редактирования
        setEditingFaqItem(null);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить FAQ элемент',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении FAQ элемента',
        variant: 'destructive'
      });
      console.error('FAQ update error:', error);
    }
  };

  // Обработчик удаления FAQ элемента
  const handleDeleteFaqItem = async (id: string) => {
    try {
      const response = await fetch('/api/faq', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'FAQ элемент успешно удален'
        });
        
        // Обновление списка FAQ элементов
        setFaqItems(faqItems.filter(item => item.id !== id));
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить FAQ элемент',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при удалении FAQ элемента',
        variant: 'destructive'
      });
      console.error('FAQ deletion error:', error);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="rounded-2xl shadow-lg border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Пользователи</h3>
                  <p className="text-3xl font-bold text-orange-400">{stats.totalUsers}</p>
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
                      step="1"
                      min="0"
                      max="100"
                      value={markupPercentage || 0}
                      onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 0)}
                      className="rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Текущая наценка: {markupPercentage ? (markupPercentage).toFixed(0) : 0}%
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
            
            <div className="grid grid-cols-1 gap-6">
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

                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
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
                  )}
                </CardContent>
              </Card>

              {/* Заявки на покупку */}
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
              
              {/* Заявки на вывод */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
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
                  
                  {/* Фильтр по статусу */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Фильтр по статусу
                    </label>
                    <select
                      value={withdrawalRequestStatusFilter}
                      onChange={(e) => setWithdrawalRequestStatusFilter(e.target.value)}
                      className="rounded-xl bg-background/40 border border-white/10 px-3 py-2 text-foreground focus:border-orange-500 transition-all w-full"
                    >
                      <option value="all">Все статусы</option>
                      <option value="pending">Ожидает</option>
                      <option value="processing">Обрабатывается</option>
                      <option value="completed">Завершена</option>
                      <option value="cancelled">Отменена</option>
                    </select>
                  </div>
                  
                  {requestsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {withdrawalRequests && withdrawalRequests.length > 0 ? (
                        withdrawalRequests.map((request: any) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold">Заявка #{request.id.substring(0, 8)}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Пользователь: {request.user_username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {request.amount} {request.crypto_type} → {request.wallet_address}
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
                                        : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {request.status === 'pending' && 'Ожидает'}
                                  {request.status === 'processing' && 'Обрабатывается'}
                                  {request.status === 'completed' && 'Завершена'}
                                  {request.status === 'cancelled' && 'Отменена'}
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
              
              {/* FAQ Management */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Управление FAQ
                  </h2>
                  
                  {/* Форма создания/редактирования FAQ */}
                  <div className="mb-6 p-4 bg-background/40 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {editingFaqItem ? 'Редактировать FAQ' : 'Создать новый FAQ элемент'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Вопрос
                        </label>
                        <Input
                          type="text"
                          placeholder="Введите вопрос"
                          className="rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all"
                          value={editingFaqItem ? editingFaqItem.question : newFaqItem.question}
                          onChange={(e) =>
                            editingFaqItem
                              ? setEditingFaqItem({...editingFaqItem, question: e.target.value})
                              : setNewFaqItem({...newFaqItem, question: e.target.value})
                          }
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Ответ
                        </label>
                        <Textarea
                          placeholder="Введите ответ"
                          className="rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all"
                          value={editingFaqItem ? editingFaqItem.answer : newFaqItem.answer}
                          onChange={(e) =>
                            editingFaqItem
                              ? setEditingFaqItem({...editingFaqItem, answer: e.target.value})
                              : setNewFaqItem({...newFaqItem, answer: e.target.value})
                          }
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        {editingFaqItem ? (
                          <>
                            <Button
                              onClick={handleUpdateFaqItem}
                              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 transition-all"
                            >
                              Обновить
                            </Button>
                            <Button
                              onClick={() => setEditingFaqItem(null)}
                              variant="outline"
                              className="rounded-xl border-white/10 text-foreground hover:bg-white/10 px-6 py-2 transition-all"
                            >
                              Отмена
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={handleCreateFaqItem}
                            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 transition-all"
                          >
                            Создать
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Список FAQ элементов */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Существующие FAQ элементы
                    </h3>
                    
                    {faqLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : faqItems && faqItems.length > 0 ? (
                      faqItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-background/40 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{item.question}</h4>
                              <p className="text-sm text-muted-foreground mt-2">{item.answer}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={() => setEditingFaqItem(item)}
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-white/10 text-foreground hover:bg-white/10"
                              >
                                Редактировать
                              </Button>
                              <Button
                                onClick={() => handleDeleteFaqItem(item.id)}
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/20"
                              >
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">FAQ элементы не найдены</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}