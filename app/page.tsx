"use client";

import { SwapCard, type Token } from "@/components/ui/swap-card";
import { useRouter } from "next/navigation";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { BottomBar } from "@/components/ui/bottom-bar";
import { SupportButton } from "@/components/ui/support-button";
import { useEffect, useState } from "react";

// Define the tokens with their data and icons
const tokens: Token[] = [
  {
    symbol: "SOL",
    name: "Solana",
    icon: "/solana.png",
  },
  {
    symbol: "USDC",
    name: "USDC (Solana)",
    icon: "/usdc.png",
  },
  {
    symbol: "XMR",
    name: "Monero",
    icon: "/xmr.png",
  },
  {
    symbol: "ZEC",
    name: "Zcash",
    icon: "/zcash.png",
  },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Временно убираем получение пользователя до решения проблемы с импортами
        // const currentUser = await getCurrentUser();
        // setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSwap = async (data: { sellAmount: string; buyAmount: string; sellToken: Token; buyToken: Token; recipientAddress: string }) => {
    console.log("Swap Initiated:", {
      from: `${data.sellAmount} ${data.sellToken.symbol}`,
      to: `${data.buyAmount} ${data.buyToken.symbol}`,
    });
    
    // ChangeNow/SimpleSwap API integration for actual exchange
    try {
      // Check if sell and buy tokens are different
      if (data.sellToken.symbol.toLowerCase() === data.buyToken.symbol.toLowerCase()) {
        alert("Please select different tokens for swap.");
        return;
      }

      // First, let's check if the currencies are supported
      try {
        const currenciesResponse = await fetch('https://api.simpleswap.io/v3/currencies', {
        headers: {
          'X-API-KEY': '55e3cd77-67a7-4bb4-a37d-5e4b0397a747'
        }
      });
        const currenciesData = await currenciesResponse.json();
        
        // Check if currenciesData is an array or has result array
        let currenciesArray = currenciesData;
        if (!Array.isArray(currenciesData)) {
          if (currenciesData.result && Array.isArray(currenciesData.result)) {
            currenciesArray = currenciesData.result;
          } else {
            console.error("Currencies data is not an array:", currenciesData);
            alert("Error checking currency support. Please try again.");
            return;
          }
        }
        
        const isSellCurrencySupported = currenciesArray.some((currency: any) => currency.ticker?.toLowerCase() === data.sellToken.symbol.toLowerCase());
        const isBuyCurrencySupported = currenciesArray.some((currency: any) => currency.ticker?.toLowerCase() === data.buyToken.symbol.toLowerCase());
        
        if (!isSellCurrencySupported || !isBuyCurrencySupported) {
          alert(`Unsupported currency pair: ${data.sellToken.symbol} to ${data.buyToken.symbol}`);
          return;
        }
      } catch (error) {
        console.error("Error checking currency support:", error);
        // Continue with the exchange even if we can't verify currency support
      }
      
      // Get exchange estimate
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
            return 'eth'; // default network
        }
      };

      const estimateResponse = await fetch(`https://api.simpleswap.io/v3/estimates?api_key=55e3cd77-67a7-4bb4-a37d-5e4b0397a747&amount=${data.sellAmount}&tickerFrom=${data.sellToken.symbol.toLowerCase()}&tickerTo=${data.buyToken.symbol.toLowerCase()}&networkFrom=${getNetwork(data.sellToken.symbol)}&networkTo=${getNetwork(data.buyToken.symbol)}`);
      
      if (!estimateResponse.ok) {
        throw new Error(`Failed to get exchange estimate: ${estimateResponse.status} ${estimateResponse.statusText}`);
      }
      
      const estimatedData = await estimateResponse.json();
      const estimatedAmount = estimatedData.result.estimatedAmount;
      
      // Create exchange using SimpleSwap API
      const createResponse = await fetch('https://api.simpleswap.io/v3/exchanges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': '55e3cd77-67a7-4bb4-a37d-5e4b0397a747'
        },
        body: JSON.stringify({
          "tickerFrom": data.sellToken.symbol.toLowerCase(),
          "tickerTo": data.buyToken.symbol.toLowerCase(),
          "amount": data.sellAmount,
          "networkFrom": getNetwork(data.sellToken.symbol),
          "networkTo": getNetwork(data.buyToken.symbol),
          "addressTo": data.recipientAddress,
          "userRefundAddress": "",
          "fixed": false
        })
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create exchange: ${createResponse.status} ${createResponse.statusText}. ${errorText}`);
      }

      const result = await createResponse.json();
      console.log('Exchange created:', result);
      
      // Prepare data for the exchange page
      const exchangeDetails = {
        id: result.result.id,
        addressFrom: result.result.addressFrom,
        tickerFrom: result.result.tickerFrom,
        networkFrom: result.result.networkFrom,
        amountFrom: data.sellAmount,
        tickerTo: result.result.tickerTo,
        amountTo: result.result.amountTo,
        addressTo: data.recipientAddress
      };
      
      // Save exchange data to localStorage and redirect to exchange page
      localStorage.setItem('exchangeData', JSON.stringify(exchangeDetails));
      router.push(`/exchange/${result.result.id}`);
    } catch (error) {
      console.error("Swap error:", error);
      alert("Error initiating swap. Please try again.");
    }
  };

  return (
    <>
      <BottomBar />
      <SupportButton />

      <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 pt-20 pb-8 bg-gradient-to-br from-background to-muted">
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
          <SwapCard
            tokens={tokens}
            initialSellToken={tokens[0]} // SOL
            initialBuyToken={tokens[1]} // USDC
            onSwap={handleSwap}
          />
        </div>
      </main>
    </>
  );
}
