import React, { useEffect, useRef, useState } from 'react';
import { Crew7Logo } from '../components/Crew7Logo';
import { AgentIcon, type AgentKey } from '../components/AgentIcon';
import {
  OrchestratorFace,
  EngineerFace,
  AnalystFace,
  ArchitectFace,
  CreativeFace,
  OperationsFace,
  FinancialFace,
} from '../components/HybridCAgents';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useAnime, useScrollAnimation } from '../src/lib/useAnime';

/**
 * ZYNIQ CREW-7 — CINEMATIC 3D LANDING PAGE
 * Ultra-modern design with 3D transformations, glassmorphism, neon glows,
 * and scroll-triggered animations that morph between scenes
 */

export const LandingPageV2: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      setScrollProgress(progress);
      
      // Calculate active scene based on scroll
      const scene = Math.floor(progress * 7);
      setActiveScene(Math.min(scene, 6));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Dynamic 3D Background */}
      <BackgroundOrb scrollProgress={scrollProgress} />
      
      {/* Floating Nav */}
      <FloatingNav />

      {/* Hero Scene - Cosmic Gateway */}
      <HeroScene active={activeScene === 0} scrollProgress={scrollProgress} />

      {/* Meet the Crew */}
      <CrewLineupSection scrollProgress={scrollProgress} />

      {/* Industry Universe */}
      <IndustryShowcase active={activeScene === 1} scrollProgress={scrollProgress} />

      {/* Marketplace Dimension */}
      <MarketplaceScene active={activeScene === 2} scrollProgress={scrollProgress} />

      {/* Portfolio Matrix */}
      <PortfolioScene active={activeScene === 3} scrollProgress={scrollProgress} />

      {/* Web3 Nexus */}
      <Web3Scene active={activeScene === 4} scrollProgress={scrollProgress} />

      {/* Mission Command Center */}
      <MissionsScene active={activeScene === 5} scrollProgress={scrollProgress} />

      {/* Final CTA - Crew Assembly */}
      <FinalCTA active={activeScene === 6} scrollProgress={scrollProgress} />
    </div>
  );
};

// ========================================
// COMPONENTS
// ========================================

