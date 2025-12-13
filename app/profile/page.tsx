"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomBar } from '@/components/ui/bottom-bar';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { LoliCharacter } from '@/components/ui/loli-character';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [buyRequests, setBuyRequests] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Состояния для формы вывода средств
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalCryptoType, setWithdrawalCryptoType] = useState('');
  const [withdrawalWalletAddress, setWithdrawalWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState<any>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);

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
        setTransactions(data.transactions);
        setBuyRequests(data.buyRequests || []);
        setUserBalance(data.balance || null);
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

  // Обработчик выбора файла
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Обработчик загрузки аватара
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'File must be an image',
        variant: 'destructive'
      });
      return;
    }

    // Проверка размера файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File is too large (maximum 2MB)',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message
        });
        
        // Обновление аватара в состоянии пользователя
        setUser((prev: any) => ({
          ...prev,
          avatar: data.avatar
        }));
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
        description: 'An error occurred while uploading the avatar',
        variant: 'destructive'
      });
      console.error('Avatar upload error:', error);
    } finally {
      setIsUploading(false);
      // Сброс значения input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Функция для получения заявок на вывод
  const fetchWithdrawalRequests = async () => {
    try {
      const response = await fetch('/api/withdrawal-requests');
      const data = await response.json();
      
      if (response.ok) {
        setWithdrawalRequests(data.requests);
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

  // Обработчик создания заявки на вывод
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/withdrawal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cryptoType: withdrawalCryptoType,
          amount: parseFloat(withdrawalAmount),
          walletAddress: withdrawalWalletAddress
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message
        });
        
        // Сброс формы
        setWithdrawalAmount('');
        setWithdrawalCryptoType('');
        setWithdrawalWalletAddress('');
        
        // Обновление списка заявок на вывод
        await fetchWithdrawalRequests();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create withdrawal request',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while creating withdrawal request',
        variant: 'destructive'
      });
      console.error('Withdrawal request error:', error);
    } finally {
      setIsSubmitting(false);
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
          
          <div className="relative z-10 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Loading profile...</h1>
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
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          accept="image/*"
          className="hidden"
        />
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Профиль пользователя */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card h-full">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div className="flex items-center gap-6">
                      {/* Аватар пользователя */}
                      <div className="relative">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            className="w-20 h-20 rounded-full object-cover border-2 border-violet-500"
                          />
                        ) : (
                          <LoliCharacter type={user?.role || "user"} className="w-20 h-20" />
                        )}
                        <Button
                          onClick={handleFileSelect}
                          disabled={isUploading}
                          variant="outline"
                          size="sm"
                          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 border-2 border-background bg-violet-500 hover:bg-violet-600"
                        >
                          {isUploading ? '⏳' : '✏️'}
                        </Button>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                          User Profile
                        </h1>
                        <p className="text-base text-muted-foreground">
                          Manage your account and transactions
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="mt-4 md:mt-0 rounded-xl border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all"
                    >
                      Logout
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="font-medium text-base">{user?.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-base">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-medium text-base">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Статистика и балансы */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card h-full">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    {/* Балансы криптовалют */}
                    <div className="bg-background/40 rounded-2xl p-4 border border-white/10">
                      <h3 className="text-lg font-semibold mb-3 text-center">Балансы криптовалют</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-violet-500/10 rounded-xl">
                          <p className="text-sm text-muted-foreground">BTC</p>
                          <p className="font-bold text-xl">
                            {(userBalance?.balances?.BTC || 0).toFixed(4)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-violet-500/10 rounded-xl">
                          <p className="text-sm text-muted-foreground">ETH</p>
                          <p className="font-bold text-xl">
                            {(userBalance?.balances?.ETH || 0).toFixed(4)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-violet-500/10 rounded-xl">
                          <p className="text-sm text-muted-foreground">USDT</p>
                          <p className="font-bold text-xl">
                            {(userBalance?.balances?.USDT || 0).toFixed(4)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-violet-500/10 rounded-xl">
                          <p className="text-sm text-muted-foreground">SOL</p>
                          <p className="font-bold text-xl">
                            {(userBalance?.balances?.SOL || 0).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Статистика запросов */}
                    <div className="bg-background/40 rounded-2xl p-4 border border-white/10">
                      <h3 className="text-lg font-semibold mb-3 text-center">Статистика запросов</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-xl">
                          <span className="text-sm text-muted-foreground">Total Requests</span>
                          <span className="font-bold text-xl">{buyRequests.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-xl">
                          <span className="text-sm text-muted-foreground">Completed</span>
                          <span className="font-bold text-xl">
                            {buyRequests.filter(t => t.status === 'completed').length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-xl">
                          <span className="text-sm text-muted-foreground">In Progress</span>
                          <span className="font-bold text-xl">
                            {buyRequests.filter(t => t.status === 'pending' || t.status === 'processing' || t.status === 'paid').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Вывод средств и история выводов */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              {/* Форма вывода средств */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                    Вывод криптовалюты
                  </h2>
                  
                  <form className="space-y-4" onSubmit={handleWithdrawalSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="withdrawalCryptoType">Криптовалюта</Label>
                      <Select
                        name="withdrawalCryptoType"
                        required
                        onValueChange={(value) => setWithdrawalCryptoType(value)}
                      >
                        <SelectTrigger id="withdrawalCryptoType">
                          <SelectValue placeholder="Выберите криптовалюту" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                          <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                          <SelectItem value="USDT">Tether (USDT)</SelectItem>
                          <SelectItem value="SOL">Solana (SOL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="withdrawalAmount">Сумма</Label>
                      <Input
                        id="withdrawalAmount"
                        name="withdrawalAmount"
                        type="number"
                        placeholder="Введите сумму"
                        required
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="withdrawalWalletAddress">Адрес кошелька</Label>
                      <Input
                        id="withdrawalWalletAddress"
                        name="withdrawalWalletAddress"
                        type="text"
                        placeholder="Введите адрес кошелька"
                        required
                        value={withdrawalWalletAddress}
                        onChange={(e) => setWithdrawalWalletAddress(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full rounded-xl py-6 text-lg font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Отправка...' : 'Вывести средства'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* История заявок на вывод */}
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                    История вывода
                  </h2>
                  
                  {withdrawalRequests.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <p className="text-sm sm:text-base text-muted-foreground">У вас нет заявок на вывод</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {withdrawalRequests.map((request) => (
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
                                 Заявка #{request.id.substring(0, 8)}
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
                               {request.status === 'pending' && 'Ожидает'}
                               {request.status === 'processing' && 'Обрабатывается'}
                               {request.status === 'completed' && 'Завершена'}
                               {request.status === 'cancelled' && 'Отменена'}
                             </span>
                             <span className="text-xs sm:text-sm text-muted-foreground">
                               {request.created_at ? new Date(request.created_at).toLocaleDateString('ru-RU') : 'Не указана'}
                             </span>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
            
            
            {/* История заявок на покупку */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card mt-6">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                  Buy Request History
                </h2>
                
                {buyRequests.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground">You don't have any buy requests yet</p>
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
                                Request #{request.request_id}
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
                              {request.status === 'pending' && 'Pending'}
                              {request.status === 'processing' && 'Processing'}
                              {request.status === 'paid' && 'Paid'}
                              {request.status === 'completed' && 'Completed'}
                              {request.status === 'cancelled' && 'Cancelled'}
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {request.created_at ? new Date(request.created_at).toLocaleDateString('en-US') : 'Not specified'}
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
