"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/ui/top-bar";
import { BottomBar } from "@/components/ui/bottom-bar";
import { SupportButton } from "@/components/ui/support-button";
import { FallingPattern } from "@/components/ui/falling-pattern";

export default function TrackTransaction() {
  const router = useRouter();
  const [exchangeId, setExchangeId] = useState("");

  const handleCheckStatus = () => {
    if (exchangeId.trim()) {
      router.push(`/exchange/${exchangeId.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckStatus();
    }
  };

  return (
    <>
      <TopBar />
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
                    Track Transaction
                  </h1>
                  <p className="text-muted-foreground">
                    Enter your Exchange ID to check status
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-muted-foreground font-medium mb-2 block">
                      Exchange ID
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. 89d1f3..."
                      value={exchangeId}
                      onChange={(e) => setExchangeId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-14 rounded-xl bg-background/40 border-white/10 focus:border-orange-500 transition-all text-lg"
                    />
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      size="lg"
                      onClick={handleCheckStatus}
                      className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 hover:from-orange-700 hover:via-orange-600 hover:to-orange-800 shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all font-semibold"
                    >
                      Check Status
                    </Button>
                  </motion.div>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/")}
                      className="text-muted-foreground hover:text-orange-400 transition-colors"
                    >
                      Back to Swap
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}
