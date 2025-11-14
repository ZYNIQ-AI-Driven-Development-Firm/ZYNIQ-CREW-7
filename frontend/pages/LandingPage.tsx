import React, { useEffect, useRef, useState } from 'react';
import { Crew7Logo } from '../components/Crew7Logo';
import { AgentIcon } from '../components/AgentIcon';

/**
 * Crew-7 Cinematic Landing Page
 * 
 * A scroll-driven narrative experience where each robot agent
 * introduces a section with animations and story beats.
 */

interface Section {
  id: string;
  robotNarrator: string;
  robotId: string;
}

const SECTIONS: Section[] = [
  { id: 'hero', robotNarrator: 'ORION — Universal Orchestrator', robotId: 'orion' },
  { id: 'industry-showcase', robotNarrator: 'VEGA — Multi-Domain Specialist', robotId: 'vega' },
  { id: 'problem', robotNarrator: 'NOVA — Problem Analyst', robotId: 'nova' },
  { id: 'solution', robotNarrator: 'ATLAS — Solution Architect', robotId: 'atlas' },
  { id: 'how-it-works', robotNarrator: 'LYRA — Process Engineer', robotId: 'lyra' },
  { id: 'advanced', robotNarrator: 'HELIX — Advanced Systems', robotId: 'helix' },
  { id: 'marketplace', robotNarrator: 'QUARK — Marketplace Curator', robotId: 'quark' },
  { id: 'portfolio', robotNarrator: 'NOVA — Performance Analyst', robotId: 'nova' },
  { id: 'web3', robotNarrator: 'HELIX — Blockchain Architect', robotId: 'helix' },
  { id: 'tokenomics', robotNarrator: 'SIGMA — Economic Architect', robotId: 'sigma' },
  { id: 'missions', robotNarrator: 'ATLAS — Mission Commander', robotId: 'atlas' },
  { id: 'cta', robotNarrator: 'ALL CREW — Final Command', robotId: 'sigma' },
];

const LandingPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const element = sectionsRef.current[id];
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0e1a] text-white">
      {/* Animated background particles */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0a0e1a]" />
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#ea2323]/10 blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[#ff6b35]/8 blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Crew7Logo variant="horizontal" size="sm" asLink />
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how-it-works" className="text-[#cbd4e6] hover:text-white transition">How It Works</a>
            <a href="#marketplace" className="text-[#cbd4e6] hover:text-white transition">Marketplace</a>
            <a href="/docs" className="text-[#cbd4e6] hover:text-white transition">Docs</a>
            <button className="rounded-xl bg-[#ea2323] px-6 py-2 font-semibold text-white shadow-lg shadow-[#ea2323]/40 transition hover:bg-[#ff4040]">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section
          id="hero"
          ref={(el) => (sectionsRef.current['hero'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <HeroSection />
        </section>

        {/* Slide Intro Section */}
        {/* Industry Showcase Section */}
        <section
          id="industry-showcase"
          ref={(el) => (sectionsRef.current['industry-showcase'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <SlideIntroSection />
        </section>

        {/* Problem Statement Section */}
        <section
          id="problem"
          ref={(el) => (sectionsRef.current['problem'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <ProblemSection />
        </section>

        {/* Solution Section */}
        <section
          id="solution"
          ref={(el) => (sectionsRef.current['solution'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <SolutionSection />
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          ref={(el) => (sectionsRef.current['how-it-works'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <HowItWorksSection />
        </section>

        {/* Advanced Mode Section */}
        <section
          id="advanced"
          ref={(el) => (sectionsRef.current['advanced'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <AdvancedModeSection />
        </section>

        {/* Marketplace Section */}
        <section
          id="marketplace"
          ref={(el) => (sectionsRef.current['marketplace'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <MarketplaceSection />
        </section>

        {/* Crew Portfolio Section */}
        <section
          id="portfolio"
          ref={(el) => (sectionsRef.current['portfolio'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <CrewPortfolioSection />
        </section>

        {/* Web3 Integration Section */}
        <section
          id="web3"
          ref={(el) => (sectionsRef.current['web3'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <Web3IntegrationSection />
        </section>

        {/* Tokenomics Section */}
        <section
          id="tokenomics"
          ref={(el) => (sectionsRef.current['tokenomics'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <TokenomicsSection />
        </section>

        {/* Mission Examples Section */}
        <section
          id="missions"
          ref={(el) => (sectionsRef.current['missions'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <MissionExamplesSection />
        </section>

        {/* CTA Section */}
        <section
          id="cta"
          ref={(el) => (sectionsRef.current['cta'] = el)}
          className="relative min-h-screen flex items-center justify-center"
        >
          <CTASection />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0a0e1a]/95 backdrop-blur-xl px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Crew7Logo variant="text" size="sm" />
            <nav className="flex gap-6 text-sm text-[#9ba7c2]">
              <a href="/about" className="hover:text-white transition">About</a>
              <a href="/privacy" className="hover:text-white transition">Privacy</a>
              <a href="/terms" className="hover:text-white transition">Terms</a>
              <a href="/contact" className="hover:text-white transition">Contact</a>
            </nav>
            <p className="text-sm text-[#6b7891]">© 2025 Crew-7. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================
// HERO SECTION - ORION (REIMAGINED)
// ============================================
const HeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="hero-animated-bg relative mx-auto max-w-7xl px-6 py-20 text-center">
      {/* Animated starfield background */}
      <div className="hero-starfield pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="hero-star absolute h-1 w-1 rounded-full bg-white"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Robot narrator */}
      <div className={`mb-8 flex items-center justify-center gap-3 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <AgentIcon id="orion" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          ORION — Universal Orchestrator
        </span>
      </div>

      {/* Logo entrance with holographic effect */}
      <div className={`hero-holographic-center mb-12 transition-all duration-1500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <Crew7Logo variant="horizontal" size="lg" className="mx-auto" />
      </div>

      {/* Headline - Universal scope */}
      <h1 className={`mb-6 text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-white via-[#f0f3f9] to-[#cbd4e6] bg-clip-text text-transparent transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        Your Autonomous AI Teams for Every Mission.
      </h1>

      {/* Subheadline - Multi-industry */}
      <p className={`mb-4 text-2xl md:text-3xl font-semibold text-[#ea2323] transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        From code to commerce. From finance to funnels. From ideas to reality.
      </p>

      {/* Description - Universal capabilities */}
      <p className={`mx-auto mb-12 max-w-3xl text-lg md:text-xl text-[#b8c2d8] transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        Crew-7 isn't just for developers. Deploy autonomous AI teams for <span className="font-bold text-white">marketing, business strategy, finance, operations, design, research</span>—any domain, any mission, infinite execution.
      </p>

      {/* Multi-domain badges */}
      <div className={`mb-12 flex flex-wrap items-center justify-center gap-3 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {['Engineering', 'Marketing', 'Finance', 'Business', 'Operations', 'Design', 'Research', 'Legal'].map((domain, idx) => (
          <span
            key={domain}
            className="feature-badge rounded-full border border-[#ea2323]/30 bg-[#ea2323]/10 px-4 py-2 text-sm font-semibold text-[#ea2323] backdrop-blur-sm transition hover:border-[#ea2323] hover:bg-[#ea2323]/20"
            style={{ animationDelay: `${1000 + idx * 100}ms` }}
          >
            {domain}
          </span>
        ))}
      </div>

      {/* CTAs with enhanced styling */}
      <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <button className="cta-button-primary group relative rounded-xl bg-[#ea2323] px-8 py-4 text-lg font-semibold text-white shadow-[0_0_40px_rgba(234,35,35,0.4)] transition hover:shadow-[0_0_60px_rgba(234,35,35,0.6)] hover:scale-105">
          <span className="relative z-10">Build Your First Universal Crew</span>
        </button>
        <button className="btn-secondary rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/40">
          Explore the Marketplace
        </button>
      </div>

      {/* Floating constellation particles */}
      <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-[#ea2323] animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute top-1/3 right-1/4 h-2 w-2 rounded-full bg-[#ff6b35] animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 h-2 w-2 rounded-full bg-[#ea2323] animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />

      <style>{`
        @keyframes pulse-grid {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// INDUSTRY SHOWCASE SECTION - VEGA
// ============================================
const SlideIntroSection: React.FC = () => {
  const industries = [
    {
      title: 'Marketing Crew',
      desc: 'Funnels, ads, copywriting, A/B testing',
      icon: '📢',
      color: '#ea2323',
      gradient: 'from-[#ea2323] to-[#ff6b35]',
    },
    {
      title: 'Business Crew',
      desc: 'Pitch decks, business plans, competitor analysis',
      icon: '💼',
      color: '#ff6b35',
      gradient: 'from-[#ff6b35] to-[#ea2323]',
    },
    {
      title: 'Finance Crew',
      desc: 'Forecasting, valuation, portfolio simulation',
      icon: '💰',
      color: '#ea2323',
      gradient: 'from-[#ea2323] to-[#ff4040]',
    },
    {
      title: 'Event Crew',
      desc: 'Planning, logistics, budgets',
      icon: '🎉',
      color: '#ff6b35',
      gradient: 'from-[#ff6b35] to-[#ff4040]',
    },
    {
      title: 'Startup Crew',
      desc: 'Prototype your MVP in 48 hours',
      icon: '🚀',
      color: '#ea2323',
      gradient: 'from-[#ea2323] to-[#ff6b35]',
    },
    {
      title: 'Engineering Crew',
      desc: 'Full-stack SaaS, APIs, infra, deployment',
      icon: '⚙️',
      color: '#ff4040',
      gradient: 'from-[#ff4040] to-[#ea2323]',
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="vega" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          VEGA — Multi-Domain Specialist
        </span>
      </div>

      <h2 className="mb-6 text-center text-4xl md:text-6xl font-bold">
        AI Teams Trained for <span className="bg-gradient-to-r from-[#ea2323] to-[#ff6b35] bg-clip-text text-transparent">Any Problem</span>
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-lg text-[#b8c2d8]">
        From market research to company formation, from SaaS building to investment analysis—deploy specialized crews for every domain.
      </p>

      {/* Horizontal scrolling industry cards */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
          {industries.map((industry, idx) => (
            <div
              key={idx}
              className="industry-card group min-w-[320px] snap-center animate-on-scroll"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="relative h-full overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 backdrop-blur-xl transition hover:border-[#ea2323]/50 hover:scale-105 hover:shadow-[0_20px_60px_rgba(234,35,35,0.3)]">
                {/* Network nodes background */}
                <div className="network-nodes-bg absolute inset-0 opacity-20" />
                
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-0 transition duration-500 group-hover:opacity-10`} />
                
                {/* Animated border glow */}
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-[#ea2323] via-[#ff6b35] to-[#ea2323] opacity-0 blur-sm transition duration-500 group-hover:opacity-50 -z-10" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6 text-7xl animate-bounce-slow">{industry.icon}</div>
                  
                  {/* Title */}
                  <h3 className="mb-3 text-2xl font-bold text-white group-hover:text-[#ea2323] transition">
                    {industry.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="mb-6 text-[#b8c2d8]">{industry.desc}</p>
                  
                  {/* Progress bar */}
                  <div className="h-1 w-full rounded-full bg-white/10">
                    <div 
                      className={`h-full w-0 rounded-full bg-gradient-to-r ${industry.gradient} transition-all duration-1000 group-hover:w-full`}
                    />
                  </div>
                  
                  {/* Deploy button */}
                  <button className="mt-6 w-full rounded-xl border border-white/20 bg-white/5 py-3 font-semibold text-white backdrop-blur-sm transition hover:border-[#ea2323] hover:bg-[#ea2323]/20">
                    Deploy Crew
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Scroll hint */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#9ba7c2]">
          <span>Scroll to explore</span>
          <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Universal capability statement */}
      <div className="mx-auto mt-16 max-w-4xl rounded-3xl border border-[#ea2323]/30 bg-gradient-to-br from-[#ea2323]/10 to-transparent p-8 text-center backdrop-blur-sm">
        <p className="text-xl font-semibold text-white">
          <span className="text-[#ea2323]">Crew-7 is universal AI labor.</span> Any profession. Any domain. Any mission. Infinite specialization.
        </p>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Orbiting robots component
const OrbitingRobots: React.FC = () => {
  const robots = ['orion', 'vega', 'nova', 'atlas', 'lyra', 'helix', 'quark'];

  return (
    <div className="relative h-full w-full">
      {/* Central core */}
      <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ea2323]/30 bg-gradient-to-br from-[#ea2323]/20 to-[#ff6b35]/20 backdrop-blur-xl flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#ea2323] to-[#ff6b35] animate-pulse" />
      </div>

      {/* Orbiting robots */}
      {robots.map((robotId, idx) => {
        const angle = (idx / robots.length) * 360;
        const radius = 180;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        return (
          <div
            key={robotId}
            className="absolute top-1/2 left-1/2 transition-transform duration-300 hover:scale-125"
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              animation: `orbit-${idx} 20s linear infinite`,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <AgentIcon id={robotId as any} size={56} />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9ba7c2]">
                {robotId}
              </span>
            </div>
            {/* Connection line to center */}
            <svg
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10"
              style={{
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <line
                x1="50%"
                y1="50%"
                x2={`calc(50% - ${x}px)`}
                y2={`calc(50% - ${y}px)`}
                stroke="rgba(234, 35, 35, 0.2)"
                strokeWidth="1"
              />
            </svg>
          </div>
        );
      })}

      <style>{`
        @keyframes orbit-0 { from { transform: translate(calc(-50% + ${Math.cos(0 * Math.PI / 180) * 180}px), calc(-50% + ${Math.sin(0 * Math.PI / 180) * 180}px)); } to { transform: translate(calc(-50% + ${Math.cos(360 * Math.PI / 180) * 180}px), calc(-50% + ${Math.sin(360 * Math.PI / 180) * 180}px)); } }
        @keyframes orbit-1 { from { transform: translate(calc(-50% + ${Math.cos(51.43 * Math.PI / 180) * 180}px), calc(-50% + ${Math.sin(51.43 * Math.PI / 180) * 180}px)); } to { transform: translate(calc(-50% + ${Math.cos(411.43 * Math.PI / 180) * 180}px), calc(-50% + ${Math.sin(411.43 * Math.PI / 180) * 180}px)); } }
      `}</style>
    </div>
  );
};

// ============================================
// PROBLEM SECTION - NOVA
// ============================================
const ProblemSection: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="nova" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          NOVA — Frontend Engineer
        </span>
      </div>

      <h2 className="mb-8 text-center text-4xl md:text-6xl font-bold">
        Software Development Has Become a Battle of Time.
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-xl text-[#b8c2d8]">
        Deadlines crush creativity. Talent is expensive. QA gets skipped. DevOps becomes a bottleneck. And scaling? Forget it. <span className="font-semibold text-[#ea2323]">Crew-7 flips the equation.</span>
      </p>

      {/* Chaos visualization */}
      <div className="mx-auto max-w-4xl">
        <ChaosVisualization />
      </div>
    </div>
  );
};

const ChaosVisualization: React.FC = () => {
  const issues = [
    { title: 'Spaghetti Code', color: '#ea2323' },
    { title: 'Missed Deadlines', color: '#ff6b35' },
    { title: 'Talent Costs', color: '#ea2323' },
    { title: 'QA Skipped', color: '#ff6b35' },
    { title: 'DevOps Bottleneck', color: '#ea2323' },
    { title: 'No Scaling', color: '#ff6b35' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {issues.map((issue, idx) => (
        <div
          key={idx}
          className="group relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-950/20 p-6 backdrop-blur-sm transition hover:border-red-500/60"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 transition group-hover:opacity-100" />
          <div className="relative flex items-center gap-3">
            <div className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: issue.color }} />
            <p className="font-semibold text-white">{issue.title}</p>
          </div>
          <div className="mt-4 h-1 w-full rounded-full bg-red-500/20">
            <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// SOLUTION SECTION - ATLAS
// ============================================
const SolutionSection: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="atlas" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          ATLAS — DevOps Engineer
        </span>
      </div>

      <h2 className="mb-8 text-center text-4xl md:text-6xl font-bold">
        7 Agents That Build, Test, Deploy, and Improve—Together.
      </h2>

      {/* DevOps pipeline visualization */}
      <div className="mx-auto mt-16 max-w-5xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Backend Code Generation & Refactoring', icon: '⚙️', delay: 0 },
            { title: 'Frontend Component Building', icon: '🎨', delay: 100 },
            { title: 'Automated Testing & QA Loops', icon: '✓', delay: 200 },
            { title: 'Continuous Deployments', icon: '🚀', delay: 300 },
            { title: 'GitHub PRs, Reviews & Merges', icon: '🔀', delay: 400 },
            { title: 'LLM Orchestration & Memory', icon: '🧠', delay: 500 },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 backdrop-blur-sm transition hover:border-[#ea2323]/50 hover:bg-white/10"
              style={{ animationDelay: `${item.delay}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323]/10 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 text-5xl">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <div className="mt-4 h-1 w-full rounded-full bg-white/10">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#ea2323] to-[#ff6b35] transition-all duration-1000 group-hover:w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline flow animation */}
        <div className="mt-16 flex items-center justify-center gap-4 flex-wrap">
          <PipelineStep label="Plan" />
          <Arrow />
          <PipelineStep label="Build" />
          <Arrow />
          <PipelineStep label="Test" />
          <Arrow />
          <PipelineStep label="Deploy" />
          <Arrow />
          <PipelineStep label="Monitor" />
        </div>
      </div>
    </div>
  );
};

const PipelineStep: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#ea2323]/40 bg-gradient-to-br from-[#ea2323]/20 to-[#ff6b35]/10 backdrop-blur-sm font-semibold text-white transition hover:scale-110 hover:border-[#ea2323]">
    {label}
  </div>
);

const Arrow: React.FC = () => (
  <svg className="h-8 w-8 text-[#ea2323]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

// ============================================
// HOW IT WORKS SECTION - LYRA
// ============================================
const HowItWorksSection: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="lyra" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          LYRA — Data Engineer
        </span>
      </div>

      <h2 className="mb-16 text-center text-4xl md:text-6xl font-bold">
        How Crew-7 Works
      </h2>

      {/* Interactive timeline with sequential animations */}
      <div className="relative mx-auto max-w-4xl">
        {/* Vertical connector line */}
        <div className="step-connector absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-[#ea2323] to-[#ea2323]/20">
          <div className="progress-indicator absolute top-0 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#ea2323] shadow-[0_0_20px_rgba(234,35,35,0.8)]" />
        </div>
        
        <div className="space-y-16">
          {[
            {
              step: '01',
              title: 'Choose or Create a Crew',
              desc: 'Pick a prebuilt team or assemble your own 7-agent squad.',
              icon: '👥',
            },
            {
              step: '02',
              title: 'Describe Your Mission',
              desc: 'Crew-7 parses it, assigns tasks, plans execution.',
              icon: '🎯',
            },
            {
              step: '03',
              title: 'Watch Collaboration Live',
              desc: 'Agents talk, plan, build, test, and deploy in real time.',
              icon: '⚡',
            },
            {
              step: '04',
              title: 'Refine & Scale',
              desc: 'Iterate, branch, tweak agents, create variants, share them.',
              icon: '📈',
            },
          ].map((item, idx) => (
            <div key={idx} className="step-item group relative flex items-start gap-8 animate-on-scroll" style={{ animationDelay: `${idx * 0.2}s` }}>
              {/* Step number indicator */}
              <div className="step-number relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#ea2323] bg-[#0a0e1a] text-2xl font-bold text-[#ea2323] transition group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(234,35,35,0.6)]">
                {item.step}
              </div>

              {/* Content with icon animation */}
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition group-hover:border-[#ea2323]/50 group-hover:bg-white/10">
                <div className="step-icon mb-4 text-5xl inline-block">{item.icon}</div>
                <h3 className="mb-3 text-2xl font-bold text-white">{item.title}</h3>
                <p className="text-lg text-[#b8c2d8]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADVANCED MODE SECTION - HELIX
// ============================================
const AdvancedModeSection: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="helix" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          HELIX — Security Analyst
        </span>
      </div>

      <h2 className="mb-8 text-center text-4xl md:text-6xl font-bold">
        The Most Advanced AI Dev Environment Ever Built.
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-xl text-[#b8c2d8]">
        Visualize your AI team in real time. Rewire connections. Edit prompts and tools. Pause, resume, or redirect the workflow on the fly. <span className="font-semibold text-[#ea2323]">It's DevOps + God Mode.</span>
      </p>

      {/* Node graph visualization */}
      <div className="mx-auto max-w-5xl">
        <NodeGraphDemo />
      </div>
    </div>
  );
};

const NodeGraphDemo: React.FC = () => {
  return (
    <div className="circuit-board-container relative h-[600px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0e1a] to-[#1a1f2e] p-8 backdrop-blur-xl">
      {/* Circuit board grid background */}
      <div className="circuit-board-bg absolute inset-0 opacity-30" />

      {/* Nodes */}
      <div className="relative h-full">
        {/* Central orchestrator node */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <NodeCard label="Orchestrator" agent="orion" isActive pulse />
        </div>

        {/* Agent nodes */}
        <div className="absolute top-20 left-1/4"><NodeCard label="Backend" agent="vega" /></div>
        <div className="absolute top-20 right-1/4"><NodeCard label="Frontend" agent="nova" /></div>
        <div className="absolute top-1/2 left-12"><NodeCard label="DevOps" agent="atlas" /></div>
        <div className="absolute top-1/2 right-12"><NodeCard label="Data" agent="lyra" /></div>
        <div className="absolute bottom-20 left-1/4"><NodeCard label="Security" agent="helix" /></div>
        <div className="absolute bottom-20 right-1/4"><NodeCard label="QA" agent="quark" /></div>

        {/* Connection lines with data flow animation */}
        <svg className="absolute inset-0 -z-10">
          <line className="data-flow-line" x1="50%" y1="50%" x2="25%" y2="20%" stroke="rgba(234, 35, 35, 0.5)" strokeWidth="2" strokeDasharray="5,5" />
          <line className="data-flow-line" x1="50%" y1="50%" x2="75%" y2="20%" stroke="rgba(234, 35, 35, 0.5)" strokeWidth="2" strokeDasharray="5,5" style={{ animationDelay: '0.5s' }} />
          <line className="data-flow-line" x1="50%" y1="50%" x2="10%" y2="50%" stroke="rgba(234, 35, 35, 0.5)" strokeWidth="2" strokeDasharray="5,5" style={{ animationDelay: '1s' }} />
          <line className="data-flow-line" x1="50%" y1="50%" x2="90%" y2="50%" stroke="rgba(234, 35, 35, 0.5)" strokeWidth="2" strokeDasharray="5,5" style={{ animationDelay: '1.5s' }} />
          <line className="data-flow-line" x1="50%" y1="50%" x2="25%" y2="80%" stroke="rgba(234, 35, 35, 0.5)" strokeWidth="2" strokeDasharray="5,5" style={{ animationDelay: '2s' }} />
          <line className="data-flow-line" x1="50%" y1="50%" x2="75%" y2="80%" stroke="rgba(234, 35, 35, 0.5)" strokeWidth="2" strokeDasharray="5,5" style={{ animationDelay: '2.5s' }} />
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-[#ea2323] animate-pulse" />
          <span className="text-[#cbd4e6]">Active Node</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-white/40" />
          <span className="text-[#cbd4e6]">Idle Node</span>
        </div>
      </div>
    </div>
  );
};

const NodeCard: React.FC<{ label: string; agent: string; isActive?: boolean; pulse?: boolean }> = ({ label, agent, isActive, pulse }) => (
  <div className={`connection-node group relative rounded-xl border-2 bg-[#0a0e1a] p-4 backdrop-blur-sm transition hover:scale-110 hover:shadow-[0_0_30px_rgba(234,35,35,0.4)] ${isActive ? 'border-[#ea2323]' : 'border-white/20'} ${pulse ? 'animate-pulse' : ''}`}>
    <AgentIcon id={agent as any} size={40} />
    <p className="mt-2 text-xs font-semibold uppercase text-[#cbd4e6]">{label}</p>
    {isActive && <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#ea2323] animate-ping" />}
  </div>
);

// ============================================
// ENHANCED MARKETPLACE SECTION - QUARK
// ============================================
const MarketplaceSection: React.FC = () => {
  const crewCapsules = [
    {
      name: 'Engineering Squad Pro',
      xp: 48200,
      missions: 142,
      rating: 4.9,
      price: '0.5 ETH/week',
      buyPrice: '12 ETH',
      skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      reputation: 'Elite',
      nftId: '#0421',
    },
    {
      name: 'Marketing Growth Team',
      xp: 35700,
      missions: 98,
      rating: 4.8,
      price: '0.3 ETH/week',
      buyPrice: '8 ETH',
      skills: ['SEO', 'Ads', 'Copywriting', 'Analytics'],
      reputation: 'Expert',
      nftId: '#0733',
    },
    {
      name: 'Finance Analysts Elite',
      xp: 52100,
      missions: 176,
      rating: 5.0,
      price: '0.7 ETH/week',
      buyPrice: '15 ETH',
      skills: ['DCF', 'Risk Models', 'Portfolio Mgmt', 'Trading'],
      reputation: 'Legendary',
      nftId: '#0156',
    },
    {
      name: 'Business Strategy Core',
      xp: 29400,
      missions: 87,
      rating: 4.7,
      price: '0.4 ETH/week',
      buyPrice: '9 ETH',
      skills: ['Strategy', 'Planning', 'Analysis', 'Operations'],
      reputation: 'Advanced',
      nftId: '#0892',
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="quark" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          QUARK — Marketplace Curator
        </span>
      </div>

      <h2 className="mb-8 text-center text-4xl md:text-6xl font-bold">
        Rent, Own, and Trade <span className="bg-gradient-to-r from-[#ea2323] to-[#ff6b35] bg-clip-text text-transparent">AI Crews as NFTs</span>
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-xl text-[#b8c2d8]">
        Every crew has on-chain reputation, skills, and history. Rent by the hour or week. Own them forever. Stake them for passive income. All secured by Web3.
      </p>

      {/* Web3 features bar */}
      <div className="mx-auto mb-12 flex max-w-5xl flex-wrap justify-center gap-4">
        {[
          { icon: '🔒', label: 'NFT Ownership' },
          { icon: '⭐', label: 'On-Chain XP' },
          { icon: '�', label: 'Smart Contracts' },
          { icon: '📊', label: 'Transparent Earnings' },
          { icon: '💰', label: 'Crypto Payments' },
          { icon: '🎯', label: 'Reputation Score' },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 backdrop-blur-sm hover:border-[#ea2323]/50 hover:bg-[#ea2323]/10 transition"
          >
            <span className="text-2xl">{feature.icon}</span>
            <span className="text-sm font-semibold text-white">{feature.label}</span>
          </div>
        ))}
      </div>

      {/* Crew capsule grid with NFT card effects */}
      <div className="nft-carousel mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {crewCapsules.map((crew, idx) => (
          <div
            key={idx}
            className="nft-card-container group relative"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <div className="nft-card relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl transition hover:border-[#ea2323]/50 hover:scale-105 hover:shadow-[0_30px_80px_rgba(234,35,35,0.4)]">
            {/* Rotating glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323]/20 via-transparent to-[#ff6b35]/20 opacity-0 blur-xl transition duration-700 group-hover:opacity-100 group-hover:animate-spin-slow" />
            
            {/* NFT badge */}
            <div className="absolute right-4 top-4 z-10 rounded-full border border-[#ea2323]/50 bg-black/50 px-3 py-1 text-xs font-mono text-[#ea2323] backdrop-blur-sm">
              {crew.nftId}
            </div>

            <div className="relative p-6">
              {/* Crew avatar placeholder with 3D rotation effect */}
              <div className="mb-4 flex h-32 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#ea2323]/10 to-[#ff6b35]/10 text-6xl transition-transform duration-700 group-hover:rotate-y-180">
                🤖
              </div>

              {/* Crew name */}
              <h3 className="mb-2 text-xl font-bold text-white">{crew.name}</h3>

              {/* Reputation badge */}
              <div className="mb-3 inline-block rounded-full bg-gradient-to-r from-[#ea2323] to-[#ff6b35] px-3 py-1 text-xs font-bold text-white">
                {crew.reputation}
              </div>

              {/* Stats grid */}
              <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-xs text-[#9ba7c2]">XP</div>
                  <div className="font-bold text-[#ea2323]">{crew.xp.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-xs text-[#9ba7c2]">Missions</div>
                  <div className="font-bold text-white">{crew.missions}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-xs text-[#9ba7c2]">Rating</div>
                  <div className="font-bold text-white">⭐ {crew.rating}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-xs text-[#9ba7c2]">Rental</div>
                  <div className="font-bold text-[#ff6b35]">{crew.price}</div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4 flex flex-wrap gap-1">
                {crew.skills.map((skill, sidx) => (
                  <span
                    key={sidx}
                    className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs text-[#cbd4e6]"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button className="flex-1 rounded-xl border border-[#ea2323] bg-[#ea2323]/20 py-2 text-sm font-semibold text-[#ea2323] backdrop-blur-sm transition hover:bg-[#ea2323] hover:text-white">
                  Rent
                </button>
                <button className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-[#ea2323] hover:bg-[#ea2323]/20">
                  Buy {crew.buyPrice}
                </button>
              </div>
            </div>
            </div>
          </div>
        ))}
      </div>

      {/* Smart contract info with pulse animation */}
      <div className="mx-auto mt-16 max-w-4xl rounded-3xl border border-[#ea2323]/30 bg-gradient-to-br from-[#ea2323]/10 to-transparent p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="contract-lock-icon text-6xl">🔐</div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="mb-2 text-2xl font-bold text-white">Powered by Smart Contracts</h4>
            <p className="text-[#b8c2d8]">
              All rentals and purchases are secured by Ethereum smart contracts. Your crew, your rules. Automatic payments, immutable history, and transparent earnings.
            </p>
          </div>
          <button className="btn-primary rounded-xl border-2 border-[#ea2323] bg-transparent px-8 py-3 font-bold text-[#ea2323] transition hover:bg-[#ea2323] hover:text-white">
            View Contracts
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CREW PORTFOLIO SYSTEM - NOVA
// ============================================
const CrewPortfolioSection: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  
  const tabs = [
    { label: 'Performance', icon: '📈' },
    { label: 'Mission Log', icon: '📋' },
    { label: 'Artifacts', icon: '💼' },
    { label: 'Skills', icon: '⚡' },
    { label: 'Evolution', icon: '🌟' },
  ];

  const portfolioData = {
    missions: 142,
    successRate: 94.7,
    hoursWorked: 2847,
    skillsUnlocked: 28,
    industries: 7,
    artifacts: 386,
    clientRating: 4.9,
    evolutionLevel: 12,
  };

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="nova" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          NOVA — Performance Analyst
        </span>
      </div>

      <h2 className="mb-6 text-center text-4xl md:text-6xl font-bold">
        Every Crew Has a <span className="bg-gradient-to-r from-[#ea2323] to-[#ff6b35] bg-clip-text text-transparent">Living Portfolio</span>
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-lg text-[#b8c2d8]">
        Track performance metrics, mission history, generated artifacts, and skill evolution—all on-chain and verifiable.
      </p>

      {/* Portfolio stats grid with counter animations */}
      <div className="mx-auto mb-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Missions Completed', value: portfolioData.missions, icon: '🎯', color: '#ea2323' },
          { label: 'Success Rate', value: `${portfolioData.successRate}%`, icon: '✅', color: '#ff6b35' },
          { label: 'Hours Worked', value: portfolioData.hoursWorked.toLocaleString(), icon: '⏱️', color: '#ea2323' },
          { label: 'Skills Unlocked', value: portfolioData.skillsUnlocked, icon: '⚡', color: '#ff6b35' },
          { label: 'Industries Served', value: portfolioData.industries, icon: '🏢', color: '#ea2323' },
          { label: 'Artifacts Produced', value: portfolioData.artifacts, icon: '💼', color: '#ff6b35' },
          { label: 'Client Rating', value: `${portfolioData.clientRating}/5.0`, icon: '⭐', color: '#ea2323' },
          { label: 'Evolution Level', value: portfolioData.evolutionLevel, icon: '🌟', color: '#ff6b35' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 backdrop-blur-sm transition hover:border-[#ea2323]/50 hover:scale-105 animate-on-scroll"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323]/10 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-2 text-4xl">{stat.icon}</div>
              <div className="stat-number mb-1 text-3xl font-bold gradient-text" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-sm text-[#9ba7c2]">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive portfolio tabs */}
      <div className="mx-auto max-w-6xl">
        {/* Tab buttons with active state animations */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`portfolio-tab flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
                activeTab === idx
                  ? 'active border-2 border-[#ea2323] bg-[#ea2323]/20 text-white shadow-[0_0_30px_rgba(234,35,35,0.4)]'
                  : 'border border-white/20 bg-white/5 text-[#9ba7c2] hover:border-white/40 hover:text-white'
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-[#0a0e1a] to-[#1a1f2e] p-8 backdrop-blur-xl">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ea2323]/10 via-transparent to-[#ff6b35]/10 opacity-50 animate-pulse-slow" />
          
          <div className="relative">
            {activeTab === 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">Performance Analytics</h3>
                {/* Animated chart bars */}
                <div className="space-y-4">
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="w-20 text-sm text-[#9ba7c2]">{week}</span>
                      <div className="chart-bar flex-1 h-8 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="chart-bar-fill h-full bg-gradient-to-r from-[#ea2323] to-[#ff6b35] transition-all duration-1000"
                          style={{ width: `${60 + idx * 10}%`, animationDelay: `${idx * 0.2}s` }}
                        />
                      </div>
                      <span className="w-16 text-right text-sm font-bold text-white">
                        {60 + idx * 10}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Recent Missions</h3>
                {[
                  { name: 'Build React Dashboard', status: '✅ Completed', time: '2 days ago' },
                  { name: 'API Integration Suite', status: '✅ Completed', time: '5 days ago' },
                  { name: 'Database Migration', status: '✅ Completed', time: '1 week ago' },
                  { name: 'Security Audit', status: '⏳ In Progress', time: 'Started today' },
                ].map((mission, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <div className="font-semibold text-white">{mission.name}</div>
                      <div className="text-sm text-[#9ba7c2]">{mission.time}</div>
                    </div>
                    <div className="text-sm font-semibold">{mission.status}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Generated Artifacts</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { type: 'Code Files', count: 1247, icon: '📄' },
                    { type: 'Documentation', count: 84, icon: '📖' },
                    { type: 'Test Suites', count: 156, icon: '🧪' },
                    { type: 'Deployments', count: 42, icon: '🚀' },
                  ].map((artifact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <span className="text-4xl">{artifact.icon}</span>
                      <div>
                        <div className="text-2xl font-bold text-[#ea2323]">{artifact.count}</div>
                        <div className="text-sm text-[#9ba7c2]">{artifact.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Unlocked Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS',
                    'GraphQL', 'Redis', 'Kubernetes', 'CI/CD', 'Jest', 'Cypress',
                  ].map((skill, idx) => (
                    <div
                      key={idx}
                      className="rounded-full border-2 border-[#ea2323]/50 bg-[#ea2323]/10 px-4 py-2 font-semibold text-white"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 4 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Evolution Tree</h3>
                <div className="space-y-4">
                  {[
                    { level: 'Level 12 - Elite', unlocked: true },
                    { level: 'Level 15 - Master', unlocked: false },
                    { level: 'Level 20 - Legendary', unlocked: false },
                  ].map((stage, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 rounded-xl border p-4 ${
                        stage.unlocked
                          ? 'border-[#ea2323] bg-[#ea2323]/20'
                          : 'border-white/10 bg-white/5 opacity-50'
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        stage.unlocked ? 'bg-[#ea2323]' : 'bg-white/10'
                      }`}>
                        {stage.unlocked ? '✓' : '🔒'}
                      </div>
                      <div className="text-lg font-semibold text-white">{stage.level}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// ============================================
// WEB3 INTEGRATION SECTION - HELIX
// ============================================
const Web3IntegrationSection: React.FC = () => {
  const features = [
    {
      title: 'NFT Ownership',
      desc: 'Each crew is minted as a unique ERC-721 NFT with immutable on-chain metadata.',
      icon: '🖼️',
      color: '#ea2323',
    },
    {
      title: 'On-Chain Reputation',
      desc: 'Every mission completion, rating, and skill unlock is recorded permanently on the blockchain.',
      icon: '⭐',
      color: '#ff6b35',
    },
    {
      title: 'Smart Contract Rentals',
      desc: 'Automated rental agreements with escrow, time-locks, and instant payouts.',
      icon: '📜',
      color: '#ea2323',
    },
    {
      title: 'Transparent Earnings',
      desc: 'View real-time earnings, rental history, and revenue splits—all verifiable on-chain.',
      icon: '💰',
      color: '#ff6b35',
    },
    {
      title: 'Crypto Payments',
      desc: 'Accept ETH, USDC, or any ERC-20 token. Instant settlements, no intermediaries.',
      icon: '💳',
      color: '#ea2323',
    },
    {
      title: 'Decentralized Identity',
      desc: 'Crews build portable reputation that travels across platforms and protocols.',
      icon: '🆔',
      color: '#ff6b35',
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="helix" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          HELIX — Blockchain Architect
        </span>
      </div>

      <h2 className="mb-6 text-center text-4xl md:text-6xl font-bold">
        Built on <span className="bg-gradient-to-r from-[#ea2323] to-[#ff6b35] bg-clip-text text-transparent">Web3 Infrastructure</span>
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-lg text-[#b8c2d8]">
        Crew-7 leverages Ethereum smart contracts for trustless ownership, transparent earnings, and portable reputation. Your crew, your assets, your control.
      </p>

      {/* Blockchain visualization */}
      <div className="relative mx-auto mb-16 h-[400px] max-w-5xl">
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0e1a] to-[#1a1f2e] p-8">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              radial-gradient(circle at center, rgba(234, 35, 35, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }} />

          {/* Animated blockchain nodes */}
          <div className="relative flex h-full items-center justify-center">
            {/* Center crew avatar */}
            <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#ea2323] bg-gradient-to-br from-[#0a0e1a] to-[#1a1f2e] text-6xl shadow-[0_0_60px_rgba(234,35,35,0.6)] animate-pulse">
              🤖
            </div>

            {/* Orbiting blockchain nodes */}
            {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
              const radius = 150;
              const x = radius * Math.cos((angle * Math.PI) / 180);
              const y = radius * Math.sin((angle * Math.PI) / 180);
              
              return (
                <div
                  key={idx}
                  className="absolute flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#ea2323]/50 bg-[#0a0e1a] text-3xl backdrop-blur-sm animate-pulse"
                  style={{
                    left: `calc(50% + ${x}px - 40px)`,
                    top: `calc(50% + ${y}px - 40px)`,
                    animationDelay: `${idx * 0.2}s`,
                  }}
                >
                  {['⛓️', '🔒', '💎', '📊', '🌐', '⚡'][idx]}
                </div>
              );
            })}

            {/* Connection lines */}
            <svg className="absolute inset-0 h-full w-full">
              {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
                const radius = 150;
                const x = radius * Math.cos((angle * Math.PI) / 180);
                const y = radius * Math.sin((angle * Math.PI) / 180);
                
                return (
                  <line
                    key={idx}
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${x}px)`}
                    y2={`calc(50% + ${y}px)`}
                    stroke="rgba(234, 35, 35, 0.3)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 backdrop-blur-xl transition hover:border-[#ea2323]/50 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323]/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-4 text-6xl">{feature.icon}</div>
              <h3 className="mb-3 text-2xl font-bold text-white">{feature.title}</h3>
              <p className="text-[#b8c2d8]">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// TOKENOMICS SECTION - SIGMA
// ============================================
const TokenomicsSection: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="sigma" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          SIGMA — Economic Architect
        </span>
      </div>

      <h2 className="mb-6 text-center text-4xl md:text-6xl font-bold">
        Powered by a <span className="bg-gradient-to-r from-[#ea2323] to-[#ff6b35] bg-clip-text text-transparent">Dual-Token Economy</span>
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-lg text-[#b8c2d8]">
        Crew-7 Token (C7T) for utility and payments. Reputation-7 (R7) for governance and staking. A sustainable economy that rewards builders, renters, and stakeholders.
      </p>

      {/* Token flow diagram with interactive elements */}
      <div className="token-diagram relative mx-auto mb-16 max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* C7T Token with holographic effect */}
          <div className="token-box relative overflow-hidden rounded-3xl border-2 border-[#ea2323] bg-gradient-to-br from-[#ea2323]/10 to-transparent p-8 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="token-icon flex h-16 w-16 items-center justify-center rounded-full bg-[#ea2323] text-3xl font-bold text-white shadow-[0_0_30px_rgba(234,35,35,0.6)]">
                C7T
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Crew-7 Token</h3>
                <p className="text-sm text-[#9ba7c2]">Utility & Payments</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: '💳', label: 'Pay for crew rentals' },
                { icon: '🛒', label: 'Purchase crews on marketplace' },
                { icon: '⚡', label: 'Unlock premium features' },
                { icon: '🎁', label: 'Reward contributors' },
              ].map((item, idx) => (
                <div key={idx} className="abstract-icon flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-semibold text-white">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* R7 Token with holographic effect */}
          <div className="token-box relative overflow-hidden rounded-3xl border-2 border-[#ff6b35] bg-gradient-to-br from-[#ff6b35]/10 to-transparent p-8 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="token-icon flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6b35] text-3xl font-bold text-white shadow-[0_0_30px_rgba(255,107,53,0.6)]">
                R7
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Reputation-7</h3>
                <p className="text-sm text-[#9ba7c2]">Governance & Staking</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: '🗳️', label: 'Vote on platform upgrades' },
                { icon: '💎', label: 'Stake for passive income' },
                { icon: '🏆', label: 'Earned through missions' },
                { icon: '👑', label: 'Unlock exclusive crews' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-semibold text-white">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Economic features */}
      <div className="grid gap-8 sm:grid-cols-3">
        {[
          {
            title: 'Staking Pools',
            desc: 'Lock C7T or R7 tokens to earn yield from platform fees.',
            icon: '🏦',
            apy: '12-18% APY',
          },
          {
            title: 'Crew Earnings Split',
            desc: 'Crew owners earn 70% of rental fees. Platform takes 20%. Stakers get 10%.',
            icon: '📊',
            apy: '70/20/10',
          },
          {
            title: 'XP & Level System',
            desc: 'Crews gain XP with each mission. Higher levels unlock rare skills and higher rates.',
            icon: '⚡',
            apy: 'Up to Lv.100',
          },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 text-center backdrop-blur-xl transition hover:border-[#ea2323]/50 hover:scale-105"
          >
            <div className="mb-4 text-6xl">{feature.icon}</div>
            <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
            <p className="mb-4 text-sm text-[#b8c2d8]">{feature.desc}</p>
            <div className="inline-block rounded-full border border-[#ea2323] bg-[#ea2323]/20 px-4 py-2 text-sm font-bold text-[#ea2323]">
              {feature.apy}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MISSION EXAMPLES CAROUSEL - ATLAS
// ============================================
const MissionExamplesSection: React.FC = () => {
  const missions = [
    {
      title: 'Build a SaaS MVP in 48 Hours',
      industry: 'Startup',
      crew: 'Engineering Squad Pro',
      deliverables: ['React dashboard', 'Node.js API', 'PostgreSQL DB', 'Auth system', 'Deployment'],
      time: '2 days',
      cost: '0.8 ETH',
      icon: '🚀',
      color: '#ea2323',
    },
    {
      title: 'Create Comprehensive Business Plan',
      industry: 'Business',
      crew: 'Business Strategy Core',
      deliverables: ['Market analysis', 'Financial projections', 'Go-to-market strategy', 'Pitch deck', 'Executive summary'],
      time: '3 days',
      cost: '0.6 ETH',
      icon: '💼',
      color: '#ff6b35',
    },
    {
      title: 'Launch Full Marketing Funnel',
      industry: 'Marketing',
      crew: 'Marketing Growth Team',
      deliverables: ['Landing pages', 'Email sequences', 'Ad campaigns', 'SEO optimization', 'Analytics setup'],
      time: '5 days',
      cost: '1.2 ETH',
      icon: '📢',
      color: '#ea2323',
    },
    {
      title: 'Perform Company Valuation',
      industry: 'Finance',
      crew: 'Finance Analysts Elite',
      deliverables: ['DCF model', 'Comparable analysis', 'Risk assessment', 'Scenario planning', 'Investment memo'],
      time: '4 days',
      cost: '1.5 ETH',
      icon: '💰',
      color: '#ff6b35',
    },
    {
      title: 'Plan & Execute Product Launch Event',
      industry: 'Events',
      crew: 'Event Planning Squad',
      deliverables: ['Event timeline', 'Vendor coordination', 'Budget management', 'Marketing materials', 'Post-event report'],
      time: '2 weeks',
      cost: '2.0 ETH',
      icon: '🎉',
      color: '#ea2323',
    },
    {
      title: 'Automate Operations Workflow',
      industry: 'Operations',
      crew: 'Automation Specialists',
      deliverables: ['Process mapping', 'Tool integration', 'Workflow automation', 'Documentation', 'Training materials'],
      time: '1 week',
      cost: '0.9 ETH',
      icon: '⚙️',
      color: '#ff6b35',
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 flex items-center justify-center gap-3">
        <AgentIcon id="atlas" size={48} className="animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          ATLAS — Mission Commander
        </span>
      </div>

      <h2 className="mb-6 text-center text-4xl md:text-6xl font-bold">
        Real Missions. <span className="bg-gradient-to-r from-[#ea2323] to-[#ff6b35] bg-clip-text text-transparent">Real Results.</span>
      </h2>

      <p className="mx-auto mb-16 max-w-3xl text-center text-lg text-[#b8c2d8]">
        Here's what you can accomplish with Crew-7. From 48-hour sprints to multi-week campaigns—autonomous AI teams executing at scale.
      </p>

      {/* Mission cards carousel with glassmorphism */}
      <div className="relative">
        <div className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
          {missions.map((mission, idx) => (
            <div
              key={idx}
              className="mission-card group min-w-[400px] snap-center animate-on-scroll"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="relative h-full overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl transition hover:border-[#ea2323]/50 hover:scale-105 hover:shadow-[0_30px_80px_rgba(234,35,35,0.4)]">
                {/* Gradient overlay */}
                <div 
                  className="absolute inset-0 opacity-0 blur-xl transition duration-500 group-hover:opacity-20" 
                  style={{ background: `linear-gradient(135deg, ${mission.color}, transparent)` }}
                />
                
                {/* Holographic top edge */}
                <div 
                  className="absolute top-0 left-0 h-1 w-full opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent, ${mission.color}, transparent)` }}
                />

                <div className="relative p-8">
                  {/* Industry badge */}
                  <div className="absolute right-8 top-8 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {mission.industry}
                  </div>

                  {/* Icon */}
                  <div className="mb-6 text-7xl">{mission.icon}</div>

                  {/* Title */}
                  <h3 className="mb-4 text-2xl font-bold text-white">{mission.title}</h3>

                  {/* Crew */}
                  <div className="mb-6 flex items-center gap-2 text-sm text-[#9ba7c2]">
                    <span>🤖</span>
                    <span className="font-semibold text-white">{mission.crew}</span>
                  </div>

                  {/* Deliverables with animated checkmarks */}
                  <div className="mb-6">
                    <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9ba7c2]">
                      Deliverables
                    </div>
                    <div className="space-y-2">
                      {mission.deliverables.map((item, didx) => (
                        <div key={didx} className="deliverable-item flex items-start gap-2 text-sm text-[#cbd4e6]" style={{ animationDelay: `${didx * 0.1}s` }}>
                          <svg className="deliverable-checkmark h-5 w-5 text-[#ea2323] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 4-4" />
                          </svg>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats with progress bars */}
                  <div className="mb-6 flex gap-4">
                    <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-[#9ba7c2] mb-1">Time</div>
                      <div className="font-bold text-white mb-2">{mission.time}</div>
                      <div className="progress-bar-animated h-1 rounded-full bg-white/10">
                        <div className="progress-fill-animated h-full rounded-full bg-gradient-to-r from-[#ea2323] to-[#ff6b35]" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-[#9ba7c2] mb-1">Cost</div>
                      <div className="font-bold mb-2" style={{ color: mission.color }}>{mission.cost}</div>
                      <div className="progress-bar-animated h-1 rounded-full bg-white/10">
                        <div className="progress-fill-animated h-full rounded-full" style={{ width: '90%', background: mission.color }} />
                      </div>
                    </div>
                  </div>

                  {/* CTA button */}
                  <button 
                    className="w-full rounded-xl py-3 font-semibold text-white transition"
                    style={{ 
                      border: `2px solid ${mission.color}`,
                      background: `${mission.color}20`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = mission.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${mission.color}20`;
                    }}
                  >
                    Launch This Mission
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#9ba7c2]">
          <span>Scroll to explore missions</span>
          <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// ============================================
// EPIC FINALE CTA - ALL CREW
// ============================================
const CTASection: React.FC = () => {
  const allRobots = [
    { id: 'orion', angle: 0 },
    { id: 'vega', angle: 45 },
    { id: 'nova', angle: 90 },
    { id: 'atlas', angle: 135 },
    { id: 'lyra', angle: 180 },
    { id: 'helix', angle: 225 },
    { id: 'quark', angle: 270 },
    { id: 'sigma', angle: 315 },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-32">
      {/* All robots assembled message */}
      <div className="mb-12 text-center">
        <div className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#ea2323]">
          All Systems Ready
        </div>
        <p className="text-xl text-[#b8c2d8]">
          The entire Crew-7 team stands ready to serve. <span className="text-white font-semibold">Eight specialized agents. Infinite possibilities.</span>
        </p>
      </div>

      {/* Circular robot formation */}
      <div className="relative mx-auto mb-16 h-[500px] w-full max-w-3xl">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Central star-birth logo animation */}
          <div className="relative z-20 animate-pulse-glow">
            <Crew7Logo variant="sign" size="lg" className="drop-shadow-[0_0_50px_rgba(234,35,35,0.8)]" />
          </div>

          {/* Orbiting robots in circle formation */}
          {allRobots.map((robot, idx) => {
            const radius = 200;
            const x = radius * Math.cos((robot.angle * Math.PI) / 180);
            const y = radius * Math.sin((robot.angle * Math.PI) / 180);
            
            return (
              <div
                key={robot.id}
                className="absolute flex flex-col items-center gap-2 animate-float"
                style={{
                  left: `calc(50% + ${x}px - 40px)`,
                  top: `calc(50% + ${y}px - 40px)`,
                  animationDelay: `${idx * 0.2}s`,
                }}
              >
                <div className="relative">
                  <AgentIcon 
                    id={robot.id as any} 
                    size={64} 
                    className="drop-shadow-[0_0_20px_rgba(234,35,35,0.5)]" 
                  />
                  {/* Energy pulse ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-[#ea2323] opacity-0 animate-ping" />
                </div>
              </div>
            );
          })}

          {/* Connection lines to center */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <defs>
              <radialGradient id="lineGradient">
                <stop offset="0%" stopColor="rgba(234, 35, 35, 0.6)" />
                <stop offset="100%" stopColor="rgba(234, 35, 35, 0)" />
              </radialGradient>
            </defs>
            {allRobots.map((robot, idx) => {
              const radius = 200;
              const x = radius * Math.cos((robot.angle * Math.PI) / 180);
              const y = radius * Math.sin((robot.angle * Math.PI) / 180);
              
              return (
                <line
                  key={idx}
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${x}px)`}
                  y2={`calc(50% + ${y}px)`}
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="animate-dash"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Epic title */}
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="mb-6 text-5xl md:text-8xl font-bold bg-gradient-to-r from-white via-[#f0f3f9] to-[#cbd4e6] bg-clip-text text-transparent leading-tight">
          The AI Workforce <br />
          <span className="bg-gradient-to-r from-[#ea2323] to-[#ff6b35] bg-clip-text">Revolution Starts Now</span>
        </h2>

        <p className="mb-12 text-xl md:text-2xl text-[#b8c2d8]">
          Build your empire with autonomous AI teams. Own them as NFTs. Rent them. Trade them. Stake them. 
          <span className="block mt-2 text-2xl md:text-3xl font-bold text-white">The future belongs to those who orchestrate it.</span>
        </p>

        {/* Dual CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <button className="group relative overflow-hidden rounded-2xl bg-[#ea2323] px-16 py-6 text-2xl font-bold text-white shadow-[0_0_60px_rgba(234,35,35,0.6)] transition hover:shadow-[0_0_100px_rgba(234,35,35,0.9)] hover:scale-110">
            <span className="relative z-10">Deploy Your First Crew</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff4040] via-[#ff6b35] to-[#ea2323] opacity-0 transition group-hover:opacity-100 animate-shimmer" />
          </button>
          <button className="rounded-2xl border-2 border-white/30 bg-white/10 px-16 py-6 text-2xl font-bold text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-[#ea2323] hover:shadow-[0_0_40px_rgba(234,35,35,0.3)]">
            Explore Marketplace
          </button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-[#9ba7c2]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ea2323]/20 text-2xl">✓</div>
            <div className="text-left">
              <div className="font-semibold text-white">No Credit Card Required</div>
              <div className="text-sm">Start for free, scale when ready</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ea2323]/20 text-2xl">⚡</div>
            <div className="text-left">
              <div className="font-semibold text-white">Deploy in Minutes</div>
              <div className="text-sm">From zero to autonomous in 5 min</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ea2323]/20 text-2xl">🔒</div>
            <div className="text-left">
              <div className="font-semibold text-white">Web3 Secured</div>
              <div className="text-sm">Your crew, your keys, your control</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 30px rgba(234, 35, 35, 0.6)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 50px rgba(234, 35, 35, 0.9)); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
