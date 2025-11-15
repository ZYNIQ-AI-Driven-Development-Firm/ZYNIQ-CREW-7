import React, { useEffect, useRef, useState } from 'react';
import { Crew7Logo } from '../components/Crew7Logo';
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
 * ZYNIQ CREW-7 — PROFESSIONAL LANDING PAGE
 * Production-ready design with enterprise-grade animations,
 * accessibility, SEO optimization, and conversion-focused UX
 */

export const LandingPageV3: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#050505] text-white overflow-x-hidden">
      {/* Enhanced Background System */}
      <EnhancedBackground scrollProgress={scrollProgress} />
      
      {/* Professional Navigation */}
      <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Hero Section */}
      <HeroSection scrollProgress={scrollProgress} />

      {/* Trust Indicators */}
      <TrustSection />

      {/* Value Proposition */}
      <ValueProposition />

      {/* Meet the Crew (Enhanced) */}
      <CrewShowcase />

      {/* Use Cases / Industries */}
      <IndustryShowcase />

      {/* Features Grid */}
      <FeaturesSection />

      {/* Social Proof */}
      <SocialProof />

      {/* Pricing/CTA Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// ========================================
// ENHANCED COMPONENTS
// ========================================

const EnhancedBackground: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#0f0f0f]" />
      
      {/* Animated red orb */}
      <div
        className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #ea2323, transparent 70%)',
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      
      {/* Secondary orb */}
      <div
        className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #ffffff, transparent 70%)',
          animation: 'float 25s ease-in-out infinite reverse',
        }}
      />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#050505]" />
    </div>
  );
};

