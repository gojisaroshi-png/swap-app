"use client";

import { getCurrentUser } from '@/lib/auth';
import { BottomBar } from "@/components/ui/bottom-bar";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function BuyCrypto() {
  const { t, language } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({
    BTC: 0,
    ETH: 0,
    USDT: 0,
    SOL: 0
  });

  const [selectedCryptoType, setSelectedCryptoType] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('RUB');
  const [calculatedCryptoAmount, setCalculatedCryptoAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Функция для загрузки чека
  const handleReceiptUpload = async (requestId: string, file: File | null) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Обновляем заявку с URL чека
        const updateResponse = await fetch('/api/buy-requests', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId,
            status: 'paid',
            receiptImage: result.url
          }),
        });

        if (updateResponse.ok) {
          // Обновляем список заявок
          const requestsResponse = await fetch('/api/buy-requests');
          if (requestsResponse.ok) {
            const data = await requestsResponse.json();
            setRequests(data.requests);
            toast({
              title: t('buy.success'),
              description: t('buy.receipt_uploaded'),
            });
          }
        } else {
          toast({
            title: t('buy.error'),
            description: t('buy.failed_to_update_request'),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t('buy.error'),
          description: result.error || t('buy.failed_to_upload_receipt'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('buy.error'),
        description: t('buy.error_uploading_receipt'),
        variant: "destructive",
      });
      console.error('Error uploading receipt:', error);
    }
  };

  // Функция для подтверждения оплаты
  const handleConfirmPayment = async (requestId: string) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/buy-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status: 'completed'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Обновляем список заявок
        const requestsResponse = await fetch('/api/buy-requests');
        if (requestsResponse.ok) {
          const data = await requestsResponse.json();
          setRequests(data.requests);
          toast({
            title: t('buy.success'),
            description: t('buy.payment_confirmed'),
          });
        }
      } else {
        toast({
          title: t('buy.error'),
          description: result.error || t('buy.failed_to_confirm_payment'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('buy.error'),
        description: t('buy.error_confirming_payment'),
        variant: "destructive",
      });
      console.error('Error confirming payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Получение данных пользователя
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    // Получение заявок пользователя
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/buy-requests');
        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    // Получение курсов криптовалют
    const fetchPrices = async () => {
      try {
        const response = await fetch(`/api/crypto-prices?currency=RUB`);
        if (response.ok) {
          const data = await response.json();
          setPrices(data.prices);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchUser();
    fetchRequests();
    fetchPrices();

    // Периодическое обновление заявок и курсов каждые 10 секунд
    const interval = setInterval(() => {
      fetchRequests();
      fetchPrices();
      // Устанавливаем валюту по умолчанию на RUB
      setSelectedCurrency('RUB');
    }, 10000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const requestData = {
        cryptoType: formData.get('cryptoType'),
        amount: Number(formData.get('amount')),
        currency: formData.get('currency'),
        paymentMethod: formData.get('paymentMethod'),
        cryptoAmount: 0 // Will be calculated on the server
      };

      const response = await fetch('/api/buy-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: t('buy.success'),
          description: t('buy.request_created'),
        });

        // Очистка формы
        if (e.currentTarget) {
          e.currentTarget.reset();
        }

        // Обновление списка заявок
        const requestsResponse = await fetch('/api/buy-requests');
        if (requestsResponse.ok) {
          const data = await requestsResponse.json();
          setRequests(data.requests);
        }
      } else {
        toast({
          title: t('buy.error'),
          description: result.error || t('buy.failed_to_create_request'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('buy.error'),
        description: t('buy.error_creating_request') + (error as Error).message,
        variant: "destructive",
      });
      console.error('Error creating buy request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если пользователь не авторизован, показываем сообщение
  if (!user) {
    return (
      <>
        <BottomBar />
        <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
          <div className="absolute inset-0">
            <FallingPattern />
          </div>
          <div className="relative z-10 text-center">
            <p className="text-muted-foreground">{t('buy.requires_auth')}</p>
          </div>
        </main>
      </>
    );
  }

  // Фильтруем активные заявки (ожидающие и обрабатываемые, исключая завершенные)
  const activeRequests = requests.filter(request =>
    request.status === 'pending' || request.status === 'processing' || request.status === 'paid'
  );
  
  // Фильтруем завершенные заявки
  const completedRequests = requests.filter(request =>
    request.status === 'completed'
  );
  
  // Проверка, есть ли у пользователя активная заявка
  const hasActiveRequest = activeRequests.length > 0;
  
  // Если есть активные заявки, показываем уведомление
  if (hasActiveRequest && activeRequests.length > 0) {
    console.log("У пользователя есть активные заявки:", activeRequests);
  }
  
  // Добавляем проверку на наличие данных пользователя
  if (!user) {
    console.log("Данные пользователя не загружены");
    return null;
  }
  
  console.log("Текущий пользователь:", user);
  console.log("Активные заявки:", activeRequests);
  console.log("Завершенные заявки:", completedRequests);

  return (
    <>
      <BottomBar />

      <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-24 pb-20">
        {/* Falling Pattern Background */}
        <div className="absolute inset-0">
          <FallingPattern />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md">
          {/* Форма создания заявки отображается только если нет активных заявок */}
          {activeRequests.length === 0 && (
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card/60 backdrop-blur-xl mx-auto w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{t('buy.title')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('buy.create_request')}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="cryptoType">{t('buy.select_crypto')}</Label>
                    <Select
                      name="cryptoType"
                      required
                      onValueChange={(value) => {
                        setSelectedCryptoType(value);
                        const amount = parseFloat((document.getElementById('amount') as HTMLInputElement)?.value) || 0;
                        if (amount > 0 && prices[value]) {
                          const cryptoAmount = amount / prices[value];
                          setCalculatedCryptoAmount(cryptoAmount);
                        }
                      }}
                    >
                      <SelectTrigger id="cryptoType">
                        <SelectValue placeholder={t('buy.select_crypto')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">{t('common.btc')} - {prices.BTC?.toFixed(2) || '0.00'} {selectedCurrency}</SelectItem>
                        <SelectItem value="ETH">{t('common.eth')} - {prices.ETH?.toFixed(2) || '0.00'} {selectedCurrency}</SelectItem>
                        <SelectItem value="USDT">{t('common.usdt')} - {prices.USDT?.toFixed(2) || '0.00'} {selectedCurrency}</SelectItem>
                        <SelectItem value="SOL">{t('common.sol')} - {prices.SOL?.toFixed(2) || '0.00'} {selectedCurrency}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('buy.amount')} ({selectedCurrency})</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder={t('buy.enter_amount')}
                      required
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const cryptoType = (document.querySelector('[name="cryptoType"]') as HTMLSelectElement)?.value;
                        if (cryptoType && prices[cryptoType]) {
                          const cryptoAmount = amount / prices[cryptoType];
                          setCalculatedCryptoAmount(cryptoAmount);
                        }
                      }}
                    />
                    {calculatedCryptoAmount > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('buy.you_will_receive')} {calculatedCryptoAmount.toFixed(4)} {selectedCryptoType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('buy.currency')}</Label>
                    <Select
                      name="currency"
                      required
                      value={selectedCurrency}
                      onValueChange={(value) => {
                        setSelectedCurrency(value);
                        // Обновляем курсы при смене валюты
                        const fetchPrices = async () => {
                          try {
                            const response = await fetch(`/api/crypto-prices?currency=RUB`);
                            if (response.ok) {
                              const data = await response.json();
                              setPrices(data.prices);
                            }
                          } catch (error) {
                            console.error('Error fetching prices:', error);
                          }
                        };
                        fetchPrices();
                      }}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder={t('buy.select_currency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RUB">{t('common.rub')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">{t('buy.payment_method')}</Label>
                    <Select name="paymentMethod" required>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder={t('buy.select_payment_method')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">{t('buy.bank_transfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                  <Button
                    type="submit"
                    className="w-full rounded-xl py-6 text-lg font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('buy.creating') : t('buy.create_request_button')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Отображение активной заявки */}
          {hasActiveRequest && activeRequests.length > 0 && (
            <Card className="rounded-3xl shadow-2xl border border-white/10 bg-card/60 backdrop-blur-xl mt-6 mx-auto w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold">{t('buy.active_request')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {activeRequests.map((request) => (
                  <div key={request.request_id} className="bg-background/40 rounded-2xl p-4 border border-white/10 mb-4 last:mb-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{t('buy.request')} #{request.request_id}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : request.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-400'
                            : request.status === 'paid'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {request.status === 'pending' && t('status.pending')}
                        {request.status === 'processing' && t('status.processing')}
                        {request.status === 'paid' && t('status.paid')}
                        {request.status === 'completed' && t('status.completed')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {request.amount} {request.currency} → {request.crypto_amount.toFixed(4)} {request.crypto_type}
                    </p>
                    {request.payment_details && (
                      <div className="mt-2 p-2 bg-violet-500/10 rounded-lg">
                        <p className="text-sm font-medium text-violet-300">{t('buy.payment_details')}:</p>
                        <p className="text-sm break-all">{request.payment_details}</p>
                      </div>
                    )}
                    {request.status === 'processing' && (
                      <div className="mt-3">
                        <Label htmlFor={`receipt-${request.request_id}`}>{t('buy.payment_receipt')}:</Label>
                        <Input
                          id={`receipt-${request.request_id}`}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleReceiptUpload(request.request_id, e.target.files?.[0] || null)}
                          className="mt-1"
                        />
                        {request.receipt_image && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-muted-foreground">{t('buy.uploaded_receipt')}:</p>
                            <img
                              src={request.receipt_image}
                              alt="Receipt"
                              className="mt-1 rounded-lg max-w-full h-auto max-h-40 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {request.receipt_image && request.status === 'processing' && (
                      <Button
                        onClick={() => handleConfirmPayment(request.request_id)}
                        className="w-full mt-3"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t('buy.confirming') : t('buy.confirm_payment')}
                      </Button>
                    )}
                    {request.status === 'paid' && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg text-center">
                        <p className="text-yellow-300 font-medium">{t('buy.waiting_operator')}</p>
                      </div>
                    )}
                    {request.transaction_hash && (
                      <div className="mt-2 p-2 bg-green-500/10 rounded-lg">
                        <p className="text-sm font-medium text-green-300">{t('buy.transaction_hash')}:</p>
                        <p className="text-sm break-all">{request.transaction_hash}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('buy.created')}: {new Date(request.created_at).toLocaleString(language)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </>
  );
}