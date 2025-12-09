"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, ArrowLeft, Circle, CheckCircle, Loader2, Clock, Coins, Send, Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { FallingPattern } from "@/components/ui/falling-pattern";

// Props for the exchange details page
interface ExchangeDetailsProps {
  params: Promise<{ id: string }> | { id: string };
}

// Exchange details page component
export default function ExchangeDetails({ params }: ExchangeDetailsProps) {
  const router = useRouter();
  const [exchangeData, setExchangeData] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [statusDetails, setStatusDetails] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [exchangeId, setExchangeId] = useState<string | null>(null);

  // Unwrap params if it's a Promise
  useEffect(() => {
    const unwrapParams = async () => {
      if (params instanceof Promise) {
        const resolvedParams = await params;
        setExchangeId(resolvedParams.id);
      } else {
        setExchangeId(params.id);
      }
    };

    unwrapParams();
  }, [params]);

  // Get exchange data from localStorage
  useEffect(() => {
    const data = localStorage.getItem('exchangeData');
    if (data) {
      setExchangeData(JSON.parse(data));
    } else {
      // If no data in localStorage, redirect to home
      router.push('/');
    }
  }, [router]);

  // Poll for exchange status
  useEffect(() => {
    if (!exchangeData || !exchangeData.id) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`https://api.simpleswap.io/v3/exchanges/${exchangeData.id}`, {
          headers: {
            'X-API-KEY': '55e3cd77-67a7-4bb4-a37d-5e4b0397a747'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch exchange status: ${response.status}`);
        }
        
        const data = await response.json();
        const exchange = data.result || data;
        
        // Map SimpleSwap status to our status
        switch (exchange.status) {
          case 'waiting':
            setStatus("pending");
            setStatusDetails("Waiting for deposit");
            break;
          case 'confirming':
            setStatus("confirming");
            setStatusDetails("Confirming transaction");
            break;
          case 'exchanging':
            setStatus("exchanging");
            setStatusDetails("Exchanging currencies");
            break;
          case 'sending':
            setStatus("sending");
            setStatusDetails("Sending to recipient");
            break;
          case 'finished':
            setStatus("finished");
            setStatusDetails("Exchange completed");
            // Show completion modal when exchange is finished
            setShowCompletionModal(true);
            break;
          case 'failed':
            setStatus("failed");
            setStatusDetails("Exchange failed");
            break;
          default:
            setStatus("pending");
            setStatusDetails("Waiting for deposit");
        }
        
        // Set time left if available
        if (exchange.timeLeft) {
          setTimeLeft(exchange.timeLeft);
        }
      } catch (error) {
        console.error("Error fetching exchange status:", error);
      }
    };

    // Fetch status immediately
    fetchStatus();
    
    // Poll for status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    
    return () => clearInterval(interval);
  }, [exchangeData]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Function to simulate exchange completion for testing
  const simulateCompletion = () => {
    setStatus("finished");
    setStatusDetails("Exchange completed");
    setShowCompletionModal(true);
  };

  // Function to handle Create New Exchange button click
  const handleCreateNewExchange = () => {
    router.push('/');
  };

  if (!exchangeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading exchange details...</h1>
        </div>
      </div>
    );
  }

  // Status steps with icons
  const statusSteps = [
    { id: "pending", name: "Pending", icon: Clock },
    { id: "confirming", name: "Confirming", icon: Loader2 },
    { id: "exchanging", name: "Exchanging", icon: Coins },
    { id: "sending", name: "Sending", icon: Send },
    { id: "finished", name: "Completed", icon: Check },
  ];

  // Get current status index
  const currentStatusIndex = statusSteps.findIndex(step => step.id === status);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-20 pb-8">
      {/* Falling Pattern Background */}
      <div className="absolute inset-0">
        <FallingPattern
          color="rgba(149, 76, 233, 0.4)"
          backgroundColor="rgb(0, 0, 0)"
          duration={150}
          blurIntensity="0.5em"
          density={1}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="rounded-3xl shadow-2xl border border-white/10 glass-effect">
            <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Exchange Status</h1>
            </div>

            {/* Exchange ID inline with title */}
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-sm text-muted-foreground/80 truncate cursor-pointer hover:text-muted-foreground transition-colors"
                  onClick={() => copyToClipboard(exchangeData.id, 'exchangeId')}
                >
                  {exchangeData.id}
                </span>
                <AnimatePresence>
                  {copiedField === 'exchangeId' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-green-400"
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>


            {/* Status steps */}
            <motion.div
              className="mb-6 bg-background/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="flex justify-between">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index < currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const isUpcoming = index > currentStatusIndex;

                  return (
                    <motion.div
                      key={step.id}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    >
                      <motion.div
                        className={`rounded-full p-2 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : isCurrent
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg shadow-purple-500/50'
                            : 'bg-muted/50'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        ) : (
                          <Icon className={`h-4 w-4 ${isUpcoming ? 'text-muted-foreground' : 'text-white'}`} />
                        )}
                      </motion.div>
                      <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-bold text-purple-400' : 'text-muted-foreground'}`}>
                        {step.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >

              {/* Deposit Amount */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Deposit Amount</p>
                <div className="flex items-center justify-between bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl p-3 backdrop-blur-sm border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-purple-400">{exchangeData.amountFrom}</span>
                    <span className="text-sm font-semibold">{exchangeData.tickerFrom.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Deposit Address */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Deposit Address</p>
                <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all">
                  <span className="font-mono text-sm truncate mr-2">{exchangeData.addressFrom}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-purple-500/20 transition-all"
                    onClick={() => copyToClipboard(exchangeData.addressFrom, 'address')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <AnimatePresence>
                  {copiedField === 'address' && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-green-400 mt-1 font-medium"
                    >
                      Address copied!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Network */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Network</p>
                <div className="bg-muted/30 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                  <span className="text-base font-semibold">{exchangeData.networkFrom.toUpperCase()}</span>
                </div>
              </div>

              {/* Expected Amount */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">You Will Receive</p>
                <div className="flex items-center justify-between bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 backdrop-blur-sm border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-green-400">{exchangeData.amountTo}</span>
                    <span className="text-sm font-semibold">{exchangeData.tickerTo.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Recipient Address</p>
                <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all">
                  <span className="font-mono text-sm truncate mr-2">{exchangeData.addressTo}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-purple-500/20 transition-all"
                    onClick={() => copyToClipboard(exchangeData.addressTo, 'recipient')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <AnimatePresence>
                  {copiedField === 'recipient' && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-green-400 mt-1 font-medium"
                    >
                      Address copied!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Test button for simulating completion */}
            {/* <Button
              className="w-full mt-4 h-10 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={simulateCompletion}
            >
              Test Completion Animation
            </Button> */}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
            >
              <Button
                className="w-full mt-4 h-12 text-sm rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 hover:from-purple-700 hover:via-purple-600 hover:to-purple-800 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all font-semibold"
                onClick={() => router.push('/')}
              >
                Back to Swap
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-6 w-full max-w-md border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Trophy className="h-10 w-10 text-white" />
                </motion.div>
                
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Exchange Completed!
                </motion.h2>
                
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-purple-200 mb-6"
                >
                  Your {exchangeData.amountTo} {exchangeData.tickerTo.toUpperCase()} has been successfully sent to your wallet.
                </motion.p>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-purple-200">Transaction ID</span>
                    <div className="flex items-center">
                      <span className="text-white font-mono text-sm mr-2">{exchangeData.id.substring(0, 8)}...</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(exchangeData.id, 'transaction')}
                      >
                        <Copy className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Amount Received</span>
                    <span className="text-white font-bold">{exchangeData.amountTo} {exchangeData.tickerTo.toUpperCase()}</span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl"
                    onClick={handleCreateNewExchange}
                  >
                    Back to Swap
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}