const BackgroundOrb: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  const rotation = scrollProgress * 360;
  const scale = 1 + scrollProgress * 0.5;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Animated mesh gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#2a2a2a]" />
      
      {/* Primary orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[128px] opacity-30 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, #ea2323, #c41e1e, #9a1818)`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        }}
      />
      
      {/* Secondary orb */}
      <div
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[128px] opacity-20 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, #ffffff, #e0e0e0, #c0c0c0)`,
          transform: `rotate(${-rotation}deg) scale(${1.2 - scrollProgress * 0.3})`,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + i % 3}s`,
            }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: `perspective(1000px) rotateX(${60 - scrollProgress * 30}deg) translateZ(0)`,
        }}
      />
    </div>
  );
};

const FloatingNav: React.FC = () => (
  <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl">
    <div className="flex items-center gap-8">
      <Crew7Logo variant="horizontal" size="sm" />
      <div className="flex gap-6 text-sm font-medium">
        <a href="#industry" className="text-white/80 hover:text-white transition-colors">Universe</a>
        <a href="#marketplace" className="text-white/80 hover:text-white transition-colors">Marketplace</a>
        <a href="#web3" className="text-white/80 hover:text-white transition-colors">Web3</a>
        <a href="#missions" className="text-white/80 hover:text-white transition-colors">Missions</a>
      </div>
      <button className="px-6 py-2 rounded-xl bg-[#ea2323] font-semibold shadow-lg shadow-[#ea2323]/50 hover:shadow-[#ea2323]/70 hover:bg-[#ff2e2e] transition-all">
        Launch
      </button>
    </div>
  </nav>
);

const CrewLineupSection: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  const { staggerFadeIn } = useAnime();
  const sectionRef = useScrollAnimation(() => {
    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll('.crew-card');
      staggerFadeIn(cards, 80);
    }
  });

  const crewMembers = [
    { Face: OrchestratorFace, name: 'Orchestrator', role: 'Mission Control', desc: 'Coordinates all agents & delegates tasks' },
    { Face: EngineerFace, name: 'Engineer', role: 'Full-Stack Builder', desc: 'Develops SaaS, APIs, infrastructure' },
    { Face: AnalystFace, name: 'Analyst', role: 'Data Scientist', desc: 'Insights, metrics, business intelligence' },
    { Face: ArchitectFace, name: 'Architect', role: 'System Designer', desc: 'Cloud architecture, scalability, security' },
    { Face: CreativeFace, name: 'Creative', role: 'Brand Visionary', desc: 'Design, content, storytelling' },
    { Face: OperationsFace, name: 'Operations', role: 'Process Optimizer', desc: 'Workflows, automation, efficiency' },
    { Face: FinancialFace, name: 'Financial', role: 'CFO Agent', desc: 'Forecasting, valuation, budgets' },
  ];

  return (
    <section ref={sectionRef as any} className="relative min-h-screen flex items-center justify-center py-32 px-6">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-white">
            Meet Your Crew
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Seven specialized AI agents, each with unique capabilities. Deploy them individually or as a unified team.
          </p>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {crewMembers.map((member, i) => (
            <div
              key={member.name}
              className="crew-card group relative p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 hover:border-[#ea2323]/50 hover:scale-105 transition-all duration-300 opacity-0"
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {/* Agent Face */}
              <div className="flex justify-center mb-6">
                <member.Face size={120} className="group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Info */}
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-white">{member.name}</h3>
                <div className="text-sm text-[#ea2323] font-semibold mb-3 uppercase tracking-wider">{member.role}</div>
                <p className="text-sm text-white/70 leading-relaxed">{member.desc}</p>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#ea2323]/0 to-[#ea2323]/0 group-hover:from-[#ea2323]/20 group-hover:to-[#ea2323]/5 blur-xl transition-all duration-500 -z-10 opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* Center "Full Lineup" visual */}
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {crewMembers.map((member, i) => (
            <div
              key={`lineup-${member.name}`}
              className="transition-transform hover:scale-125 hover:-translate-y-2 duration-300"
              style={{
                animationDelay: `${i * 0.15}s`,
              }}
            >
              <member.Face size={i === 0 ? 100 : 80} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HeroScene: React.FC<{ active: boolean; scrollProgress: number }> = ({ active, scrollProgress }) => {
  const opacity = Math.max(0, 1 - scrollProgress * 8);
  const scale = 1 - scrollProgress * 0.5;
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { breathe, glowPulse, staggerFadeIn } = useAnime();

  const agents = [
    { Face: OrchestratorFace, name: 'Orchestrator' },
    { Face: EngineerFace, name: 'Engineer' },
    { Face: AnalystFace, name: 'Analyst' },
    { Face: ArchitectFace, name: 'Architect' },
    { Face: CreativeFace, name: 'Creative' },
    { Face: OperationsFace, name: 'Operations' },
    { Face: FinancialFace, name: 'Financial' },
  ];

  // Hero entrance + idle animations
  useEffect(() => {
    if (!active) return;

    // Logo breathe animation
    if (logoRef.current) {
      breathe(logoRef.current, 2400);
    }

    // Text stagger fade-in
    if (textRef.current) {
      const textElements = textRef.current.querySelectorAll('p, button');
      staggerFadeIn(textElements, 100);
    }
  }, [active, breathe, staggerFadeIn]);

  return (
    <section className="relative min-h-screen flex items-center justify-center" style={{ opacity, transform: `scale(${scale})` }}>
      <div className="relative z-10 text-center px-6">
        {/* Cyberpunk AI Faces Constellation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[700px] h-[700px]" style={{ transform: `rotateY(${scrollProgress * 180}deg)` }}>
            {agents.map((agent, i) => {
              const angle = (i / agents.length) * Math.PI * 2;
              const radius = 280;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={agent.name}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-125"
                  style={{
                    transform: `translate(${x}px, ${y}px) rotateY(${-scrollProgress * 180}deg)`,
                  }}
                >
                  <agent.Face size={i === 0 ? 100 : 80} className="drop-shadow-[0_0_40px_rgba(234,35,35,0.4)] animate-float" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero text */}
        <div ref={textRef} className="relative z-20 mt-64">
          <div ref={logoRef} className="flex justify-center mb-8">
            <Crew7Logo variant="vertical" size="lg" />
          </div>
          <p className="text-2xl md:text-4xl font-light text-white/95 mb-4">
            Your Autonomous AI Teams
          </p>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
            From code to commerce. From finance to funnels. From ideas to reality.
          </p>
          
          <div className="flex gap-4 justify-center">
            <button className="group px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/25 font-semibold hover:bg-white/20 transition-all shadow-2xl text-white">
              Build Your Crew
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button className="px-8 py-4 rounded-2xl bg-[#ea2323] font-semibold shadow-lg shadow-[#ea2323]/50 hover:shadow-[#ea2323]/70 hover:bg-[#ff2e2e] transition-all">
              Explore Marketplace
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

const IndustryShowcase: React.FC<{ active: boolean; scrollProgress: number }> = ({ active, scrollProgress }) => {
  const industries = [
    { icon: '💻', name: 'Engineering', desc: 'Full-stack SaaS, APIs, infrastructure, deployment', color: 'from-blue-500 to-cyan-500' },
    { icon: '📊', name: 'Marketing', desc: 'Funnels, ads, copywriting, A/B testing', color: 'from-purple-500 to-pink-500' },
    { icon: '💼', name: 'Business', desc: 'Pitch decks, business plans, competitor analysis', color: 'from-orange-500 to-red-500' },
    { icon: '💰', name: 'Finance', desc: 'Forecasting, valuation, portfolio simulation', color: 'from-green-500 to-emerald-500' },
    { icon: '🎯', name: 'Operations', desc: 'Process automation, workflow optimization', color: 'from-yellow-500 to-orange-500' },
    { icon: '🎪', name: 'Events', desc: 'Planning, logistics, budgets, coordination', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center py-32">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <AgentIcon agent="vega" size={48} />
            <span className="text-sm font-semibold text-[#ea2323] uppercase tracking-wider">VEGA — Multi-Domain Specialist</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/95 to-white/80">
              Universal AI Teams
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Deploy specialized crews for any mission. Every profession. Every domain.
          </p>
        </div>

        {/* 3D Rotating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, i) => (
            <IndustryCard
              key={industry.name}
              {...industry}
              index={i}
              scrollProgress={scrollProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const IndustryCard: React.FC<{
  icon: string;
  name: string;
  desc: string;
  color: string;
  index: number;
  scrollProgress: number;
}> = ({ icon, name, desc, color, index, scrollProgress }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="group relative"
      style={{
        transform: `translateY(${Math.sin(scrollProgress * 10 + index) * 20}px)`,
        transition: 'transform 0.3s ease-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glassmorphism card */}
      <div className={`
        relative p-8 rounded-3xl backdrop-blur-2xl border transition-all duration-500
        ${isHovered ? 'bg-white/10 border-white/30 scale-105 shadow-2xl' : 'bg-white/5 border-white/10'}
      `}>
        {/* Gradient overlay on hover */}
        <div className={`
          absolute inset-0 rounded-3xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500
        `} />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
            {icon}
          </div>
          <h3 className="text-2xl font-bold mb-3">{name}</h3>
          <p className="text-white/60 leading-relaxed">{desc}</p>
        </div>

        {/* Glow effect */}
        <div className={`
          absolute -inset-1 rounded-3xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10
        `} />
      </div>
    </div>
  );
};

const MarketplaceScene: React.FC<{ active: boolean; scrollProgress: number }> = ({ active, scrollProgress }) => (
  <section className="relative min-h-screen flex items-center justify-center py-32">
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <div className="flex items-center justify-center gap-4 mb-6">
          <AgentIcon agent="quark" size={48} />
          <span className="text-sm font-semibold text-[#ea2323] uppercase tracking-wider">QUARK — Marketplace Guardian</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/95 to-white/85">
          AI Teams as Assets
        </h2>
        <p className="text-xl text-white/80 max-w-3xl mx-auto">
          Buy, sell, rent autonomous crews with portfolios, reputation, and economic value.
        </p>
      </div>

      {/* Floating crew capsules */}
      <div className="relative h-[600px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <CrewCapsule key={i} index={i} scrollProgress={scrollProgress} />
        ))}
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
        {[
          { title: 'Buy & Sell', desc: 'Own AI teams as NFT assets', icon: '🛒' },
          { title: 'Rent Teams', desc: 'Pay-per-mission rentals', icon: '⚡' },
          { title: 'Reputation', desc: 'XP, ratings, track record', icon: '⭐' },
        ].map((feature) => (
          <div key={feature.title} className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-white/60">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CrewCapsule: React.FC<{ index: number; scrollProgress: number }> = ({ index, scrollProgress }) => {
  const agents: AgentKey[] = ['orion', 'vega', 'nova', 'atlas', 'lyra'];
  const angle = (index / 5) * Math.PI * 2 + scrollProgress * Math.PI;
  const radius = 200;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.5;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
      style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
    >
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl hover:scale-110 hover:shadow-red-500/50 transition-all duration-300">
        <AgentIcon agent={agents[index]} size={64} />
        <div className="mt-4 text-center">
          <div className="text-sm font-semibold mb-1">{agents[index].toUpperCase()}</div>
          <div className="text-xs text-white/50">Level {5 + index}</div>
          <div className="mt-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
            Available
          </div>
        </div>
      </div>
    </div>
  );
};

const PortfolioScene: React.FC<{ active: boolean; scrollProgress: number }> = ({ active, scrollProgress }) => (
  <section className="relative min-h-screen flex items-center justify-center py-32">
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <AgentIcon agent="nova" size={48} />
            <span className="text-sm font-semibold text-[#ea2323] uppercase tracking-wider">NOVA — Portfolio Architect</span>
          </div>
          <h2 className="text-5xl font-black mb-6 text-white">
            Living Portfolios
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Every crew builds a verifiable track record. Missions completed, skills mastered, reputation earned.
          </p>

          <div className="space-y-4">
            {[
              { label: 'Missions Completed', value: 1247, color: 'from-green-500 to-emerald-500' },
              { label: 'Success Rate', value: 94.8, decimals: 1, suffix: '%', color: 'from-blue-500 to-cyan-500' },
              { label: 'Skills Unlocked', value: 186, color: 'from-purple-500 to-pink-500' },
              { label: 'Client Rating', value: 4.9, decimals: 1, suffix: '/5', color: 'from-yellow-500 to-orange-500' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <span className="text-white/70">{stat.label}</span>
                <AnimatedCounter 
                  end={stat.value}
                  decimals={stat.decimals || 0}
                  suffix={stat.suffix || ''}
                  className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <AnimatedCounter 
                  end={10000}
                  suffix="+"
                  className="text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#ea2323] to-orange-500"
                />
                <div className="text-xl text-white/70">Artifacts Created</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Web3Scene: React.FC<{ active: boolean; scrollProgress: number }> = ({ active, scrollProgress }) => (
  <section className="relative min-h-screen flex items-center justify-center py-32">
    <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
      <div className="flex items-center justify-center gap-4 mb-6">
        <AgentIcon agent="helix" size={48} />
        <span className="text-sm font-semibold text-[#ea2323] uppercase tracking-wider">HELIX — Blockchain Sentinel</span>
      </div>
      
      <h2 className="text-5xl md:text-7xl font-black mb-6 text-white">
        Powered by Web3
      </h2>
      
      <p className="text-xl text-white/80 max-w-3xl mx-auto mb-16">
        Tokenized crews, immutable reputation, trustless rentals, and provable ownership.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: '🎫', title: 'NFT Ownership', desc: 'Crews as verifiable digital assets' },
          { icon: '⛓️', title: 'Smart Contracts', desc: 'Automated rental agreements' },
          { icon: '💎', title: 'Reputation Tokens', desc: 'On-chain XP and achievements' },
          { icon: '💰', title: 'Crypto Payments', desc: 'Instant, global transactions' },
          { icon: '🔒', title: 'Decentralized ID', desc: 'Sovereign crew identities' },
          { icon: '📊', title: 'Transparent Ledger', desc: 'Public earning history' },
        ].map((feature, i) => (
          <div
            key={feature.title}
            className="group p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-white/60">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const MissionsScene: React.FC<{ active: boolean; scrollProgress: number }> = ({ active, scrollProgress }) => (
  <section className="relative min-h-screen flex items-center justify-center py-32">
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <div className="flex items-center justify-center gap-4 mb-6">
          <AgentIcon agent="atlas" size={48} />
          <span className="text-sm font-semibold text-[#ea2323] uppercase tracking-wider">ATLAS — Mission Commander</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-black mb-6 text-white">
          Real-World Missions
        </h2>
        <p className="text-xl text-white/80 max-w-3xl mx-auto">
          Deploy your crew for any challenge. Execute with precision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Launch SaaS MVP', time: '48 hours', complexity: 'High' },
          { title: 'Business Plan + Pitch', time: '24 hours', complexity: 'Medium' },
          { title: 'Marketing Funnel', time: '72 hours', complexity: 'Medium' },
          { title: 'Financial Valuation', time: '36 hours', complexity: 'High' },
          { title: 'Event Planning', time: '1 week', complexity: 'Low' },
          { title: 'Operations Automation', time: '5 days', complexity: 'High' },
        ].map((mission, i) => (
          <div
            key={mission.title}
            className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 hover:border-[#ea2323]/50 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323]/0 to-[#ea2323]/0 group-hover:from-[#ea2323]/10 group-hover:to-[#ea2323]/5 transition-all duration-500" />
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">{mission.title}</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">{mission.time}</span>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400">{mission.complexity}</span>
              </div>
              <button className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-white/10 font-semibold group-hover:bg-[#ea2323] group-hover:border-[#ea2323] transition-all">
                Deploy Crew
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FinalCTA: React.FC<{ active: boolean; scrollProgress: number }> = ({ active, scrollProgress }) => {
  const agents: AgentKey[] = ['orion', 'vega', 'nova', 'atlas', 'lyra', 'helix'];
  
  return (
    <section className="relative min-h-screen flex items-center justify-center py-32">
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* All robots in circle formation */}
        <div className="relative mb-20">
          <div className="relative w-[500px] h-[500px] mx-auto">
            {agents.map((agent, i) => {
              const angle = (i / agents.length) * Math.PI * 2;
              const radius = 200;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={agent}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                >
                  <AgentIcon agent={agent} size={80} />
                </div>
              );
            })}
            
            {/* Center logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Crew7Logo variant="sign" size="lg" />
            </div>
          </div>
        </div>

        <h2 className="text-6xl md:text-8xl font-black mb-8 text-white">
          Assemble Your Crew
        </h2>
        
        <p className="text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
          The future of work is autonomous. Start building with AI teams that never sleep.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button className="px-12 py-6 rounded-2xl bg-[#ea2323] text-xl font-bold shadow-2xl shadow-[#ea2323]/50 hover:shadow-[#ea2323]/70 hover:scale-105 hover:bg-[#ff2e2e] transition-all">
            Deploy Your First Crew
          </button>
          <button className="px-12 py-6 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/25 text-xl font-bold hover:bg-white/20 hover:border-white/35 transition-all">
            Explore Marketplace
          </button>
        </div>

        {/* Final stats */}
        <div className="mt-24 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { value: '10K+', label: 'Active Crews' },
            { value: '50K+', label: 'Missions Completed' },
            { value: '95%', label: 'Success Rate' },
          ].map((stat) => (
            <div key={stat.label} className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
              <div className="text-4xl font-black mb-2 text-[#ea2323]">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingPageV2;
