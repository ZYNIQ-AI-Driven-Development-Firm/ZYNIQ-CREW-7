import React, { useState } from 'react';
import { useWallet } from './useWallet';

export const WalletConnect: React.FC = () => {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setShowModal(true);
    setError('');
  };

  const handleConnectWithAddress = async () => {
    if (!manualAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address format');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await connect(manualAddress);
      setShowModal(false);
      setManualAddress('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectAuto = async () => {
    setIsLoading(true);
    setError('');

    try {
      await connect(); // Will try MetaMask or generate mock address
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="relative group">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          onClick={() => setShowModal(true)}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium">{shortenAddress(address)}</span>
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-6">Wallet Connected</h3>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-white/50 mb-1">Address</div>
                  <div className="font-mono text-sm break-all">{address}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-white/50 mb-1">Network</div>
                  <div className="text-sm">Test Network (Mock Mode)</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all font-semibold"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleConnect}
        className="px-5 py-2.5 rounded-xl bg-[#ea2323] font-semibold text-sm hover:bg-[#ff2e2e] transition-all shadow-lg shadow-[#ea2323]/30"
      >
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-2">Connect Wallet</h3>
            <p className="text-white/60 mb-6">Link your wallet to manage C7T tokens and rent/buy crews</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              {/* Auto-connect option */}
              <button
                onClick={handleConnectAuto}
                disabled={isLoading}
                className="w-full p-4 rounded-xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20 hover:border-[#ea2323]/40 transition-all text-left group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold mb-1">Quick Connect</div>
                    <div className="text-sm text-white/60">Auto-detect wallet or generate test address</div>
                  </div>
                  <div className="text-2xl group-hover:scale-110 transition-transform">🦊</div>
                </div>
              </button>

              {/* Manual address input */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <label className="block text-sm font-medium mb-2">Or enter address manually</label>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none font-mono text-sm mb-3"
                  disabled={isLoading}
                />
                <button
                  onClick={handleConnectWithAddress}
                  disabled={isLoading || !manualAddress}
                  className="w-full px-4 py-2 rounded-lg bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setError('');
                setManualAddress('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold"
              disabled={isLoading}
            >
              Cancel
            </button>

            <p className="mt-4 text-xs text-white/40 text-center">
              Running in test mode. No real blockchain connection required.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
