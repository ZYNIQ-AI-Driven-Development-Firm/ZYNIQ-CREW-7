/**
 * Crew-7 Logo Implementation Examples
 * 
 * This file demonstrates practical examples of using the Crew7Logo component
 * in various UI contexts throughout the application.
 */

import React from 'react';
import {
  Crew7Logo,
  HeaderLogo,
  AuthLogo,
  CompactLogo,
  HeroLogo,
  MinimalLogo,
} from './Crew7Logo';

// ========================================
// Example 1: Main App Header (Desktop)
// ========================================
// Use horizontal lockup at medium size, clickable to home
export const AppHeader: React.FC = () => (
  <header className="flex items-center justify-between border-b border-white/10 bg-[#0d1523] px-6 py-4">
    {/* Use pre-configured HeaderLogo component */}
    <HeaderLogo />
    
    <nav className="flex gap-6">
      <a href="/dashboard">Dashboard</a>
      <a href="/projects">Projects</a>
      <a href="/settings">Settings</a>
    </nav>
  </header>
);

// ========================================
// Example 2: Responsive Mobile/Desktop Header
// ========================================
// Show compact logo on mobile, full logo on desktop
export const ResponsiveHeader: React.FC = () => (
  <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
    {/* Mobile: compact sign-only icon */}
    <div className="block md:hidden">
      <Crew7Logo variant="sign" size="sm" asLink />
    </div>
    
    {/* Desktop: full horizontal lockup */}
    <div className="hidden md:block">
      <Crew7Logo variant="horizontal" size="md" asLink />
    </div>
    
    <button className="md:hidden">Menu</button>
  </header>
);

// ========================================
// Example 3: Authentication Screen
// ========================================
// Centered vertical logo above auth form
export const SignInScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#090c12] via-[#101523] to-[#161f30] px-6">
    <div className="w-full max-w-md space-y-8">
      {/* Centered vertical logo - large size for auth screens */}
      <AuthLogo />
      
      <form className="space-y-4">
        <input type="email" placeholder="Email" className="w-full rounded-xl px-4 py-3" />
        <input type="password" placeholder="Password" className="w-full rounded-xl px-4 py-3" />
        <button type="submit" className="w-full rounded-xl bg-[#ea2323] py-3 font-semibold text-white">
          Sign In
        </button>
      </form>
    </div>
  </div>
);

// ========================================
// Example 4: Landing Page Hero
// ========================================
// Large centered vertical logo with headline
export const HeroSection: React.FC = () => (
  <section className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
    {/* Hero logo - large vertical lockup */}
    <HeroLogo />
    
    <h1 className="mt-8 text-5xl font-bold text-white md:text-6xl">
      Assemble your AI crew in minutes
    </h1>
    <p className="mt-4 max-w-2xl text-lg text-[#9ea6bd]">
      Build, deploy, and orchestrate intelligent agent workflows with Crew-7's powerful platform.
    </p>
    
    <button className="mt-8 rounded-xl bg-[#ea2323] px-8 py-4 font-semibold text-white">
      Get Started
    </button>
  </section>
);

// ========================================
// Example 5: Collapsed Sidebar
// ========================================
// Compact icon for narrow sidebar
export const CollapsedSidebar: React.FC = () => (
  <aside className="flex w-16 flex-col items-center gap-6 bg-[#141a24] py-6">
    {/* Compact logo for collapsed state */}
    <CompactLogo />
    
    <nav className="flex flex-col items-center gap-4">
      <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
        📊
      </button>
      <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
        📁
      </button>
      <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
        ⚙️
      </button>
    </nav>
  </aside>
);

// ========================================
// Example 6: Expanded Sidebar
// ========================================
// Full horizontal logo for expanded sidebar
export const ExpandedSidebar: React.FC = () => (
  <aside className="flex w-60 flex-col gap-6 bg-[#141a24] px-4 py-6">
    {/* Full logo with text for expanded state */}
    <Crew7Logo variant="horizontal" size="sm" asLink />
    
    <nav className="flex flex-col gap-2">
      <a href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2">
        <span>📊</span>
        <span>Dashboard</span>
      </a>
      <a href="/projects" className="flex items-center gap-3 rounded-lg px-3 py-2">
        <span>📁</span>
        <span>Projects</span>
      </a>
      <a href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2">
        <span>⚙️</span>
        <span>Settings</span>
      </a>
    </nav>
  </aside>
);

// ========================================
// Example 7: Settings Page Header
// ========================================
// Minimal text-only logo for settings
export const SettingsHeader: React.FC = () => (
  <div className="border-b border-white/10 pb-6">
    <MinimalLogo />
    <h1 className="mt-4 text-3xl font-bold text-white">Settings</h1>
    <p className="mt-2 text-[#9ea6bd]">Manage your account and preferences</p>
  </div>
);

