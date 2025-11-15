import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface WalletContextType {
  address: string | null;
  chain: string | null;
  isConnected: boolean;
  balance: number;
  connect: (address?: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chain, setChain] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const refreshBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddress(data.address);
        setChain(data.chain);
        setBalance(data.c7t_balance_offchain + data.c7t_balance_onchain);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, []);

  const connect = useCallback(async (providedAddress?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      let walletAddress = providedAddress;

      // If no address provided, try to get from MetaMask (or use mock)
      if (!walletAddress) {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          // Try MetaMask
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts',
          });
          walletAddress = accounts[0];
        } else {
          // Mock mode: generate a random address
          walletAddress = '0x' + Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join('');
        }
      }

      // Link wallet to backend
      const response = await fetch('/api/wallet/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: walletAddress,
          chain: 'test', // Default to test chain
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to link wallet');
      }

      const data = await response.json();
      setAddress(data.address);
      setChain(data.chain);
      setBalance(data.c7t_balance_offchain + data.c7t_balance_onchain);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/wallet', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setAddress(null);
      setChain(null);
      setBalance(0);
      setIsConnected(false);
    }
  }, []);

  // Load wallet on mount
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <WalletContext.Provider
      value={{
        address,
        chain,
        isConnected,
        balance,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
