import React, { useState } from 'react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const deploymentSteps = [
    '> Creating default collection: Crew-7',
    '> Creating default workspace: Crew-7 Commander Board',
    '> Creating default Crew: Atlas',
    '> Creating default project: Project-X',
    '> Initializing environment...',
    '> Setup complete! 🚀',
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    
    try {
      // Animate through steps
      for (let i = 0; i < deploymentSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Call backend API
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/env/default-setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to setup environment');
      }

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setIsDeploying(false);
    }
  };

  if (isDeploying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
        {/* Animated Deploy Visual - Using CSS animation as placeholder for GIF */}
        <div className="relative w-64 h-64 mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] opacity-20 animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] opacity-40 animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-[#ea2323] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>

        {/* Deployment Steps */}
        <div className="w-full max-w-2xl space-y-2 font-mono text-sm">
          {deploymentSteps.map((step, index) => (
            <div
              key={index}
              className={`transition-all duration-300 ${
                index <= currentStep
                  ? 'opacity-100 text-[#4cf5a1]'
                  : 'opacity-30 text-white/40'
              }`}
            >
              {step}
              {index === currentStep && (
                <span className="inline-block ml-2 w-2 h-4 bg-[#4cf5a1] animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-2xl">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ea2323]/10 border border-[#ea2323]/20 text-sm font-semibold text-[#ea2323] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#ea2323] animate-pulse" />
            Welcome to Crew-7
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Let's Set Up Your Command Center
          </h1>
          
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            We'll create your default workspace, crew, and project to get you started immediately.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <div className="text-3xl mb-3">📁</div>
            <h3 className="font-bold text-white mb-2">Default Collection</h3>
            <p className="text-sm text-white/60">Crew-7 workspace for all your projects</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-white mb-2">Commander Board</h3>
            <p className="text-sm text-white/60">Central hub for mission orchestration</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-bold text-white mb-2">Atlas Crew</h3>
            <p className="text-sm text-white/60">Your first AI crew ready for missions</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-bold text-white mb-2">Project-X</h3>
            <p className="text-sm text-white/60">Starter project to explore capabilities</p>
          </div>
        </div>

        {/* Deploy Button */}
        <div className="text-center pt-4">
          <button
            onClick={handleDeploy}
            className="px-8 py-4 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-bold text-lg shadow-lg shadow-[#ea2323]/30 transform hover:scale-105"
          >
            Deploy and Setup Default Environment
          </button>
          
          <p className="mt-4 text-xs text-white/40">
            This will take about 10 seconds
          </p>
        </div>
      </div>
    </div>
  );
};