const Navigation: React.FC<{ isMenuOpen: boolean; setIsMenuOpen: (open: boolean) => void }> = ({ isMenuOpen, setIsMenuOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Crew7Logo variant="horizontal" size="sm" />
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Features
          </a>
          <a href="#industries" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Industries
          </a>
          <a href="#crew" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Our Crew
          </a>
          <a href="#pricing" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            FAQ
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button className="px-5 py-2.5 text-sm font-semibold text-white/90 hover:text-white transition-colors">
            Sign In
          </button>
          <button className="px-6 py-2.5 rounded-xl bg-[#ea2323] text-sm font-semibold text-white shadow-lg shadow-[#ea2323]/30 hover:bg-[#ff2e2e] hover:shadow-[#ea2323]/50 transition-all">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0a]/98 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          <div className="px-6 py-6 space-y-4">
            <a href="#features" className="block text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#industries" className="block text-white/80 hover:text-white transition-colors">Industries</a>
            <a href="#crew" className="block text-white/80 hover:text-white transition-colors">Our Crew</a>
            <a href="#pricing" className="block text-white/80 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="block text-white/80 hover:text-white transition-colors">FAQ</a>
            <div className="pt-4 border-t border-white/10 space-y-3">
              <button className="w-full px-5 py-2.5 text-sm font-semibold text-white/90 border border-white/20 rounded-xl hover:bg-white/5 transition-colors">
                Sign In
              </button>
              <button className="w-full px-6 py-2.5 rounded-xl bg-[#ea2323] text-sm font-semibold text-white">
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const HeroSection: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  const { breathe, staggerFadeIn } = useAnime();
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logoRef.current) {
      breathe(logoRef.current, 3000);
    }
    if (textRef.current) {
      const elements = textRef.current.querySelectorAll('.fade-in-element');
      staggerFadeIn(elements, 100);
    }
  }, [breathe, staggerFadeIn]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-6">
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Logo */}
        <div ref={logoRef} className="flex justify-center mb-12">
          <Crew7Logo variant="vertical" size="lg" />
        </div>

        {/* Main Headline */}
        <div ref={textRef}>
          <h1 className="fade-in-element text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/95 to-white/90">
              Build Anything
            </span>
            <br />
            <span className="text-[#ea2323]">
              With AI Teams
            </span>
          </h1>

          <p className="fade-in-element text-xl md:text-2xl text-white/70 mb-4 max-w-3xl mx-auto leading-relaxed">
            Deploy specialized AI agent crews that work 24/7. From engineering to marketing, finance to operations.
          </p>

          <p className="fade-in-element text-lg text-white/50 mb-12 max-w-2xl mx-auto">
            No hiring. No training. No downtime. Just results.
          </p>

          {/* CTA Buttons */}
          <div className="fade-in-element flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="group px-8 py-4 rounded-xl bg-[#ea2323] font-semibold text-lg shadow-2xl shadow-[#ea2323]/40 hover:shadow-[#ea2323]/60 hover:bg-[#ff2e2e] transition-all transform hover:scale-105">
              Start Building Now
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button className="px-8 py-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/20 font-semibold text-lg hover:bg-white/10 hover:border-white/30 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Trust Badges */}
          <div className="fade-in-element flex flex-wrap items-center justify-center gap-8 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free 7-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

const TrustSection: React.FC = () => {
  return (
    <section className="relative py-16 px-6 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm text-white/40 mb-8 uppercase tracking-wider">
          Trusted by forward-thinking teams
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-50">
          {['10K+', '50K+', '95%', '$2M+'].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-white/90 mb-1">{stat}</div>
              <div className="text-sm text-white/50">
                {['Active Users', 'Tasks Completed', 'Success Rate', 'Saved'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ValueProposition: React.FC = () => {
  const benefits = [
    {
      icon: '⚡',
      title: '10x Faster',
      description: 'Deploy in minutes, not months. AI agents work 24/7 without breaks.',
    },
    {
      icon: '💰',
      title: '90% Cost Savings',
      description: 'Replace expensive hires with specialized AI crews at a fraction of the cost.',
    },
    {
      icon: '🎯',
      title: 'Expert-Level',
      description: 'Every agent is trained on thousands of real-world projects and best practices.',
    },
    {
      icon: '🔄',
      title: 'Always Learning',
      description: 'Agents improve with every task, building institutional knowledge over time.',
    },
  ];

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Why Crew-7?
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            The smartest way to scale your operations without scaling your headcount
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-[#ea2323]/30 hover:bg-white/[0.08] transition-all duration-300"
            >
              <div className="text-5xl mb-6">{benefit.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-white/60 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CrewShowcase: React.FC = () => {
  const { staggerFadeIn } = useAnime();
  const sectionRef = useScrollAnimation(() => {
    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll('.crew-card');
      staggerFadeIn(cards, 80);
    }
  });

  const crewMembers = [
    { Face: OrchestratorFace, name: 'Orchestrator', role: 'Mission Control', desc: 'Coordinates all agents, delegates tasks, ensures alignment' },
    { Face: EngineerFace, name: 'Engineer', role: 'Full-Stack Builder', desc: 'Builds SaaS products, APIs, infrastructure from scratch' },
    { Face: AnalystFace, name: 'Analyst', role: 'Data Scientist', desc: 'Extracts insights, builds models, predicts outcomes' },
    { Face: ArchitectFace, name: 'Architect', role: 'System Designer', desc: 'Designs scalable architectures, security, cloud infrastructure' },
    { Face: CreativeFace, name: 'Creative', role: 'Brand Visionary', desc: 'Creates compelling content, designs, and brand identity' },
    { Face: OperationsFace, name: 'Operations', role: 'Process Optimizer', desc: 'Automates workflows, optimizes processes, increases efficiency' },
    { Face: FinancialFace, name: 'Financial', role: 'CFO Agent', desc: 'Forecasts revenue, manages budgets, financial modeling' },
  ];

  return (
    <section id="crew" ref={sectionRef as any} className="relative py-32 px-6 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Meet Your AI Crew
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Seven specialized agents, each an expert in their domain. Deploy them together or individually.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {crewMembers.map((member, i) => (
            <div
              key={member.name}
              className="crew-card group relative p-6 rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-[#ea2323]/40 transition-all duration-300 opacity-0"
            >
              {/* Agent Face */}
              <div className="flex justify-center mb-6">
                <member.Face size={100} />
              </div>

              {/* Info */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <div className="text-xs text-[#ea2323] font-semibold mb-3 uppercase tracking-wider">{member.role}</div>
                <p className="text-sm text-white/60 leading-relaxed">{member.desc}</p>
              </div>

              {/* Hover glow */}
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-[#ea2323]/0 to-[#ea2323]/0 group-hover:from-[#ea2323]/20 group-hover:to-[#ea2323]/5 blur-xl transition-all duration-500 -z-10 opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="px-8 py-4 rounded-xl bg-[#ea2323] font-semibold text-lg shadow-xl shadow-[#ea2323]/30 hover:shadow-[#ea2323]/50 hover:bg-[#ff2e2e] transition-all">
            Build Your Custom Crew →
          </button>
        </div>
      </div>
    </section>
  );
};

const IndustryShowcase: React.FC = () => {
  const industries = [
    { icon: '💻', name: 'Engineering', desc: 'Full-stack development, DevOps, cloud infrastructure', users: '2.5K+' },
    { icon: '📊', name: 'Marketing', desc: 'Content creation, SEO, paid ads, social media', users: '1.8K+' },
    { icon: '💼', name: 'Business', desc: 'Strategy, operations, business planning', users: '1.2K+' },
    { icon: '💰', name: 'Finance', desc: 'Financial modeling, forecasting, analysis', users: '950+' },
    { icon: '🎯', name: 'Sales', desc: 'Lead generation, outreach, CRM management', users: '1.5K+' },
    { icon: '🎨', name: 'Design', desc: 'UI/UX, branding, visual content creation', users: '890+' },
  ];

  return (
    <section id="industries" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Any Industry. Any Challenge.
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Our AI crews adapt to your specific needs, no matter your domain
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl">{industry.icon}</div>
                <span className="px-3 py-1 rounded-full bg-[#ea2323]/10 text-[#ea2323] text-xs font-semibold">
                  {industry.users}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3">{industry.name}</h3>
              <p className="text-white/60">{industry.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'Autonomous Execution',
      description: 'Set goals and let AI crews handle the rest. They plan, execute, and iterate without constant supervision.',
      icon: '🤖',
    },
    {
      title: 'Real-Time Collaboration',
      description: 'Agents communicate and coordinate in real-time, just like a human team would.',
      icon: '🔗',
    },
    {
      title: 'Portfolio Building',
      description: 'Every crew builds a verifiable track record with metrics, completed tasks, and reputation scores.',
      icon: '📈',
    },
    {
      title: 'Marketplace Ready',
      description: 'Buy, sell, or rent specialized crews. Own them as NFTs with full transferability.',
      icon: '🏪',
    },
    {
      title: 'Web3 Native',
      description: 'Blockchain-verified credentials, transparent execution, and trustless transactions.',
      icon: '⛓️',
    },
    {
      title: 'API-First',
      description: 'Integrate into your existing workflows with our comprehensive REST and GraphQL APIs.',
      icon: '⚙️',
    },
  ];

  return (
    <section id="features" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Enterprise-Grade Features
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Everything you need to deploy, manage, and scale AI teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-[#ea2323]/30 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SocialProof: React.FC = () => {
  const testimonials = [
    {
      quote: "Replaced 3 contractors with one Crew-7 subscription. ROI was immediate.",
      author: "Sarah Chen",
      role: "CTO, TechStart",
      avatar: "👩‍💼",
    },
    {
      quote: "The engineering crew built our entire MVP in 2 weeks. Unbelievable quality.",
      author: "Marcus Rodriguez",
      role: "Founder, DataFlow",
      avatar: "👨‍💻",
    },
    {
      quote: "Our marketing team is now 10x more productive. The content quality is insane.",
      author: "Emma Thompson",
      role: "CMO, GrowthLabs",
      avatar: "👩‍🎨",
    },
  ];

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Loved by Builders
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Join thousands of teams already using Crew-7
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10"
            >
              <p className="text-lg text-white/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-white/50">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      period: '/month',
      description: 'Perfect for solo founders and small teams',
      features: [
        '3 active agents',
        '100 tasks/month',
        'Basic analytics',
        'Email support',
        'API access',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'For growing teams that need more power',
      features: [
        '7 active agents',
        'Unlimited tasks',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'Portfolio tracking',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For organizations with specific needs',
      features: [
        'Unlimited agents',
        'Dedicated infrastructure',
        'Custom AI training',
        '24/7 phone support',
        'SLA guarantees',
        'White-label options',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Start free. Scale as you grow. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border-[#ea2323]/50 scale-105'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#ea2323] text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-white/60 mb-6">{plan.description}</p>
                <div className="flex items-baseline">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className="text-white/50 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-xl font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-[#ea2323] hover:bg-[#ff2e2e] shadow-lg shadow-[#ea2323]/30'
                    : 'bg-white/5 border border-white/20 hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-white/50 mt-12">
          All plans include 7-day free trial • No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How is this different from ChatGPT or other AI tools?',
      answer: 'Crew-7 agents are specialized, autonomous, and work together as a team. They don\'t just chat - they execute complex multi-step tasks, coordinate with each other, and deliver complete projects.',
    },
    {
      question: 'Do I need technical knowledge to use Crew-7?',
      answer: 'No. Our platform is designed for everyone. Simply describe what you need in plain English, and the agents handle the technical execution.',
    },
    {
      question: 'How secure is my data?',
      answer: 'Enterprise-grade security with SOC 2 compliance, end-to-end encryption, and isolated execution environments. Your data never trains our models.',
    },
    {
      question: 'Can I integrate Crew-7 with my existing tools?',
      answer: 'Yes. We offer comprehensive APIs and pre-built integrations with popular tools like Slack, GitHub, Notion, and 100+ others.',
    },
    {
      question: 'What if I\'m not satisfied?',
      answer: 'We offer a 7-day free trial and 30-day money-back guarantee. If you\'re not happy, we\'ll refund you - no questions asked.',
    },
  ];

  return (
    <section id="faq" className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-white/70">
            Everything you need to know about Crew-7
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/[0.05] transition-colors"
              >
                <span className="font-semibold text-lg pr-8">{faq.question}</span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-8 pb-6">
                  <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA: React.FC = () => {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl md:text-7xl font-black mb-6">
          Ready to 10x Your Team?
        </h2>
        <p className="text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
          Join thousands of builders already using AI crews to ship faster
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button className="px-10 py-5 rounded-xl bg-[#ea2323] font-bold text-lg shadow-2xl shadow-[#ea2323]/40 hover:shadow-[#ea2323]/60 hover:bg-[#ff2e2e] transition-all transform hover:scale-105">
            Start Free Trial
          </button>
          <button className="px-10 py-5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/20 font-bold text-lg hover:bg-white/10 hover:border-white/30 transition-all">
            Schedule Demo
          </button>
        </div>

        <p className="text-white/50">
          Free 7-day trial • No credit card required • Setup in 5 minutes
        </p>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <Crew7Logo variant="horizontal" size="sm" className="mb-4" />
            <p className="text-sm text-white/50 leading-relaxed">
              Build anything with autonomous AI teams. The future of work is here.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © 2025 Crew-7. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageV3;
