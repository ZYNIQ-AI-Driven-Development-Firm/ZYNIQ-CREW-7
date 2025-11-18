import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import '../styles/landing-blueprint.css';

/**
 * CREW-7 BLUEPRINT LANDING PAGE
 * Modern sci-fi design with VT323 monospace font, 
 * geometric lines, and professional animations
 */

interface LandingPageBlueprintProps {
  onNavigate?: (view: 'auth' | 'shell') => void;
}

export const LandingPageBlueprint: React.FC<LandingPageBlueprintProps> = ({ onNavigate }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const geometricLinesRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate lines on mount
  useEffect(() => {
    if (geometricLinesRef.current) {
      const lines = geometricLinesRef.current.querySelectorAll('line, path, circle');
      animate({
        targets: lines,
        strokeDashoffset: [1000, 0],
        easing: 'easeInOutQuad',
        duration: 3200,
        delay: stagger(120),
      });
    }
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (onNavigate) {
      onNavigate('auth');
    }
  };

  return (
    <div ref={containerRef} className="blueprint-landing">
      {/* Page Frame */}
      <div className="page-frame" />
      
      {/* Timeline */}
      <div className="section-timeline" />

      {/* Geometric Background Lines */}
      <BackgroundLines ref={geometricLinesRef} />

      {/* Navigation */}
      <Navigation onGetStarted={handleGetStarted} scrollToSection={scrollToSection} />

      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* Section 1: Why Crew-7 */}
      <Section1 />

      {/* Section 2: The Science */}
      <Section2 />

      {/* Section 3: How It Works */}
      <Section3 />

      {/* Section 4: Use Cases */}
      <Section4 />

      {/* Section 5: Meet the Crew */}
      <Section5 />

      {/* Section 6: Pricing */}
      <Section6 />

      {/* Section 7: Get Started */}
      <Section7 onGetStarted={handleGetStarted} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Background Lines Component
const BackgroundLines = React.forwardRef<SVGSVGElement>((props, ref) => {
  return (
    <svg ref={ref} className="bg-grid" viewBox="0 0 800 600" aria-hidden="true">
      <defs>
        <pattern id="grid-blueprint" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#grid-blueprint)" />
      
      {/* Diagonal lines */}
      <line x1="0" y1="0" x2="100%" y2="30%" className="blueprint-stroke" strokeDasharray="10 5" />
      <line x1="100%" y1="0" x2="0" y2="40%" className="blueprint-stroke" strokeDasharray="10 5" />
      
      {/* Circles */}
      <circle cx="360" cy="260" r="120" className="blueprint-stroke" />
      <circle cx="360" cy="260" r="80" className="blueprint-stroke blueprint-highlight" />
    </svg>
  );
});

// Navigation Component
const Navigation: React.FC<{ onGetStarted: () => void; scrollToSection: (id: string) => void }> = ({ 
  onGetStarted, 
  scrollToSection 
}) => {
  return (
    <header className="nav-bar">
      <div className="nav-logo" onClick={() => scrollToSection('hero')}>
        <div className="nav-logo-mark">
          <img src="/public/new-logo-sign-only.png" alt="Crew-7 Logo" />
        </div>
      </div>
      <nav className="nav-links">
        <a className="nav-link" onClick={() => scrollToSection('hero')}>Home</a>
        <a className="nav-link" onClick={() => scrollToSection('sec-1')}>Why Crew-7</a>
        <a className="nav-link" onClick={() => scrollToSection('sec-2')}>The Science</a>
        <a className="nav-link" onClick={() => scrollToSection('sec-3')}>How It Works</a>
        <a className="nav-link" onClick={() => scrollToSection('sec-4')}>Use Cases</a>
        <a className="nav-link" onClick={() => scrollToSection('sec-5')}>Meet the Crew</a>
        <a className="nav-link" onClick={() => scrollToSection('sec-6')}>Pricing</a>
        <a className="nav-link" onClick={() => scrollToSection('sec-7')}>Get Started</a>
        <a href="/pages/presentation.html" className="nav-icon-link" title="View Presentation">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z" />
          </svg>
        </a>
        <button onClick={onGetStarted} className="nav-connect-btn">Launch App</button>
      </nav>
    </header>
  );
};

// Hero Section
const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        {/* Sci-Fi Lines */}
        <div className="hero-line line-top" />
        <div className="hero-line line-bottom" />
        <div className="hero-line line-left" />
        <div className="hero-line line-right" />
        
        <img src="/public/new-complete-logo.png" alt="Crew-7 Complete Logo" className="hero-logo" />
        <h1 className="hero-title">Multi-Agent Orchestration Platform</h1>
        <p className="hero-subtitle">
          CrewAI-powered agent coordination with real-time visualization and advanced workflow management. 
          Build specialized AI crews, visualize workflows, and manage missions with enterprise-grade orchestration.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onGetStarted} className="cta-button">Deploy Your First Crew</button>
          <a href="/pages/presentation.html" className="cta-button" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            View Live Demo
          </a>
        </div>
      </div>
    </section>
  );
};

// Section Components
const Section1: React.FC = () => (
  <section id="sec-1" className="content-section">
    <div className="timeline-node" />
    <div className="section-label"><span>01</span> / Why Crew-7</div>
    <div className="content-wrapper">
      <h2 className="section-title">Why Traditional Teams Fall Short</h2>
      <p className="section-text">
        Single AI agents can't handle complex projects. Traditional teams are slow to assemble and expensive to maintain. 
        Crew-7 bridges the gap with structured, coordinated AI teams that work together seamlessly.
      </p>
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">50K+</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">95%</div>
          <div className="stat-label">Success Rate</div>
        </div>
      </div>
    </div>
  </section>
);