// ========================================
// Example 8: Footer
// ========================================
// Text-only logo for minimal footer branding
export const Footer: React.FC = () => (
  <footer className="border-t border-white/10 bg-[#0d1523] px-6 py-8">
    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
      <MinimalLogo />
      
      <nav className="flex gap-6 text-sm text-[#9ea6bd]">
        <a href="/about">About</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </nav>
      
      <p className="text-sm text-[#7c859f]">© 2025 Crew-7. All rights reserved.</p>
    </div>
  </footer>
);

// ========================================
// Example 9: Empty State
// ========================================
// Medium sign-only icon for empty state
export const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <Crew7Logo variant="sign" size="lg" className="opacity-50" />
    <h3 className="mt-6 text-xl font-semibold text-white">No projects yet</h3>
    <p className="mt-2 text-[#9ea6bd]">Create your first project to get started with Crew-7</p>
    <button className="mt-6 rounded-xl bg-[#ea2323] px-6 py-3 font-semibold text-white">
      Create Project
    </button>
  </div>
);

// ========================================
// Example 10: Loading Screen
// ========================================
// Large sign-only icon with animation for loading
export const LoadingScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0d1523]">
    <div className="flex flex-col items-center gap-4">
      <Crew7Logo 
        variant="sign" 
        size="lg" 
        className="animate-pulse" 
      />
      <p className="text-sm text-[#9ea6bd]">Loading Crew-7...</p>
    </div>
  </div>
);

// ========================================
// Example 11: Email Template
// ========================================
// Text-only logo for email header (HTML would be string)
export const EmailTemplate: React.FC<{ userName: string }> = ({ userName }) => (
  <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ padding: '32px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
      <img 
        src="/crew7-logo-text-only.svg" 
        alt="Crew-7" 
        style={{ height: '32px', width: 'auto' }}
      />
    </div>
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Welcome to Crew-7, {userName}!</h1>
      <p style={{ marginTop: '16px', color: '#6b7280' }}>
        Your account has been successfully created. Get started by assembling your first crew.
      </p>
    </div>
    <div style={{ padding: '32px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
      <p style={{ fontSize: '12px', color: '#9ca3af' }}>© 2025 Crew-7. All rights reserved.</p>
    </div>
  </div>
);

// ========================================
// Example 12: Splash Screen / App Loading
// ========================================
// Large vertical logo for initial app load
export const SplashScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#090c12] via-[#101523] to-[#161f30]">
    <div className="flex flex-col items-center">
      <Crew7Logo variant="vertical" size="lg" className="animate-pulse" />
      <div className="mt-8 flex gap-2">
        <div className="h-2 w-2 animate-bounce rounded-full bg-[#ea2323]" style={{ animationDelay: '0ms' }} />
        <div className="h-2 w-2 animate-bounce rounded-full bg-[#ea2323]" style={{ animationDelay: '150ms' }} />
        <div className="h-2 w-2 animate-bounce rounded-full bg-[#ea2323]" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// ========================================
// Example 13: Error Page (404)
// ========================================
// Vertical logo for error state
export const ErrorPage: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0d1523] px-6">
    <div className="max-w-md text-center">
      <Crew7Logo variant="vertical" size="md" className="opacity-75" />
      <h1 className="mt-8 text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-xl text-[#9ea6bd]">Page not found</p>
      <p className="mt-2 text-[#7c859f]">The page you're looking for doesn't exist or has been moved.</p>
      <a 
        href="/" 
        className="mt-8 inline-block rounded-xl bg-[#ea2323] px-6 py-3 font-semibold text-white"
      >
        Return Home
      </a>
    </div>
  </div>
);

// ========================================
// Example 14: Modal/Dialog Header
// ========================================
// Small horizontal logo for modal
export const ModalWithLogo: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-lg rounded-3xl bg-[#0e1626] p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Crew7Logo variant="horizontal" size="sm" />
        <button className="text-[#9ea6bd] hover:text-white">✕</button>
      </div>
      <div className="py-6">
        <h2 className="text-xl font-semibold text-white">Create New Project</h2>
        <form className="mt-4 space-y-4">
          <input 
            type="text" 
            placeholder="Project name" 
            className="w-full rounded-xl border border-white/10 bg-[#121a28] px-4 py-3"
          />
          <button 
            type="submit" 
            className="w-full rounded-xl bg-[#ea2323] py-3 font-semibold text-white"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  </div>
);

// ========================================
// Example 15: Mobile App Badge
// ========================================
// Tiny sign-only for badges and notifications
export const NotificationBadge: React.FC = () => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#121a28] px-4 py-3">
    <Crew7Logo variant="sign" size="sm" />
    <div className="flex-1">
      <p className="text-sm font-semibold text-white">Crew-7 Mission Update</p>
      <p className="text-xs text-[#9ea6bd]">Your deployment is complete</p>
    </div>
    <span className="text-xs text-[#7c859f]">2m ago</span>
  </div>
);

export default {
  AppHeader,
  ResponsiveHeader,
  SignInScreen,
  HeroSection,
  CollapsedSidebar,
  ExpandedSidebar,
  SettingsHeader,
  Footer,
  EmptyState,
  LoadingScreen,
  EmailTemplate,
  SplashScreen,
  ErrorPage,
  ModalWithLogo,
  NotificationBadge,
};
