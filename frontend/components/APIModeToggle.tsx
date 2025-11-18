/**
 * API Mode Toggle Component
 * 
 * Allows switching between mock data and real backend API.
 * Shows current API status and connection info.
 */

import React, { useState, useEffect } from 'react';
import { Server, Database, Wifi, WifiOff, Check, X } from 'lucide-react';
import { useAPIConfig } from '../src/lib/apiConfig';
import { metadataAPI } from '../src/lib/metadataAPI';

export const APIModeToggle: React.FC = () => {
  const { useRealAPI, apiBaseUrl, setUseRealAPI, setAPIBaseUrl } = useAPIConfig();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check API connection
  const checkConnection = async () => {
    if (!useRealAPI) {
      setIsConnected(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`${apiBaseUrl}/health`);
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, [useRealAPI, apiBaseUrl]);

  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#ea2323]" />
          <h3 className="font-semibold">API Mode</h3>
        </div>
        
        {/* Connection Status */}
        {useRealAPI && (
          <div className="flex items-center gap-2 text-sm">
            {isChecking ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-white/60">Checking...</span>
              </>
            ) : isConnected === true ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Connected</span>
              </>
            ) : isConnected === false ? (
              <>
                <X className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Disconnected</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="space-y-3">
        <button
          onClick={() => setUseRealAPI(false)}
          className={`w-full p-3 rounded-xl border transition-all ${
            !useRealAPI
              ? 'bg-[#ea2323]/10 border-[#ea2323]/50 text-white'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-medium text-sm">Mock Data</div>
              <div className="text-xs text-white/50">
                Use demo data for testing
              </div>
            </div>
            {!useRealAPI && (
              <div className="w-2 h-2 rounded-full bg-[#ea2323]" />
            )}
          </div>
        </button>

        <button
          onClick={() => setUseRealAPI(true)}
          className={`w-full p-3 rounded-xl border transition-all ${
            useRealAPI
              ? 'bg-[#ea2323]/10 border-[#ea2323]/50 text-white'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-medium text-sm">Real API</div>
              <div className="text-xs text-white/50">
                Connect to backend server
              </div>
            </div>
            {useRealAPI && (
              <div className="w-2 h-2 rounded-full bg-[#ea2323]" />
            )}
          </div>
        </button>
      </div>

      {/* API URL Configuration (only when real API is selected) */}
      {useRealAPI && (
        <div className="pt-3 border-t border-white/10 space-y-2">
          <label className="text-xs text-white/50">Backend API URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setAPIBaseUrl(e.target.value)}
              placeholder="http://localhost:8080"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-[#ea2323]/50 outline-none"
            />
            <button
              onClick={checkConnection}
              disabled={isChecking}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-all disabled:opacity-50"
              title="Test connection"
            >
              <Wifi className="w-4 h-4" />
            </button>
          </div>
          
          {isConnected === false && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <WifiOff className="w-4 h-4 text-red-400 mt-0.5" />
              <div className="text-xs text-red-400">
                Cannot connect to backend. Make sure the server is running.
              </div>
            </div>
          )}
          
          {isConnected === true && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Check className="w-4 h-4 text-green-400 mt-0.5" />
              <div className="text-xs text-green-400">
                Successfully connected to backend API
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Message */}
      <div className="text-xs text-white/40">
        {useRealAPI
          ? 'Using real backend API. Crew data will be fetched from the database.'
          : 'Using mock data. No backend connection required.'}
      </div>
    </div>
  );
};
