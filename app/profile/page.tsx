"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomBar } from '@/components/ui/bottom-bar';
import { SupportButton } from '@/components/ui/support-button';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';
import { LoliCharacter } from '@/components/ui/loli-character';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeBuyRequest, setActiveBuyRequest] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setActiveBuyRequest(data.activeBuyRequest);
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
        <SupportButton />

        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
          <div className="absolute inset-0">
            <FallingPattern
              color="rgba(139, 92, 246, 0.4)"
              backgroundColor="rgb(0, 0, 0)"
              duration={150}
              blurIntensity="0.5em"
              density={1}
            />
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
      <SupportButton />

      <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
        {/* Falling Pattern Background */}
        <div className="absolute inset-0">
          <FallingPattern
            color="rgba(139, 92, 246, 0.4)"
            backgroundColor="rgb(0, 0, 0)"
            duration={150}
            blurIntensity="0.5em"
            density={1}
          />
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
        <div className="relative z-10 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Профиль пользователя */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card mb-6">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div className="flex items-center gap-4">
                    {/* Аватар пользователя */}
                    <div className="relative">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt="Avatar"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-violet-500"
                        />
                      ) : (
                        <LoliCharacter type={user?.role || "user"} className="w-14 h-14 sm:w-16 sm:h-16" />
                      )}
                      <Button
                        onClick={handleFileSelect}
                        disabled={isUploading}
                        variant="outline"
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 border-2 border-background bg-violet-500 hover:bg-violet-600"
                      >
                        {isUploading ? '⏳' : '✏️'}
                      </Button>
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                        User Profile
                      </h1>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Manage your account and transactions
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="mt-4 md:mt-0 rounded-xl border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-all text-sm sm:text-base"
                  >
                    Logout
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-background/40 rounded-2xl p-4 sm:p-6 border border-white/10">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Information</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Username</p>
                        <p className="font-medium text-sm sm:text-base">{user?.username}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-sm sm:text-base">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Registration Date</p>
                        <p className="font-medium text-sm sm:text-base">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/40 rounded-2xl p-4 sm:p-6 border border-white/10">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Statistics</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Transactions</p>
                        <p className="font-medium text-lg sm:text-2xl">{transactions.length}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                        <p className="font-medium text-lg sm:text-2xl">
                          {transactions.filter(t => t.status === 'completed').length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">In Progress</p>
                        <p className="font-medium text-lg sm:text-2xl">
                          {transactions.filter(t => t.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Активная заявка на покупку */}
            {activeBuyRequest && (
              <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card mb-6">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                    Active Buy Request
                  </h2>
                  <div className="bg-background/40 rounded-2xl p-4 sm:p-6 border border-white/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-lg sm:text-xl">Request #{activeBuyRequest.request_id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeBuyRequest.amount} {activeBuyRequest.currency} → {activeBuyRequest.crypto_type}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium mt-2 md:mt-0 ${
                        activeBuyRequest.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : activeBuyRequest.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-400'
                            : activeBuyRequest.status === 'paid'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {activeBuyRequest.status === 'pending' && 'Pending'}
                        {activeBuyRequest.status === 'processing' && 'Processing'}
                        {activeBuyRequest.status === 'paid' && 'Paid'}
                        {activeBuyRequest.status === 'completed' && 'Completed'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium text-sm sm:text-base">{activeBuyRequest.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Wallet Address</p>
                        <p className="font-medium text-sm sm:text-base break-all">{activeBuyRequest.wallet_address}</p>
                      </div>
                      {activeBuyRequest.payment_details && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Payment Details</p>
                          <p className="font-medium text-sm sm:text-base break-all">{activeBuyRequest.payment_details}</p>
                        </div>
                      )}
                      {activeBuyRequest.receipt_image && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Receipt</p>
                          <img
                            src={activeBuyRequest.receipt_image}
                            alt="Receipt"
                            className="mt-1 rounded-lg max-w-full h-auto max-h-40 object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                      Created: {activeBuyRequest.created_at ? new Date(activeBuyRequest.created_at).toLocaleString() : 'Not specified'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Транзакции */}
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                  Transaction History
                </h2>

                {transactions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground">You don't have any transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-background/40 rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-violet-500/30 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                          <div className="mb-4 md:mb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                                {transaction.exchange_id}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base">{transaction.amount_from}</span>
                                <span className="text-xs sm:text-sm">{transaction.from_currency}</span>
                              </div>
                              <span className="text-muted-foreground">→</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-base">{transaction.amount_to}</span>
                                <span className="text-xs sm:text-sm">{transaction.to_currency}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {transaction.status === 'completed' ? 'Completed' : 'In Progress'}
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('en-US') : 'Not specified'}
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