const Section2: React.FC = () => (
  <section id="sec-2" className="content-section">
    <div className="timeline-node" />
    <div className="section-label"><span>02</span> / The Science</div>
    <div className="content-wrapper">
      <h2 className="section-title">The Perfect Team Formation</h2>
      <p className="section-text">
        Miller's Law: 7±2 items in working memory. Nature's pattern in swarms and colonies. 
        Research shows optimal team coordination at 7 members.<br />
        <strong style={{ color: 'var(--accent)' }}>
          1 Orchestrator coordinates 6 Specialists = Maximum Efficiency
        </strong>
      </p>
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-number">1</div>
          <div className="stat-label">Orchestrator</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">+</div>
          <div className="stat-label"></div>
        </div>
        <div className="stat-box">
          <div className="stat-number">6</div>
          <div className="stat-label">Specialists</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">=</div>
          <div className="stat-label"></div>
        </div>
        <div className="stat-box">
          <div className="stat-number">7</div>
          <div className="stat-label">Perfect Crew</div>
        </div>
      </div>
    </div>
  </section>
);

const Section3: React.FC = () => (
  <section id="sec-3" className="content-section">
    <div className="timeline-node" />
    <div className="section-label"><span>03</span> / How It Works</div>
    <div className="content-wrapper">
      <h2 className="section-title">How Crew-7 Works</h2>
      <p className="section-text">
        Define your mission in natural language. Our Orchestrator breaks it into tasks. 
        Specialists collaborate autonomously. You watch everything unfold in real-time through our Agent Graph visualization.
      </p>
      <div className="stats-row">
        <div className="stat-box"><div className="stat-label">Define Mission</div></div>
        <div className="stat-box"><div className="stat-label">→</div></div>
        <div className="stat-box"><div className="stat-label">AI Orchestration</div></div>
        <div className="stat-box"><div className="stat-label">→</div></div>
        <div className="stat-box"><div className="stat-label">Watch Live</div></div>
        <div className="stat-box"><div className="stat-label">→</div></div>
        <div className="stat-box"><div className="stat-label">Get Results</div></div>
      </div>
    </div>
  </section>
);

const Section4: React.FC = () => (
  <section id="sec-4" className="content-section">
    <div className="timeline-node" />
    <div className="section-label"><span>04</span> / Use Cases</div>
    <div className="content-wrapper">
      <h2 className="section-title">Specialized Crews for Every Mission</h2>
      <p className="section-text">
        Full-Stack Development Crews: Build complete applications with backend, frontend, and deployment specialists.<br />
        Research & Analysis Crews: Process data, generate insights, and create comprehensive reports.<br />
        Content & Marketing Crews: Create campaigns, write content, and analyze performance.<br />
        DevOps & Infrastructure Crews: Manage deployments, monitoring, and system architecture.
      </p>
    </div>
  </section>
);

const Section5: React.FC = () => (
  <section id="sec-5" className="content-section">
    <div className="timeline-node" />
    <div className="section-label"><span>05</span> / Meet the Crew</div>
    <div className="content-wrapper">
      <h2 className="section-title">Meet Your AI Crew</h2>
      <p className="section-text">
        <strong>Orchestrator (Gemini):</strong> Plans missions, breaks down complex tasks, maintains context<br />
        <strong>Backend Engineer:</strong> Builds APIs, databases, and server infrastructure<br />
        <strong>Frontend Developer:</strong> Creates responsive UIs and user experiences<br />
        <strong>Research Analyst:</strong> Processes data and generates actionable insights<br />
        <strong>QA Specialist:</strong> Tests, validates, and ensures quality<br />
        <strong>DevOps Engineer:</strong> Manages deployment, monitoring, and infrastructure
      </p>
    </div>
  </section>
);

const Section6: React.FC = () => (
  <section id="sec-6" className="content-section">
    <div className="timeline-node" />
    <div className="section-label"><span>06</span> / Pricing</div>
    <div className="content-wrapper">
      <h2 className="section-title">Simple, Transparent Pricing</h2>
      <p className="section-text">
        Pay only for what you use. No subscriptions. No hidden fees.<br />
        Start with our free trial and scale as you grow.
      </p>
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-number">Free</div>
          <div className="stat-label">7-Day Trial</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">$0.10</div>
          <div className="stat-label">Per 1K Tokens</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">∞</div>
          <div className="stat-label">Unlimited Scale</div>
        </div>
      </div>
    </div>
  </section>
);

const Section7: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => (
  <section id="sec-7" className="content-section">
    <div className="timeline-node" />
    <div className="section-label"><span>07</span> / Get Started</div>
    <div className="content-wrapper">
      <h2 className="section-title">Ready to Transform Your Workflow?</h2>
      <p className="section-text">
        Join thousands of teams already using Crew-7 to accelerate their projects.<br />
        Start your free trial today. No credit card required.
      </p>
      <button onClick={onGetStarted} className="cta-button" style={{ marginTop: '2rem' }}>
        Deploy Your First Crew
      </button>
    </div>
  </section>
);

const Footer: React.FC = () => (
  <footer className="page-footer">
    <span>Crew-7</span> by ZYNIQ • 2025
  </footer>
);

export default LandingPageBlueprint;
