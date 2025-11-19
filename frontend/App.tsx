import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { animate, remove, stagger } from 'animejs';

import ChatInput from './components/ChatInput';
import Dashboard, { type RunLogEvent } from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import { AgentIcon, AgentKey } from './components/AgentIcon';
import { AgentLottie } from './components/AgentLottie';
import { Crew7Logo, AuthLogo } from './components/Crew7Logo';
import { AgentGraph } from './components/graph/AgentGraph';
import LandingPageBlueprint from './pages/LandingPageBlueprint';
import { Presentation } from './pages/Presentation';
import { MarketplacePage } from './pages/MarketplacePage';
import { MissionLabPage } from './pages/MissionLabPage';
import { WalletProvider } from './components/Wallet/useWallet';
import { WalletConnect } from './components/Wallet/WalletConnect';
import { TokenBalanceChip } from './components/Wallet/TokenBalanceChip';
import { WorkspaceManager } from './components/workspace/WorkspaceManager';
import { crewSet, idForRole, AGENT_IDS } from './roles/avatar-utils';
import './styles/crew7.css';
import './styles/design-system.css';
import './styles/landing-page-enhanced.css';
import {
  createRun,
  getCrew,
  listCrews,
  getMe,
  login,
  register,
  missionSocket,
  streamRun,
  runFullStackCrew,
  setAuthToken,
  getAuthToken,
  type Crew,
  type MissionMessage,
  type StreamEvent,
  type User,
} from './src/lib/api';


type Section =
  | 'chat'
  | 'dashboard'
  | 'projects'
  | 'collections'
  | 'workspace'
  | 'marketplace'
  | 'missionlab'
  | 'crews'
  | 'runs'
  | 'settings';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type PresenceStatus = 'available' | 'busy' | 'focusing' | 'offline';
type MissionStatus = 'available' | 'busy' | 'offline';

type NotificationVariant = 'info' | 'success' | 'warning' | 'critical';

type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  variant: NotificationVariant;
  unread?: boolean;
};

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'AI';

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isAgentKey = (value: string | null | undefined): value is AgentKey =>
  Boolean(value && (AGENT_IDS as readonly string[]).includes(value as (typeof AGENT_IDS)[number]));

const formatEventData = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof MessageEvent && typeof value.data === 'string') {
    return value.data;
  }
  if (typeof value === 'object') {
    const maybeMessage = (value as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const coerceMissionStatus = (value: unknown): MissionStatus => {
  if (value === 'busy' || value === 'offline' || value === 'available') {
    return value;
  }
  return 'available';
};

const formatAgentName = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

const PRESENCE_OPTIONS: Array<{ id: PresenceStatus; label: string; description: string; dotClass: string }> = [
  {
    id: 'available',
    label: 'Available',
    description: 'Open to new crew commands and mentions.',
    dotClass: 'bg-[#4cf5a1] shadow-[0_0_10px_rgba(76,245,161,0.55)]',
  },
  {
    id: 'busy',
    label: 'Mission engaged',
    description: 'Currently executing a mission sequence.',
    dotClass: 'bg-[#f5d14c] shadow-[0_0_10px_rgba(245,209,76,0.45)]',
  },
  {
    id: 'focusing',
    label: 'Heads down',
    description: 'Filtering pings so you stay in flow.',
    dotClass: 'bg-[#f5d14c] shadow-[0_0_10px_rgba(245,209,76,0.45)]',
  },
  {
    id: 'offline',
    label: 'Stepping away',
    description: 'Let the crew know you will reply later.',
    dotClass: 'bg-[#f1786b] shadow-[0_0_10px_rgba(241,120,107,0.45)]',
  },
];

const NOTIFICATION_VARIANT_STYLES: Record<NotificationVariant, { label: string; dotClass: string }> = {
  info: { label: 'Info', dotClass: 'bg-[#5ca9ff] shadow-[0_0_8px_rgba(92,169,255,0.45)]' },
  success: { label: 'Success', dotClass: 'bg-[#4cf5a1] shadow-[0_0_8px_rgba(76,245,161,0.45)]' },
  warning: { label: 'Warning', dotClass: 'bg-[#f5d14c] shadow-[0_0_8px_rgba(245,209,76,0.45)]' },
  critical: { label: 'Critical', dotClass: 'bg-[#f1786b] shadow-[0_0_8px_rgba(241,120,107,0.45)]' },
};

const NOTIFICATION_SEED: NotificationItem[] = [];

// Load notifications from localStorage
const loadNotifications = (): NotificationItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('crew7_notifications');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save notifications to localStorage
const saveNotifications = (notifications: NotificationItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('crew7_notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications', error);
  }
};

const WORKSPACE_OPTIONS: Array<{ id: string; name: string }> = [
  { id: 'crew-7-command', name: 'Crew-7 Command' },
  { id: 'product-intelligence', name: 'Product Intelligence' },
  { id: 'launch-readiness', name: 'Launch Readiness' },
];

const resolveTimeZone = (): { id: string; label: string } => {
  if (typeof Intl === 'undefined') {
    return { id: 'UTC', label: 'UTC' };
  }

  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    const id = resolved.timeZone ?? 'UTC';
    return { id, label: formatTimeZoneLabel(id) };
  } catch {
    return { id: 'UTC', label: 'UTC' };
  }
};

const formatTimeZoneLabel = (identifier: string) => {
  if (!identifier) return 'UTC';
  const segments = identifier.split('/');
  const city = segments.pop() ?? identifier;
  return city.replace(/_/g, ' ');
};

const formatLocalTime = (timeZoneId: string) => {
  if (typeof Intl === 'undefined') {
    return '00:00';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timeZoneId,
    }).format(new Date());
  } catch {
    return '00:00';
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'shell'>(() => {
    // Check if user is already authenticated
    const token = getAuthToken();
    return token ? 'shell' : 'landing';
  });
  const [activeSection, setActiveSection] = useState<Section>('chat');

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const existing = document.getElementById('crew7-agent-sprite');
    if (existing) {
      return;
    }

    let cancelled = false;

    const mountSprite = async () => {
      try {
        const response = await fetch('/crew7-agents.svg');
        if (!response.ok) {
          throw new Error(`Sprite fetch failed: ${response.status}`);
        }
        const markup = await response.text();
        if (cancelled) {
          return;
        }

        const container = document.createElement('div');
        container.id = 'crew7-agent-sprite';
        container.setAttribute('aria-hidden', 'true');
        container.style.position = 'absolute';
        container.style.width = '0';
        container.style.height = '0';
        container.style.overflow = 'hidden';
        container.innerHTML = markup;
        document.body.prepend(container);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unable to mount Crew-7 agent sprite', error);
      }
    };

    void mountSprite();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle sign out
  const handleSignOut = () => {
    setAuthToken(null);
    setView('auth');
  };

  // Main App Content Component (for routing)
  const AppContent = () => {
    if (view === 'landing') {
      return <LandingPageBlueprint onNavigate={setView} />;
    }

    if (view === 'auth') {
      return <AuthScreen onAuthenticated={() => setView('shell')} />;
    }

    return (
      <WalletProvider>
        <ApplicationShell
          activeSection={activeSection}
          onNavigate={setActiveSection}
          onSignOut={handleSignOut}
        />
      </WalletProvider>
    );
  };

  // Return with Router wrapper
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/presentation" element={<Presentation />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
};

