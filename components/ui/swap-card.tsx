"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SIMPLESWAP_API_KEY } from "@/lib/config";

export interface Token {
  symbol: string;
  name: string;
  icon: React.ComponentType<{ className?: string }> | string;
}

interface CurrencyInputPanelProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  selectedToken: Token;
  onTokenSelect: (token: Token) => void;
  tokens: Token[];
  usdValue: string;
  showMaxButton?: boolean;
  isSell?: boolean;
}

const CurrencyInputPanel: React.FC<CurrencyInputPanelProps> = ({
  label,
  value,
  onValueChange,
  selectedToken,
  onTokenSelect,
  tokens,
  usdValue,
  showMaxButton = false,
  isSell = false,
}) => (
  <Card className="bg-background/40 rounded-2xl border border-white/10 shadow-none backdrop-blur-sm glass-effect">
    <CardContent className="p-4">
      <div className="mb-3">
        <span className="text-sm font-medium text-muted-foreground">{isSell ? "You Send" : "You Get"}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Input
          type="number"
          placeholder="0"
          min="0"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          className="text-3xl font-semibold h-auto p-0 border-none focus-visible:ring-0 shadow-none bg-transparent"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full h-12 px-4 gap-2 text-lg hover:scale-105 transition-all glass-effect hover:bg-transparent">
              {typeof selectedToken.icon === 'string' ? (
                <Image src={selectedToken.icon} alt={selectedToken.symbol} width={24} height={24} className="h-6 w-6" />
              ) : (
                <selectedToken.icon className="h-6 w-6" />
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold leading-tight">{selectedToken.symbol}</span>
                <span className="text-xs text-muted-foreground leading-tight">{selectedToken.name}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-background/10 border border-white/10 glass-effect">
            {tokens.map((token) => (
              <DropdownMenuItem
                key={token.symbol}
                onSelect={() => onTokenSelect(token)}
                className="cursor-pointer transition-all"
              >
                {typeof token.icon === 'string' ? (
                  <Image src={token.icon} alt={token.symbol} width={24} height={24} className="h-6 w-6 mr-2" />
                ) : (
                  <token.icon className="h-6 w-6 mr-2" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{token.symbol}</span>
                  <span className="text-xs text-muted-foreground">{token.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-muted-foreground">${usdValue}</span>
      </div>
    </CardContent>
  </Card>
);

export interface SwapCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tokens: Token[];
  initialSellToken: Token;
  initialBuyToken: Token;
  onSwap: (data: { sellAmount: string; buyAmount: string; sellToken: Token; buyToken: Token; recipientAddress: string }) => void;
}

const SwapCard = React.forwardRef<HTMLDivElement, SwapCardProps>(
  ({ className, tokens, initialSellToken, initialBuyToken, onSwap, ...props }, ref) => {
    // State for managing inputs and token selections
    const [sellAmount, setSellAmount] = React.useState("10");
    const [buyAmount, setBuyAmount] = React.useState("147.712");
    const [sellToken, setSellToken] = React.useState<Token>(initialSellToken);
    const [buyToken, setBuyToken] = React.useState<Token>(initialBuyToken);
    const [recipientAddress, setRecipientAddress] = React.useState("");
    const [isSellOnTop, setIsSellOnTop] = React.useState(true);
    const [prices, setPrices] = React.useState<Record<string, number>>({});
    const [loading, setLoading] = React.useState(true);

    const getNetwork = (tokenSymbol: string) => {
      switch (tokenSymbol.toLowerCase()) {
        case 'usdc':
          return 'sol';
        case 'zec':
          return 'zec';
        case 'xmr':
          return 'xmr';
        case 'sol':
          return 'sol';
        default:
          return 'eth';
      }
    };

    React.useEffect(() => {
      const fetchPrices = async () => {
        try {
          setLoading(true);
          const priceMap: Record<string, number> = {};
          
          const baseCurrency = "usdc";
          const baseNetwork = "sol";
          
          for (const token of tokens) {
            try {
              if (token.symbol.toLowerCase() === baseCurrency) {
                priceMap[token.symbol.toUpperCase()] = 1.00;
                continue;
              }
              
              const tokenNetwork = getNetwork(token.symbol);
              
              const response = await fetch(
                `https://api.simpleswap.io/v3/estimates?api_key=${SIMPLESWAP_API_KEY}&amount=1&tickerFrom=${token.symbol.toLowerCase()}&tickerTo=${baseCurrency}&networkFrom=${tokenNetwork}&networkTo=${baseNetwork}`,
                {
                  headers: {
                    'X-API-KEY': SIMPLESWAP_API_KEY
                  }
                }
              );
              
              if (response.ok) {
                const data = await response.json();
                const price = parseFloat(data.result?.estimatedAmount || 0);
                if (!isNaN(price) && price > 0) {
                  priceMap[token.symbol.toUpperCase()] = price;
                } else {
                  const defaultPrices: Record<string, number> = {
                    "SOL": 100.00,
                    "ZEC": 25.00,
                    "XMR": 150.00,
                    "USDC": 1.00
                  };
                  priceMap[token.symbol.toUpperCase()] = defaultPrices[token.symbol.toUpperCase()] || 0;
                }
              } else {
                const defaultPrices: Record<string, number> = {
                  "SOL": 100.00,
                  "ZEC": 25.00,
                  "XMR": 150.00,
                  "USDC": 1.00
                };
                priceMap[token.symbol.toUpperCase()] = defaultPrices[token.symbol.toUpperCase()] || 0;
              }
            } catch (error) {
              console.error(`Error fetching price for ${token.symbol}:`, error);
              const defaultPrices: Record<string, number> = {
                "SOL": 100.00,
                "ZEC": 25.00,
                "XMR": 150.00,
                "USDC": 1.00
              };
              priceMap[token.symbol.toUpperCase()] = defaultPrices[token.symbol.toUpperCase()] || 0;
            }
          }
          
          console.log("Price map:", priceMap);
          setPrices(priceMap);
        } catch (error) {
          console.error("Error fetching prices:", error);
          setPrices({
            "SOL": 100.00,
            "ZEC": 25.00,
            "XMR": 150.00,
            "USDC": 1.00
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchPrices();
    }, []);

    React.useEffect(() => {
      if (sellAmount && prices[sellToken.symbol] && prices[buyToken.symbol]) {
        const sellValue = parseFloat(sellAmount) * prices[sellToken.symbol];
        const newBuyAmount = sellValue / prices[buyToken.symbol];
        setBuyAmount(newBuyAmount.toFixed(2));
      }
    }, [sellAmount, sellToken, buyToken, prices]);

    const handleSwapPosition = () => {
      const tempToken = sellToken;
      const tempAmount = sellAmount;
      
      setSellToken(buyToken);
      setSellAmount(buyAmount);
      
      setBuyToken(tempToken);
      setBuyAmount(tempAmount);
      
      setIsSellOnTop(!isSellOnTop);
    };

    const sellUsdValue = sellAmount && prices[sellToken.symbol] ?
      (parseFloat(sellAmount) * prices[sellToken.symbol]).toFixed(2) : "0.00";
    const buyUsdValue = buyAmount && prices[buyToken.symbol] ?
      (parseFloat(buyAmount) * prices[buyToken.symbol]).toFixed(2) : "0.00";

    const exchangeRate = prices[buyToken.symbol] && prices[sellToken.symbol] ?
      (prices[buyToken.symbol] / prices[sellToken.symbol]).toFixed(6) : "0.000000";

    // Calculate minimum amount in selected sell token
    const getMinAmount = () => {
      const minAmountSOL = 0.0620137;
      const solPrice = prices["SOL"] || 100;
      const currentTokenPrice = prices[sellToken.symbol] || 1;

      if (sellToken.symbol === "SOL") {
        return minAmountSOL.toFixed(7);
      }

      // Convert minimum SOL amount to current token
      const minAmount = (minAmountSOL * solPrice) / currentTokenPrice;
      return minAmount.toFixed(7);
    };

    const sellPanel = (
        <CurrencyInputPanel
          label="Sell"
          value={sellAmount}
          onValueChange={setSellAmount}
          selectedToken={sellToken}
          onTokenSelect={setSellToken}
          tokens={tokens}
          usdValue={sellUsdValue}
          isSell={true}
        />
    );

    const buyPanel = (
        <CurrencyInputPanel
          label="Buy"
          value={buyAmount}
          onValueChange={setBuyAmount}
          selectedToken={buyToken}
          onTokenSelect={setBuyToken}
          tokens={tokens}
          usdValue={buyUsdValue}
          isSell={false}
        />
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          ref={ref}
          className={cn("w-full max-w-md mx-auto p-6 sm:p-4 rounded-3xl shadow-2xl border border-white/10 bg-card glass-effect", className)}
          {...props}
        >
          <CardContent className="p-2 sm:p-4">

            <div className="relative">
              <div className="bg-muted/30 rounded-2xl backdrop-blur-sm border border-white/5 hover:border-white/10 transition-colors glass-effect">
                {sellPanel}
              </div>

              <div className="flex justify-center my-2">
                <motion.div
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full h-12 w-12 border-4 border-background shadow-lg transition-all bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 glow-effect"
                      onClick={handleSwapPosition}
                  >
                    <ArrowUpDown className="h-5 w-5 text-white" />
                  </Button>
                </motion.div>
              </div>

              <div className="bg-muted/30 rounded-2xl backdrop-blur-sm border border-white/5 hover:border-white/10 transition-colors glass-effect">
                {buyPanel}
              </div>
            </div>

            <div className="mt-6">
              <Input
                type="text"
                placeholder="Enter recipient address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="mt-2 h-12 rounded-xl bg-background/40 border-white/10 focus:border-purple-500 transition-all text-foreground"
              />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6"
            >
              <div className="text-center mb-2">
                <span className="text-xs text-muted-foreground">
                  Min amount: {getMinAmount()} {sellToken.symbol}
                </span>
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 hover:from-purple-700 hover:via-purple-600 hover:to-purple-800 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all font-semibold glow-effect"
                onClick={() => onSwap({ sellAmount, buyAmount, sellToken, buyToken, recipientAddress })}
              >
                Exchange Now
              </Button>
            </motion.div>

            <div className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1 bg-background/20 rounded-lg p-2">
              <span>1 {buyToken.symbol} = {exchangeRate} {sellToken.symbol}</span>
              <span className="text-purple-400 font-medium">(${prices[buyToken.symbol]?.toFixed(2) || 0})</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

SwapCard.displayName = "SwapCard";

export { SwapCard };
