"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomBar } from '@/components/ui/bottom-bar';
// import { SupportButton } from '@/components/ui/support-button';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Проверка доступности имени пользователя
  const checkUsername = async () => {
    if (username.length < 3) return;
    
    try {
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (data.exists) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError('');
      }
    } catch (error) {
      console.error('Error checking username:', error);
    }
  };

  // Обработчик изменения имени пользователя
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setUsernameError('');
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Валидация полей
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    if (!isLogin && usernameError) {
      toast({
        title: 'Error',
        description: usernameError,
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin 
        ? { username, password }
        : { username, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message
        });

        if (isLogin) {
          // Перенаправление на главную страницу после входа
          router.push('/');
          router.refresh();
        } else {
          // Переключение на форму входа после регистрации
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
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
        description: 'An error occurred while processing the request',
        variant: 'destructive'
      });
      console.error('Auth error:', error);
    }

    setIsLoading(false);
  };

  return (
    <>
      <BottomBar />
      {/* <SupportButton /> */}

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

        {/* Content */}
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-foreground mb-3">
                    {isLogin ? 'Login' : 'Register'}
                  </h1>
                  <p className="text-muted-foreground">
                    {isLogin 
                      ? 'Sign in to your account' 
                      : 'Create a new account'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-sm text-muted-foreground font-medium mb-2 block">
                      Username *
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={handleUsernameChange}
                      onBlur={isLogin ? undefined : checkUsername}
                      className="h-14 rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all text-lg"
                      required
                      disabled={isLoading}
                    />
                    {!isLogin && usernameError && (
                      <p className="text-red-400 text-sm mt-1">{usernameError}</p>
                    )}
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="text-sm text-muted-foreground font-medium mb-2 block">
                        Email *
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all text-lg"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-muted-foreground font-medium mb-2 block">
                      Password *
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all text-lg"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="text-sm text-muted-foreground font-medium mb-2 block">
                        Confirm Password *
                      </label>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-14 rounded-xl bg-background/40 border-white/10 focus:border-violet-500 transition-all text-lg"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading}
                      className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-violet-700 hover:from-violet-700 hover:via-violet-600 hover:to-violet-800 shadow-lg hover:shadow-xl hover:shadow-violet-500/50 transition-all font-semibold"
                    >
                      {isLoading 
                        ? 'Processing...' 
                        : (isLogin ? 'Login' : 'Register')}
                    </Button>
                  </motion.div>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setUsernameError('');
                      }}
                      className="text-muted-foreground hover:text-violet-400 transition-colors"
                      disabled={isLoading}
                    >
                      {isLogin 
                        ? 'No account? Register' 
                        : 'Already have an account? Login'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}