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

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

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
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные администратора',
          variant: 'destructive'
        });
        setLoading(false);
        setUsersLoading(false);
      }
    };

    fetchAdminData();
  }, [toast, router]);

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

  // Обработчик бана/разбана пользователя
  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const response = await fetch('/api/users/ban', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBanned })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успех',
          description: isBanned ? 'Пользователь забанен' : 'Пользователь разбанен'
        });
        
        // Обновление статуса бана пользователя в локальном состоянии
        setUsers(users.map(user =>
          user.id === userId ? { ...user, isBanned } : user
        ));
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить статус бана пользователя',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении статуса бана пользователя',
        variant: 'destructive'
      });
      console.error('Ban user error:', error);
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
                    Пользователи
                  </h1>
                  <p className="text-muted-foreground">
                    Управление пользователями
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
                                <button
                                  onClick={() => handleBanUser(user.id, !user.isBanned)}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                    user.isBanned
                                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  }`}
                                >
                                  {user.isBanned ? 'Разбанить' : 'Забанить'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
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