type AuthScreenProps = {
  onAuthenticated: () => void;
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);

  // Logo animation sequence
  useEffect(() => {
    if (!logoRef.current) return;

    const logos = [
      '/new-logo-sign-only-white-frame.png',
      '/new-logo-sign-only-white.png',
      '/new-logo-sign-only.png'
    ];
    let currentIndex = 0;
    let timeoutId: number | undefined;

    const animateLogo = () => {
      if (!logoRef.current) return;

      try {
        animate(logoRef.current, {
          opacity: [1, 0],
          duration: 800,
          easing: 'easeInOutQuad',
          complete: () => {
            if (!logoRef.current) return;
            currentIndex = (currentIndex + 1) % logos.length;
            logoRef.current.src = logos[currentIndex];
            
            animate(logoRef.current, {
              opacity: [0, 1],
              duration: 800,
              easing: 'easeInOutQuad',
              complete: () => {
                timeoutId = window.setTimeout(animateLogo, 2000);
              }
            });
          }
        });
      } catch (error) {
        console.warn('Logo animation error:', error);
      }
    };

    timeoutId = window.setTimeout(animateLogo, 2000);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const isSignUp = mode === 'signUp';
  const canSubmit = formData.email.trim() && formData.password.trim() && (!isSignUp || formData.name.trim());

  const handleChange = (field: 'name' | 'email' | 'password') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      setError(''); // Clear error when user types
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Register new user
        await register({ email: formData.email, password: formData.password });
        // After registration, log in
        const loginResponse = await login({ email: formData.email, password: formData.password });
        setAuthToken(loginResponse.access);
      } else {
        // Sign in existing user
        const loginResponse = await login({ email: formData.email, password: formData.password });
        setAuthToken(loginResponse.access);
      }
      onAuthenticated();
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Better error messages based on error type
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        if (status === 400) {
          errorMessage = 'Invalid email or password format.';
        } else if (status === 401) {
          errorMessage = 'Incorrect email or password.';
        } else if (status === 409) {
          errorMessage = 'An account with this email already exists.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#1a1f2e] via-[#232b3d] to-[#2d3748] text-[#f0f3f9] relative">
      {/* Background blur effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#ea2323]/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-40px] h-80 w-80 rounded-full bg-[#ea2323]/16 blur-3xl" />
      </div>

      {/* Centered auth form */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div 
          className="relative w-full max-w-md"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Vaporized blur overlay with logo */}
          <div 
            className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none z-20"
            style={{
              clipPath: isHovering 
                ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' 
                : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              transition: isHovering 
                ? 'clip-path 1.2s cubic-bezier(0.645, 0.045, 0.355, 1.000), opacity 1.2s ease-out' 
                : 'clip-path 1.5s cubic-bezier(0.175, 0.885, 0.320, 1.275), opacity 1.5s ease-in',
              opacity: isHovering ? 0 : 1,
              filter: isHovering 
                ? 'blur(20px) brightness(1.5)' 
                : 'blur(0px) brightness(1) saturate(1.2)',
              transform: isHovering 
                ? 'scale(1.05) rotate(0.5deg)' 
                : 'scale(1) rotate(0deg)',
            }}
          >
            <div 
              className="absolute inset-0 backdrop-blur-xl bg-slate-900/60 border border-white/20 rounded-[28px]"
              style={{
                background: isHovering 
                  ? 'radial-gradient(circle at center, rgba(30, 38, 53, 0.4), transparent)' 
                  : 'linear-gradient(135deg, rgba(30, 38, 53, 0.8), rgba(45, 55, 72, 0.6))',
                transition: 'background 1s ease-in-out',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                ref={logoRef}
                src="/new-logo-sign-only-white-frame.png" 
                alt="Crew-7 Logo" 
                className="w-32 h-32 object-contain opacity-90"
                style={{
                  filter: isHovering 
                    ? 'drop-shadow(0 0 30px rgba(234, 35, 35, 0.8)) brightness(1.5)' 
                    : 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
                  transition: 'filter 1s ease-in-out',
                }}
              />
            </div>
          </div>

          {/* Auth form */}
          <div className="relative rounded-[28px] border border-white/15 bg-[#1e2635] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
            {/* Toggle buttons */}
            <div className="flex items-center justify-between rounded-full bg-[#283347] p-1 mb-8">
              <button
                type="button"
                onClick={() => setMode('signIn')}
                className={classNames(
                  'w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition',
                  mode === 'signIn' ? 'bg-[#ea2323] text-white shadow-lg' : 'text-[#9099b4] hover:text-white'
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode('signUp')}
                className={classNames(
                  'w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition',
                  mode === 'signUp' ? 'bg-[#ea2323] text-white shadow-lg' : 'text-[#9099b4] hover:text-white'
                )}
              >
                Create account
              </button>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {isSignUp ? (
                <label className="block text-sm font-medium text-[#c0c6d8]">
                  <span className="mb-2 inline-block">Full name</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Taylor Edison"
                    className="w-full rounded-xl border border-[#3d4759] bg-[#1a2332] px-4 py-3 text-[#f8fafc] shadow-sm placeholder:text-[#8892a8] focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/30 transition"
                  />
                </label>
              ) : null}
              
              <label className="block text-sm font-medium text-[#c0c6d8]">
                <span className="mb-2 inline-block">Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="john@company.com"
                  className="w-full rounded-xl border border-[#3d4759] bg-[#1a2332] px-4 py-3 text-[#f8fafc] shadow-sm placeholder:text-[#8892a8] focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/30 transition"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-[#c0c6d8]">
                <span className="mb-2 inline-block">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange('password')}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#3d4759] bg-[#1a2332] px-4 py-3 pr-12 text-[#f8fafc] shadow-sm placeholder:text-[#8892a8] focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/30 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a8] hover:text-[#ea2323] transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full rounded-xl bg-[#ea2323] py-3 text-sm font-semibold text-white shadow-lg shadow-[#ea232336] transition hover:bg-[#c81f1f] hover:shadow-xl disabled:cursor-not-allowed disabled:bg-[#6b1c1c] disabled:shadow-none"
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create your account' : 'Sign in to Crew-7')}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#acb6cf]">
              <p>
                By continuing you agree to our{' '}
                <a className="font-semibold text-[#ea2323] hover:text-[#ff4040] transition" href="#">Terms</a>
                {' '}&{' '}
                <a className="font-semibold text-[#ea2323] hover:text-[#ff4040] transition" href="#">Privacy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type ApplicationShellProps = {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  onSignOut: () => void;
};

const ApplicationShell: React.FC<ApplicationShellProps> = ({ activeSection, onNavigate, onSignOut }) => {
  const [timeZoneInfo, setTimeZoneInfo] = useState(() => resolveTimeZone());
  const [localTime, setLocalTime] = useState(() => formatLocalTime(resolveTimeZone().id));
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('crew7-chat-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isResponding, setIsResponding] = useState(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadNotifications());
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('available');
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => WORKSPACE_OPTIONS[0]?.id ?? 'crew-7-command');
  const [user, setUser] = useState<User | null>(null);
  const [missionStatus, setMissionStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [runEvents, setRunEvents] = useState<RunLogEvent[]>([]);
  const [activeCrew, setActiveCrew] = useState<Crew | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [activeCrewId, setActiveCrewId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('crew7_active_crew_id');
      return stored ?? '';
    }
    return '';
  });
  const streamCloseRef = useRef<(() => void) | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);
  const [chatMode, setChatMode] = useState<boolean>(false); // Normal chat mode vs Crew mode
  const [crewType, setCrewType] = useState<'standard' | 'fullstack'>('standard');

  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const walletMenuRef = useRef<HTMLDivElement | null>(null);

  const activeWorkspace = useMemo(
    () =>
      WORKSPACE_OPTIONS.find((option) => option.id === activeWorkspaceId) ??
      WORKSPACE_OPTIONS[0] ?? { id: 'fallback-workspace', name: 'Crew-7 Command' },
    [activeWorkspaceId]
  );

  const orchestratorAgent = useMemo<AgentKey>(() => {
    const candidate = activeCrew?.orchestrator?.agentId;
    if (isAgentKey(candidate)) {
      return candidate;
    }
    return idForRole('Orchestrator') as AgentKey;
  }, [activeCrew?.orchestrator?.agentId]);

  const crewMembers = useMemo<AgentKey[]>(() => {
    if (activeCrew?.rotation?.length) {
      const mapped = activeCrew.rotation
        .map((member) => member.agentId)
        .filter((id): id is AgentKey => isAgentKey(id));
      if (mapped.length) {
        return mapped;
      }
    }
    return crewSet(activeWorkspace.id, 5)
      .filter((id): id is AgentKey => isAgentKey(id)) as AgentKey[];
  }, [activeCrew?.rotation, activeWorkspace.id]);

  const profile = useMemo(
    () => ({
      name: user?.name ?? 'Commander',
      role: user?.role ?? 'Member',
      timezone: `${timeZoneInfo.label} • ${localTime}`,
      avatar: null, // Removed avatar URL, using initials only
    }),
    [user, timeZoneInfo.label, localTime]
  );

  useEffect(() => {
    const resolved = resolveTimeZone();
    setTimeZoneInfo(resolved);
    setLocalTime(formatLocalTime(resolved.id));

    const interval = window.setInterval(() => {
      setLocalTime(formatLocalTime(resolved.id));
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
          // Add login notification
          const loginTime = new Date().toLocaleString();
          const newNotification: NotificationItem = {
            id: makeId(),
            title: 'Successfully logged in',
            description: `Welcome back! Logged in at ${loginTime}`,
            timestamp: 'Just now',
            variant: 'success',
            unread: true,
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      } catch (error) {
        console.error('Unable to fetch current user', error);
        // Set a default user if API fails
        if (!cancelled) {
          setUser({
            id: 'default-user',
            email: 'commander@crew7.ai',
            org_id: 'default',
            role: 'owner',
          });
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // Set default timezone info
  useEffect(() => {
    const defaultTz = 'UTC';
    setTimeZoneInfo({ id: defaultTz, label: formatTimeZoneLabel(defaultTz) });
    setLocalTime(formatLocalTime(defaultTz));
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('crew7_active_crew_id', activeCrewId);
  }, [activeCrewId]);

  // Fetch all crews
  useEffect(() => {
    let cancelled = false;
    const loadCrews = async () => {
      try {
        const crewsData = await listCrews();
        if (!cancelled) {
          setCrews(crewsData);
          // If no active crew is set and we have crews, set the first one
          if (!activeCrewId && crewsData.length > 0) {
            setActiveCrewId(crewsData[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch crews', error);
      }
    };

    void loadCrews();

    return () => {
      cancelled = true;
    };
  }, [activeCrewId]);

  useEffect(() => {
    if (!activeCrewId) {
      setActiveCrew(null);
      return;
    }

    let cancelled = false;
    const loadCrew = async () => {
      try {
        const crewData = await getCrew(activeCrewId);
        if (!cancelled) {
          setActiveCrew(crewData);
        }
      } catch (error) {
        console.error('Failed to fetch crew', error);
        if (!cancelled) {
          setActiveCrew(null);
          // Clear invalid crew ID from storage
          window.localStorage.removeItem('crew7_active_crew_id');
          // Try to set the first available crew from the list
          if (crews.length > 0) {
            setActiveCrewId(crews[0].id);
          } else {
            setActiveCrewId('');
          }
        }
      }
    };

    void loadCrew();

    return () => {
      cancelled = true;
    };
  }, [activeCrewId, crews]);

  useEffect(() => {
    // Only connect WebSocket if user is authenticated
    if (!user) {
      return;
    }

    const handleError = (error: Event) => {
      console.warn('Mission WebSocket connection failed - this is normal if not authenticated');
    };

    const ws = missionSocket((message: MissionMessage) => {
      if (message.type === 'signal') {
        const payload = (message.payload ?? {}) as Record<string, unknown>;
        const status = coerceMissionStatus(payload.status);
        setMissionStatus(status);
        setPresenceStatus(status);
        const crewFromPayload = payload.crewId ?? payload.crew_id;
        if (typeof crewFromPayload === 'string' && crewFromPayload && crewFromPayload !== activeCrewId) {
          setActiveCrewId(crewFromPayload);
        }
        return;
      }

      if (message.type === 'crew-change') {
        const payload = (message.payload ?? {}) as Record<string, unknown>;
        const crewFromPayload = payload.crewId ?? payload.crew_id;
        const targetCrew = typeof crewFromPayload === 'string' && crewFromPayload.length ? crewFromPayload : activeCrewId;
        void getCrew(targetCrew)
          .then((data) => setActiveCrew(data))
          .catch((error) => console.error('Failed to refresh crew after change', error));
        if (typeof crewFromPayload === 'string' && crewFromPayload && crewFromPayload !== activeCrewId) {
          setActiveCrewId(crewFromPayload);
        }
        return;
      }

      if (message.type === 'alert') {
        const payload = (message.payload ?? {}) as Record<string, unknown>;
        const severity = typeof payload.severity === 'string' ? payload.severity.toLowerCase() : 'critical';
        const variant: NotificationVariant =
          severity === 'info' || severity === 'success' || severity === 'warning' || severity === 'critical'
            ? (severity as NotificationVariant)
            : 'warning';
        const title = typeof payload.title === 'string' ? payload.title : 'Mission alert';
        const description =
          typeof payload.message === 'string'
            ? payload.message
            : typeof payload.description === 'string'
            ? payload.description
            : undefined;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setNotifications((prev) =>
          [
            {
              id: makeId(),
              title,
              description,
              timestamp,
              variant,
              unread: true,
            },
            ...prev,
          ].slice(0, 20)
        );
      }
    }, handleError);

    return ws; // ws is already the cleanup function
  }, [activeCrewId, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isNotificationMenuOpen && notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setIsNotificationMenuOpen(false);
      }
      if (isProfileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (isWorkspaceMenuOpen && workspaceMenuRef.current && !workspaceMenuRef.current.contains(target)) {
        setIsWorkspaceMenuOpen(false);
      }
      if (isWalletMenuOpen && walletMenuRef.current && !walletMenuRef.current.contains(target)) {
        setIsWalletMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationMenuOpen, isProfileMenuOpen, isWorkspaceMenuOpen, isWalletMenuOpen]);

  const unreadCount = useMemo(
    () => notifications.reduce((total, item) => (item.unread ? total + 1 : total), 0),
    [notifications]
  );

  const activePresence = PRESENCE_OPTIONS.find((option) => option.id === presenceStatus) ?? PRESENCE_OPTIONS[0];
  const profileInitials = getInitials(profile.name);
  const pushRunEvent = useCallback((type: RunLogEvent['type'], text: string) => {
    setRunEvents((prev) => {
      const entry: RunLogEvent = {
        id: makeId(),
        type,
        text,
        createdAt: Date.now(),
      };
      const next = [entry, ...prev];
      return next.slice(0, 50);
    });
  }, []);

  const handleSendMessage = async (raw: string) => {
    const content = raw.trim();
    if (!content || isResponding) return;

    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setRunEvents([]);
    pushRunEvent('log', `Prompt dispatched: ${content}`);
    setIsResponding(true);
    setMissionStatus('busy');
    setPresenceStatus('busy');

    try {
      let runId: string;
      
      // Determine the mode based on chatMode flag
      const mode = chatMode ? 'chat' : 'tool';
      
      // Use Full-Stack crew if selected, otherwise standard crew
      if (crewType === 'fullstack') {
        pushRunEvent('log', `🚀 Starting Full-Stack SaaS Crew (${chatMode ? 'Chat Mode' : 'Orchestrator Mode'})...`);
        const result = await runFullStackCrew(content);
        runId = result.id;
      } else {
        pushRunEvent('log', `Starting run in ${chatMode ? 'Chat' : 'Orchestrator'} mode...`);
        const result = await createRun({ crew_id: activeCrewId, prompt: content, mode });
        runId = result.id;
      }
      
      setCurrentRunId(runId);
      setMessages((prev) => [...prev, { id: runId, role: 'assistant', content: '' }]);

      if (streamCloseRef.current) {
        streamCloseRef.current();
        streamCloseRef.current = null;
      }

      const close = streamRun(runId, (event: StreamEvent) => {
        if (event.type === 'token') {
          setMessages((prev) => {
            const index = prev.findIndex((message) => message.id === runId);
            if (index === -1) {
              return [...prev, { id: runId, role: 'assistant', content: event.data }];
            }
            const next = [...prev];
            next[index] = { ...next[index], content: next[index].content + event.data };
            return next;
          });
          return;
        }

        if (event.type === 'message') {
          pushRunEvent('log', formatEventData(event.data));
          return;
        }

        if (event.type === 'tool' || event.type === 'metric' || event.type === 'log') {
          pushRunEvent(event.type, formatEventData(event.data));
          return;
        }

        if (event.type === 'error') {
          pushRunEvent('error', formatEventData(event.data));
          setIsResponding(false);
          setMissionStatus('offline');
          setPresenceStatus('offline');
          setCurrentRunId(null);
          if (streamCloseRef.current) {
            streamCloseRef.current();
            streamCloseRef.current = null;
          }
          return;
        }

        if (event.type === 'done') {
          pushRunEvent('done', 'Run complete.');
          setIsResponding(false);
          setMissionStatus('available');
          setPresenceStatus('available');
          setCurrentRunId(null);
          if (streamCloseRef.current) {
            streamCloseRef.current();
            streamCloseRef.current = null;
          }
        }
      });

      streamCloseRef.current = close;
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unable to start mission run.';
      pushRunEvent('error', messageText);
      setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: messageText }]);
      setIsResponding(false);
      setMissionStatus('available');
      setPresenceStatus('available');
    }
  };

  const handleMessageAction = (action: 'copy' | 'share' | 'regenerate', message: Message) => {
    if (action === 'regenerate') {
      setPrefilledPrompt(message.content);
      return;
    }

    const nav: Navigator | undefined = typeof window === 'undefined' ? undefined : window.navigator;

    if (action === 'copy') {
      if (nav?.clipboard?.writeText) {
        void nav.clipboard.writeText(message.content).catch((error) => {
          console.warn('Copy failed', error);
        });
      }
      return;
    }

    if (nav && 'share' in nav) {
      const shareNavigator = nav as Navigator & { share: (data: { text: string }) => Promise<void> };
      void shareNavigator.share({ text: message.content }).catch((error) => {
        console.warn('Share failed', error);
      });
      return;
    }

    if (nav?.clipboard?.writeText) {
      void nav.clipboard.writeText(message.content).catch((error) => {
        console.warn('Copy fallback failed', error);
      });
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const handleStatusChange = (status: PresenceStatus) => {
    setPresenceStatus(status);
    setIsProfileMenuOpen(false);
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setIsWorkspaceMenuOpen(false);
    setIsNotificationMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleCreateWorkspace = () => {
    setIsWorkspaceMenuOpen(false);
    console.info('Create workspace flow triggered');
  };

  const renderMainPanel = () => {
    if (activeSection === 'chat') {
      return advancedMode ? (
        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          <ChatSurface
            messages={messages}
            isResponding={isResponding}
            prefilledPrompt={prefilledPrompt}
            onPrefillConsumed={() => setPrefilledPrompt(null)}
            onSendMessage={handleSendMessage}
            onMessageAction={handleMessageAction}
            crewType={crewType}
            setCrewType={setCrewType}
            advancedMode={advancedMode}
            onToggleAdvancedMode={() => setAdvancedMode((prev) => !prev)}
            chatMode={chatMode}
            onToggleChatMode={() => setChatMode((prev) => !prev)}
          />
          <AgentGraph
            crewId={activeCrewId}
            runId={currentRunId}
            visible={advancedMode}
          />
        </div>
      ) : (
        <ChatSurface
          messages={messages}
          isResponding={isResponding}
          prefilledPrompt={prefilledPrompt}
          onPrefillConsumed={() => setPrefilledPrompt(null)}
          onSendMessage={handleSendMessage}
          onMessageAction={handleMessageAction}
          crewType={crewType}
          setCrewType={setCrewType}
          advancedMode={advancedMode}
          onToggleAdvancedMode={() => setAdvancedMode((prev) => !prev)}
          chatMode={chatMode}
          onToggleChatMode={() => setChatMode((prev) => !prev)}
        />
      );
    }

    if (activeSection === 'dashboard') {
      return <Dashboard crew={activeCrew} missionStatus={missionStatus} runEvents={runEvents} />;
    }

    if (activeSection === 'marketplace') {
      return <MarketplacePage />;
    }

    if (activeSection === 'missionlab') {
      return <MissionLabPage />;
    }

    if (activeSection === 'settings') {
      return <SettingsPanel />;
    }

    if (activeSection === 'workspace') {
      return <WorkspaceManager />;
    }

    const descriptions: Record<Section, string> = {
      chat: 'Chat surface rendering happens here.',
      dashboard: '',
      projects: 'Projects detail pages with run, artifact, and memory tabs will live here.',
      collections: 'Vector collections list and detail drawers are coming soon.',
      workspace: 'Workspace canvas with file tree, viewers, and context panel is on the roadmap.',
      marketplace: 'Marketplace catalog of crew templates will appear here.',
      missionlab: '',
      crews: 'Crew editor, member assignments, and orchestrations will land here.',
      runs: 'Runs feed, filters, and rerun actions will be added here.',
      settings: '',
    };

    return <SectionPlaceholder title={activeSection} description={descriptions[activeSection]} />;
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-gradient-to-br from-[#1e2635] via-[#283347] to-[#2f3d52] text-[#f8fafc]">
      <ShellSidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        isExpanded={isSidebarExpanded}
        onHoverChange={setIsSidebarExpanded}
      />
      <main
        className={classNames(
          'relative flex-1 flex flex-col px-5 py-6 md:px-10 md:py-8 lg:px-16 overflow-visible transition-[filter,opacity] duration-200 ease-out',
          isSidebarExpanded ? 'filter blur-sm opacity-70' : 'filter-none opacity-100'
        )}
      >
        <ShellHeader
          profile={profile}
          profileInitials={profileInitials}
          presence={activePresence}
          presenceStatus={presenceStatus}
          locationLabel={timeZoneInfo.label}
          localTime={localTime}
          messageCount={messages.length}
          unreadCount={unreadCount}
          notifications={notifications}
          workspace={activeWorkspace}
          workspaces={WORKSPACE_OPTIONS}
          orchestratorAgent={orchestratorAgent}
          crewMembers={crewMembers}
          activeCrew={activeCrew}
          crews={crews}
          onSelectCrew={setActiveCrewId}
          onToggleNotifications={() => {
            setIsNotificationMenuOpen((prev) => !prev);
            setIsProfileMenuOpen(false);
            setIsWorkspaceMenuOpen(false);
            setIsWalletMenuOpen(false);
          }}
          onToggleProfile={() => {
            setIsProfileMenuOpen((prev) => !prev);
            setIsNotificationMenuOpen(false);
            setIsWorkspaceMenuOpen(false);
            setIsWalletMenuOpen(false);
          }}
          onToggleWorkspace={() => {
            setIsWorkspaceMenuOpen((prev) => !prev);
            setIsNotificationMenuOpen(false);
            setIsProfileMenuOpen(false);
            setIsWalletMenuOpen(false);
          }}
          onToggleWallet={() => {
            setIsWalletMenuOpen((prev) => !prev);
            setIsNotificationMenuOpen(false);
            setIsProfileMenuOpen(false);
            setIsWorkspaceMenuOpen(false);
          }}
          onMarkAllRead={handleMarkAllRead}
          onStatusChange={handleStatusChange}
          onGoToSettings={() => onNavigate('settings')}
          onSignOut={onSignOut}
          notificationMenuRef={notificationMenuRef}
          profileMenuRef={profileMenuRef}
          workspaceMenuRef={workspaceMenuRef}
          walletMenuRef={walletMenuRef}
          isNotificationMenuOpen={isNotificationMenuOpen}
          isProfileMenuOpen={isProfileMenuOpen}
          isWorkspaceMenuOpen={isWorkspaceMenuOpen}
          isWalletMenuOpen={isWalletMenuOpen}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          activeSection={activeSection}
          advancedMode={advancedMode}
          onToggleAdvancedMode={() => setAdvancedMode((prev) => !prev)}
        />
        <section className={`relative z-10 mt-2 flex-1 flex ${activeSection === 'chat' ? 'flex-col' : 'overflow-y-auto'} rounded-3xl bg-slate-900/60 shadow-[0_25px_60px_rgba(0,0,0,0.4)]`}>
          <div className={activeSection === 'chat' ? 'flex-1 flex flex-col min-h-0' : 'flex-col'}>
            {renderMainPanel()}
          </div>
        </section>
      </main>
    </div>
  );
};

type ShellSidebarProps = {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  onSignOut: () => void;
  isExpanded: boolean;
  onHoverChange: (expanded: boolean) => void;
};

const ShellSidebar: React.FC<ShellSidebarProps> = ({ activeSection, onNavigate, onSignOut, isExpanded, onHoverChange }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;

    remove(sidebarRef.current);
    animate(sidebarRef.current, {
      width: isExpanded ? 240 : 64,
      duration: 200,
      easing: 'easeOutQuad',
    });

    if (navRef.current) {
      const navItems = navRef.current.querySelectorAll('button');
      remove(navItems);
      animate(navItems, {
        opacity: [0.7, 1],
        scale: [0.98, 1],
        duration: 150,
        delay: stagger(20),
        easing: 'easeOutQuad',
      });
    }
  }, [isExpanded]);

  return (
    <aside
      ref={sidebarRef}
      className="hidden sm:flex flex-col justify-between bg-[#0a0e14] text-white shadow-[4px_0_16px_rgba(0,0,0,0.3)] py-6 border-r border-white/5"
      style={{ width: isExpanded ? 240 : 64 }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="flex flex-col gap-6" style={{ alignItems: isExpanded ? 'stretch' : 'center', paddingLeft: isExpanded ? 16 : 8, paddingRight: isExpanded ? 16 : 8 }}>
        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className="relative flex items-center rounded-2xl font-semibold shadow-md"
          style={{
            gap: isExpanded ? 12 : 0,
            border: '1px solid rgba(234, 35, 35, 0.3)',
            background: 'rgba(234, 35, 35, 0.1)',
            padding: isExpanded ? '10px 14px' : '10px',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            width: isExpanded ? '100%' : 40,
            height: 40,
            color: '#fff',
            fontSize: isExpanded ? 14 : 0,
          }}
        >
          <ChatBubbleIcon className="h-5 w-5 shrink-0" />
          {isExpanded && <span className="truncate">Command</span>}
        </button>
        
        <nav ref={navRef} className="flex flex-col gap-2" style={{ alignItems: isExpanded ? 'stretch' : 'center' }}>
          {([
            { id: 'dashboard', label: 'Dashboard', icon: AnalyticsIcon },
            { id: 'projects', label: 'Projects', icon: FolderIcon },
            { id: 'collections', label: 'Collections', icon: LayersIcon },
            { id: 'workspace', label: 'Workspace', icon: GridIcon },
            { id: 'marketplace', label: 'Marketplace', icon: StoreIcon },
            { id: 'missionlab', label: 'Mission Lab', icon: WorkflowIcon },
            { id: 'crews', label: 'Crews', icon: WorkflowIcon },
            { id: 'runs', label: 'Runs', icon: RefreshIcon },
          ] as Array<{ id: Section; label: string; icon: React.FC<IconProps> }>).map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="flex items-center rounded-xl"
                style={{
                  gap: isExpanded ? 12 : 0,
                  padding: isExpanded ? '10px 14px' : '10px',
                  fontSize: 14,
                  fontWeight: 500,
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  width: isExpanded ? '100%' : 36,
                  height: 36,
                  background: isActive ? 'rgba(234, 35, 35, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(234, 35, 35, 0.3)' : '1px solid transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div ref={bottomRef} className="flex flex-col gap-3" style={{ alignItems: isExpanded ? 'stretch' : 'center', paddingLeft: isExpanded ? 16 : 8, paddingRight: isExpanded ? 16 : 8 }}>
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="flex items-center rounded-xl"
          style={{
            gap: isExpanded ? 12 : 0,
            padding: isExpanded ? '10px 14px' : '10px',
            fontSize: 14,
            fontWeight: 600,
            justifyContent: isExpanded ? 'flex-start' : 'center',
            width: isExpanded ? '100%' : 40,
            height: 40,
            border: activeSection === 'settings' ? '1px solid rgba(234, 35, 35, 0.4)' : '1px solid rgba(255,255,255,0.08)',
            background: activeSection === 'settings' ? 'rgba(234, 35, 35, 0.15)' : 'rgba(26, 35, 50, 0.6)',
            color: activeSection === 'settings' ? '#ea2323' : 'rgba(255,255,255,0.75)',
          }}
        >
          <GearIcon className="h-5 w-5 shrink-0" />
          {isExpanded && <span className="truncate">Settings</span>}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center rounded-xl"
          style={{
            gap: isExpanded ? 12 : 0,
            padding: isExpanded ? '10px 14px' : '10px',
            fontSize: 14,
            fontWeight: 600,
            justifyContent: isExpanded ? 'flex-start' : 'center',
            width: isExpanded ? '100%' : 40,
            height: 40,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(26, 35, 50, 0.6)',
            color: '#ea2323',
          }}
        >
          <LogOutIcon className="h-5 w-5 shrink-0" />
          {isExpanded && <span className="truncate">Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

type ShellHeaderProps = {
  profile: { name: string; role: string; timezone: string; avatar: string };
  profileInitials: string;
  presence: { label: string; dotClass: string };
  presenceStatus: PresenceStatus;
  locationLabel: string;
  localTime: string;
  messageCount: number;
  unreadCount: number;
  notifications: NotificationItem[];
  workspace: { id: string; name: string };
  workspaces: Array<{ id: string; name: string }>;
  orchestratorAgent: AgentKey;
  crewMembers: AgentKey[];
  activeCrew: Crew | null;
  crews: Crew[];
  onSelectCrew: (crewId: string) => void;
  onToggleNotifications: () => void;
  onToggleProfile: () => void;
  onToggleWorkspace: () => void;
  onMarkAllRead: () => void;
  onStatusChange: (status: PresenceStatus) => void;
  onGoToSettings: () => void;
  onSignOut: () => void;
  notificationMenuRef: React.RefObject<HTMLDivElement>;
  profileMenuRef: React.RefObject<HTMLDivElement>;
  workspaceMenuRef: React.RefObject<HTMLDivElement>;
  walletMenuRef: React.RefObject<HTMLDivElement>;
  isNotificationMenuOpen: boolean;
  isProfileMenuOpen: boolean;
  isWorkspaceMenuOpen: boolean;
  isWalletMenuOpen: boolean;
  onToggleWallet: () => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
  activeSection: Section;
  advancedMode?: boolean;
  onToggleAdvancedMode?: () => void;
};

const ShellHeader: React.FC<ShellHeaderProps> = ({
  profile,
  profileInitials,
  presence,
  presenceStatus,
  locationLabel,
  localTime,
  messageCount,
  unreadCount,
  notifications,
  workspace,
  workspaces,
  orchestratorAgent,
  crewMembers,
  activeCrew,
  crews,
  onSelectCrew,
  onToggleNotifications,
  onToggleProfile,
  onToggleWorkspace,
  onToggleWallet,
  onMarkAllRead,
  onStatusChange,
  onGoToSettings,
  onSignOut,
  notificationMenuRef,
  profileMenuRef,
  workspaceMenuRef,
  walletMenuRef,
  isNotificationMenuOpen,
  isProfileMenuOpen,
  isWorkspaceMenuOpen,
  isWalletMenuOpen,
  onSelectWorkspace,
  onCreateWorkspace,
  activeSection,
  advancedMode = false,
  onToggleAdvancedMode,
}) => {
  const [isCrewMenuOpen, setIsCrewMenuOpen] = useState(false);
  const crewMenuRef = useRef<HTMLDivElement | null>(null);
  const crewPreview = crewMembers.slice(0, 4);
  const overflowCount = Math.max(crewMembers.length - crewPreview.length, 0);

  return (
    <header className="relative z-40 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-[#acb6cf]">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-[#9ba7c2]">Mission signal</span>
          <span className={classNames('flex h-2.5 w-2.5 rounded-full', presence.dotClass)} aria-hidden="true" />
          <span>{presence.label}</span>
          <span className="text-[#4f576d]">•</span>
          <span>Operating from {locationLabel} • {localTime}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Lead Orchestrator with Crew */}
          <div className="inline-flex items-center gap-2 text-xs text-[#acb6cf]">
            <AgentLottie id={orchestratorAgent} size={32} />
            <span className="font-medium">Lead orchestrator from</span>
            <div ref={crewMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsCrewMenuOpen((prev) => !prev)}
                className="group inline-flex items-center gap-1.5 text-white font-semibold transition hover:text-[#ea2323]"
                aria-haspopup="menu"
                aria-expanded={isCrewMenuOpen}
              >
                <span>{activeCrew?.name ?? 'Select Crew'}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-[#7c859f] transition group-hover:text-[#ea2323]" />
              </button>
              
              {isCrewMenuOpen && (
                <div className="absolute left-0 mt-3 w-80 rounded-3xl border border-white/15 bg-[#1e2635] shadow-[0_24px_70px_rgba(0,0,0,0.5)] z-50">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#7c859f]">Select Crew</p>
                  </div>
                  <ul className="max-h-72 overflow-y-auto py-2">
                    {crews.length === 0 ? (
                      <li className="px-5 py-6 text-center text-xs text-[#7c859f]">No crews available</li>
                    ) : (
                      crews.map((crew) => (
                        <li key={crew.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCrew(crew.id);
                              setIsCrewMenuOpen(false);
                            }}
                            className={classNames(
                              'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition mx-2',
                              crew.id === activeCrew?.id
                                ? 'border-[#ea2323]/60 bg-[#ea2323]/10 text-white shadow-[0_12px_32px_rgba(234,35,35,0.25)]'
                                : 'border-transparent text-[#d5d8e4] hover:border-white/10 hover:bg-white/5'
                            )}
                          >
                            <div className="flex-1">
                              <span className="font-semibold block">{crew.name}</span>
                              <span className="text-xs text-white/50">{crew.role ?? 'Multi-purpose'}</span>
                            </div>
                            {crew.id === activeCrew?.id && (
                              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#ea2323]">Active</span>
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <span className="text-[#4f576d]">•</span>
          
          {/* Crew Rotation */}
          <div className="inline-flex items-center gap-2 text-xs text-[#acb6cf]">
            <span className="font-medium">Crew rotation</span>
            <div className="flex items-center gap-1">
              {crewPreview.map((agent) => (
                <div
                  key={agent}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0d1523] shadow-[0_4px_12px_rgba(6,8,12,0.35)]"
                >
                  <AgentIcon id={agent} size={24} idle />
                </div>
              ))}
              {overflowCount > 0 ? (
                <span className="ml-1 text-[0.65rem] font-semibold text-white/80">+{overflowCount}</span>
              ) : null}
            </div>
          </div>
          
          <span className="text-[#4f576d]">•</span>
          
          {/* Status Message */}
          <div className="inline-flex items-center gap-2 text-xs text-[#acb6cf]">
            <SparkIcon className="h-4 w-4 text-[#ea2323]" />
            <span className="font-medium">{messageCount ? `${messageCount} transmissions logged` : 'Awaiting first command'}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-end gap-2 self-start lg:gap-3">
      {/* Token Balance Dropdown */}
      <div ref={walletMenuRef} className="relative">
        <button
          type="button"
          onClick={onToggleWallet}
          className="relative inline-flex h-10 items-center gap-2 px-4 rounded-full border border-white/15 bg-[#1e2635] shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition hover:border-[#ea2323]/60"
          aria-label="Wallet"
          aria-expanded={isWalletMenuOpen}
        >
          <div className="w-5 h-5 bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] rounded-full flex items-center justify-center text-[0.6rem] font-bold">
            C7
          </div>
          <span className="text-sm font-semibold text-white">0.00 C7T</span>
        </button>
        {isWalletMenuOpen ? (
          <div className="absolute right-0 mt-3 w-96 rounded-3xl border border-white/15 bg-[#1e2635] shadow-[0_24px_70px_rgba(0,0,0,0.5)] z-50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] rounded-full flex items-center justify-center font-bold shadow-lg">
                  C7
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">C7T Wallet</p>
                  <p className="text-xs text-[#9ea6bd]">Crew-7 Utility Token</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-sm text-[#9ea6bd]">Your Balance</span>
                <span className="text-lg font-bold text-white">0.00 C7T</span>
              </div>
              
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center rounded-2xl border border-[#ea2323]/60 bg-[#ea2323]/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#ea2323] hover:bg-[#ea2323]/20 shadow-[0_12px_32px_rgba(234,35,35,0.25)]"
                >
                  Top Up Credits
                </button>
                
                <div className="w-full">
                  <WalletConnect />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-[#9ea6bd]">
                <p className="font-semibold text-white text-sm mb-2">How to use C7T:</p>
                <div className="flex items-start gap-2">
                  <span className="text-[#ea2323]">•</span>
                  <span>Rent AI crews from the marketplace</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#ea2323]">•</span>
                  <span>Purchase crews for permanent ownership</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#ea2323]">•</span>
                  <span>Earn tokens by renting out your crews</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#ea2323]">•</span>
                  <span>Level up crews and gain XP</span>
                </div>
              </div>
              
              <div className="text-xs text-[#7c859f] text-center pt-2 border-t border-white/10">
                Running in test mode
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      <div ref={notificationMenuRef} className="relative">
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#1e2635]/90 text-[#acb6cf] shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm transition hover:border-[#ea2323]/60 hover:text-white"
          aria-label="Notifications"
          aria-expanded={isNotificationMenuOpen}
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ea2323] px-1 text-[0.65rem] font-semibold text-white shadow-[0_0_10px_rgba(234,35,35,0.55)]">
              {unreadCount}
            </span>
          ) : null}
        </button>
        {isNotificationMenuOpen ? (
          <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-white/15 bg-[#1e2635]/95 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#7c859f]">Signal feed</p>
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={!unreadCount}
                className={classNames(
                  'text-[0.65rem] font-semibold uppercase tracking-[0.2em] transition',
                  unreadCount ? 'text-[#ea2323] hover:text-[#c81f1f]' : 'text-[#3f4556] cursor-default'
                )}
              >
                Mark all read
              </button>
            </div>
            <ul className="max-h-72 overflow-y-auto py-1">
              {notifications.length === 0 ? (
                <li className="px-5 py-6 text-center text-xs text-[#7c859f]">Signal feed is clear.</li>
              ) : (
                notifications.map((item) => {
                  const variant = NOTIFICATION_VARIANT_STYLES[item.variant];
                  return (
                    <li
                      key={item.id}
                      className={classNames(
                        'flex gap-3 px-5 py-3 transition',
                        item.unread ? 'bg-white/6' : 'bg-transparent'
                      )}
                    >
                      <span className={classNames('mt-1 h-2.5 w-2.5 rounded-full', variant.dotClass)} aria-hidden="true" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#7c859f]">{item.timestamp}</span>
                        </div>
                        {item.description ? (
                          <p className="text-xs text-[#9ea6bd]">{item.description}</p>
                        ) : null}
                        <span className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#7c859f]">
                          {variant.label}
                        </span>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
      <div ref={workspaceMenuRef} className="relative">
        <button
          type="button"
          onClick={onToggleWorkspace}
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#1e2635] shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition-all hover:border-[#ea2323]/60 hover:w-auto hover:px-4 hover:gap-2"
          aria-haspopup="menu"
          aria-expanded={isWorkspaceMenuOpen}
        >
          <span className="inline-flex items-center justify-center text-[#ea2323]">
            <WorkspaceIcon className="h-5 w-5" />
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100 flex items-center gap-2 text-sm font-semibold text-white">
            {workspace.name}
            <ChevronDownIcon className="h-4 w-4 text-[#7c859f]" />
          </span>
        </button>
        {isWorkspaceMenuOpen ? (
          <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-white/15 bg-[#1e2635] shadow-[0_24px_70px_rgba(0,0,0,0.5)] z-50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#7c859f]">Workspaces</p>
            </div>
            <ul className="max-h-72 overflow-y-auto py-2">
              {workspaces.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => onSelectWorkspace(option.id)}
                    className={classNames(
                      'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition',
                      option.id === workspace.id
                        ? 'border-[#ea2323]/60 bg-[#ea2323]/10 text-white shadow-[0_12px_32px_rgba(234,35,35,0.25)]'
                        : 'border-transparent text-[#d5d8e4] hover:border-white/10 hover:bg-white/5'
                    )}
                  >
                    <span className="font-semibold">{option.name}</span>
                    {option.id === workspace.id ? (
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#ea2323]">Active</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 px-5 py-3">
              <button
                type="button"
                onClick={onCreateWorkspace}
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#ea2323]/70 hover:bg-[#ea2323]/10"
              >
                Create a new workspace
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div ref={profileMenuRef} className="relative">
        <button
          type="button"
          onClick={onToggleProfile}
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#1e2635] shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition-all hover:border-[#ea2323]/60 hover:w-auto hover:px-4 hover:gap-2 overflow-hidden"
          aria-haspopup="menu"
          aria-expanded={isProfileMenuOpen}
        >
          <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ea2323] via-[#f26464] to-[#f2a45c] text-sm font-semibold uppercase flex-shrink-0">
            <span className="relative z-10 text-white">{profileInitials}</span>
            <span className={classNames('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0e1626]', presence.dotClass)} aria-hidden="true" />
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100 flex items-center gap-2 text-sm font-semibold text-white">
            {profile.name}
            <ChevronDownIcon className="h-4 w-4 text-[#7c859f]" />
          </span>
        </button>
        {isProfileMenuOpen ? (
          <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-white/15 bg-[#1e2635] shadow-[0_24px_70px_rgba(0,0,0,0.5)] z-50">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ea2323] via-[#f26464] to-[#f2a45c] text-base font-semibold uppercase">
                <span className="relative z-10 text-white">{profileInitials}</span>
                <span className={classNames('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0e1626]', presence.dotClass)} aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{profile.name}</p>
                <p className="text-xs text-[#9ea6bd]">{profile.role}</p>
                <p className="text-xs text-[#7c859f]">{profile.timezone}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#7c859f]">Set status</p>
              <ul className="mt-3 space-y-2">
                {PRESENCE_OPTIONS.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => onStatusChange(option.id)}
                      className={classNames(
                        'flex w-full items-start gap-3 rounded-2xl border px-3 py-2 text-left transition',
                        option.id === presenceStatus
                          ? 'border-[#ea2323]/70 bg-[#ea2323]/10 text-white shadow-[0_12px_32px_rgba(234,35,35,0.25)]'
                          : 'border-white/0 text-[#d5d8e4] hover:border-white/10 hover:bg-white/5'
                      )}
                    >
                      <span className={classNames('mt-1 h-2.5 w-2.5 rounded-full', option.dotClass)} aria-hidden="true" />
                      <span className="flex-1">
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className="mt-1 block text-xs text-[#8d96b3]">{option.description}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={onGoToSettings}
                className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-[#ea2323]/70 hover:bg-[#ea2323]/10"
              >
                Profile & Settings
                <ArrowIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm font-semibold text-[#ea2323] transition hover:border-[#ea2323]/70 hover:bg-[#ea2323]/10"
              >
                Switch account
                <LogOutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
    </header>
  );
};

type ChatSurfaceProps = {
  messages: Message[];
  isResponding: boolean;
  prefilledPrompt: string | null;
  onPrefillConsumed: () => void;
  onSendMessage: (message: string) => void;
  onMessageAction: (action: 'copy' | 'share' | 'regenerate', message: Message) => void;
  crewType: 'standard' | 'fullstack';
  setCrewType: (type: 'standard' | 'fullstack') => void;
  advancedMode?: boolean;
  onToggleAdvancedMode?: () => void;
  chatMode?: boolean;
  onToggleChatMode?: () => void;
};

const ChatSurface: React.FC<ChatSurfaceProps> = ({
  messages,
  isResponding,
  prefilledPrompt,
  onPrefillConsumed,
  onSendMessage,
  onMessageAction,
  crewType,
  setCrewType,
  advancedMode = false,
  onToggleAdvancedMode,
  chatMode = false,
  onToggleChatMode,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isResponding]);

  return (
  <section className="flex h-full min-h-0 flex-1 flex-col">
    {/* Scrollable messages area */}
    <div className="flex-1 overflow-y-auto px-5 pt-5 md:px-8" style={{ scrollbarGutter: 'stable' }}>
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center text-sm md:text-base text-[#acb6cf]">
          Drop your first directive to light up the command feed.
        </div>
      ) : (
        <ul className="space-y-4 pb-6">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <li key={message.id} className={classNames('flex', isUser ? 'justify-end' : 'justify-start')}>
                <div className="max-w-[80%] space-y-2">
                  <div
                    className={classNames(
                      'rounded-2xl px-4 py-3 text-xs md:text-sm transition whitespace-pre-wrap',
                      isUser
                        ? 'bg-[#ea2323] text-white'
                        : 'bg-slate-900/80 text-[#f8fafc]'
                    )}
                  >
                    {message.content}
                  </div>
                  <div className={classNames('hidden gap-2 sm:flex', isUser ? 'justify-end' : 'justify-start')}>
                    <button
                      type="button"
                      onClick={() => onMessageAction('share', message)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-[#acb6cf] transition hover:bg-[#ea2323]/20 hover:text-white"
                      aria-label="Share message"
                    >
                      <ShareIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMessageAction('copy', message)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-[#acb6cf] transition hover:bg-[#ea2323]/20 hover:text-white"
                      aria-label="Copy message"
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMessageAction('regenerate', message)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-[#acb6cf] transition hover:bg-[#ea2323]/20 hover:text-white"
                      aria-label="Regenerate message"
                    >
                      <ReplayIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {isResponding ? (
            <li className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-[#f8fafc]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#ea2323]" aria-hidden="true" />
                  Thinking...
                </div>
              </div>
            </li>
          ) : null}
        </ul>
      )}
      
      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
    
    {/* Sticky input at bottom */}
    <div className="shrink-0 border-t border-white/10 bg-[#1e2635]/95 backdrop-blur-sm px-5 py-3 md:px-8">
      <ChatInput
        isSending={isResponding}
        onSendMessage={onSendMessage}
        prefilledPrompt={prefilledPrompt ?? undefined}
        onPrefillConsumed={onPrefillConsumed}
        advancedMode={advancedMode}
        onToggleAdvancedMode={onToggleAdvancedMode}
        chatMode={chatMode}
        onToggleChatMode={onToggleChatMode}
      />
    </div>
  </section>
  );
};

type SectionPlaceholderProps = {
  title: string;
  description: string;
};

const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({ title, description }) => (
  <div className="flex-1 flex flex-col">
    <div className="border-b border-white/10 px-6 py-4">
      <h2 className="text-lg font-semibold text-white capitalize">{title}</h2>
    </div>
    <div className="flex-1 px-6 py-6 text-sm text-[#c0c6d8]">
      {description || 'Module scaffold coming soon.'}
    </div>
  </div>
);

const HighlightCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 shadow-sm">
    <p className="text-sm font-semibold text-[#ea2323]">{title}</p>
    <p className="mt-1 text-xs text-[#cbd4e6]">{description}</p>
  </div>
);

type IconProps = {
  className?: string;
};

function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5h-4.2L7 20v-3.5" />
      <path d="M9 11h.01" />
      <path d="M12 11h.01" />
      <path d="M15 11h.01" />
    </svg>
  );
}

function LogOutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15.75 7.75 20 12l-4.25 4.25" />
      <path d="M9 12h11" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

function RefreshIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 16 8.5 9.5 13 14l3.5-6L20 18" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <circle cx="13" cy="14" r="1.5" />
      <circle cx="16.5" cy="8" r="1.5" />
    </svg>
  );
}

function ShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 9h16" />
      <path d="M5.5 9 7 4.5A1.5 1.5 0 0 1 8.4 3.5h7.2A1.5 1.5 0 0 1 17 4.5L18.5 9" />
  <rect x="4" y="9" width="16" height="11" rx="2" fill="none" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function CopyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="12" height="14" x="8" y="7" rx="2" ry="2" />
      <path d="M16 3H6a2 2 0 0 0-2 2v12" />
    </svg>
  );
}

function ReplayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 1 9 9" />
      <path d="M3 12 6 9" />
      <path d="M3 12 6 15" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M9 20a3 3 0 0 0 6 0" />
    </svg>
  );
}

function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="none" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" fill="none" />
      <rect x="13.5" y="10.5" width="7" height="7" rx="1.5" fill="none" />
      <rect x="3.5" y="12.5" width="7" height="8" rx="1.5" fill="none" />
    </svg>
  );
}

function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20v-6" />
      <path d="M8 20v-4" />
      <path d="M12 20V8" />
      <path d="M16 20V5" />
      <path d="M20 20v-9" />
      <path d="M4 13 8.2 9.8 12 11l4-6 4 3" />
    </svg>
  );
}

function LayersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 11c0 1.66 3.13 3 7 3s7-1.34 7-3" />
      <path d="M5 16c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
    </svg>
  );
}

function FolderIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 11h18" />
    </svg>
  );
}

function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
      <path d="M20.4 13a1.65 1.65 0 0 0 .33-1 1.65 1.65 0 0 0-.33-1l-1.07-1.85a1.65 1.65 0 0 0-.8-.69l-1.94-.78a1.65 1.65 0 0 1-1-1l-.28-1.12A1.65 1.65 0 0 0 13.29 4h-2.58A1.65 1.65 0 0 0 9.14 5.56l-.28 1.12a1.65 1.65 0 0 1-1 1l-1.94.78a1.65 1.65 0 0 0-.8.69L4.05 11a1.65 1.65 0 0 0 0 2l1.07 1.85a1.65 1.65 0 0 0 .8.69l1.94.78a1.65 1.65 0 0 1 1 1l.28 1.12A1.65 1.65 0 0 0 10.71 20h2.58a1.65 1.65 0 0 0 1.57-1.56l.28-1.12a1.65 1.65 0 0 1 1-1l1.94-.78a1.65 1.65 0 0 0 .8-.69Z" />
    </svg>
  );
}

function WorkflowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7" cy="5" r="2.5" />
      <circle cx="17" cy="5" r="2.5" />
      <circle cx="7" cy="19" r="2.5" />
      <circle cx="17" cy="19" r="2.5" />
      <path d="M7 7.5V11h10V7.5" />
      <path d="M7 16.5V13h10v3.5" />
    </svg>
  );
}

function StoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7h16l-1.2 9.6a2 2 0 0 1-2 1.4H7.2a2 2 0 0 1-2-1.4Z" />
      <path d="M5 7l1.5-2.5A2 2 0 0 1 8.3 3h7.4a2 2 0 0 1 1.8 1.5L19 7" />
      <path d="M9 11v3" />
      <path d="M15 11v3" />
      <path d="M8 19v2" />
      <path d="M16 19v2" />
    </svg>
  );
}

function WorkspaceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M3.5 9h3.4a6 6 0 0 1 10.2 0h3.4" />
      <path d="M3 15h3.2a6 6 0 0 0 11.6 0H21" />
    </svg>
  );
}

const ArrowIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export default App;
