import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatInput from './components/ChatInput';
import Dashboard, { type RunLogEvent } from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import { AgentIcon, AgentKey } from './components/AgentIcon';
import { AgentLottie } from './components/AgentLottie';
import { Crew7Logo, AuthLogo } from './components/Crew7Logo';
import { AgentGraph } from './components/graph/AgentGraph';
import LandingPage from './pages/LandingPage';
import { crewSet, idForRole, AGENT_IDS } from './roles/avatar-utils';
import './styles/crew7.css';
import './styles/design-system.css';
import './styles/landing-page-enhanced.css';
import {
  createRun,
  getCrew,
  getMe,
  missionSocket,
  streamRun,
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

const DEFAULT_AVATAR = 'https://ik.imagekit.io/demo/img/image1.jpeg';

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

const NOTIFICATION_SEED: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Crew deployment succeeded',
    description: 'Synced changes across 4 nodes without conflicts.',
    timestamp: '2m',
    variant: 'success',
    unread: true,
  },
  {
    id: 'n2',
    title: 'New marketplace templates',
    description: 'Three vetted crew templates are now available.',
    timestamp: '1h',
    variant: 'info',
  },
  {
    id: 'n3',
    title: 'Token usage trending up',
    description: 'Watch your daily budget across projects.',
    timestamp: '3h',
    variant: 'warning',
    unread: true,
  },
];

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
  const [view, setView] = useState<'landing' | 'auth' | 'shell'>('landing');
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

  if (view === 'landing') {
    return <LandingPage />;
  }

  if (view === 'auth') {
    return <AuthScreen onAuthenticated={() => setView('shell')} />;
  }

  return (
    <ApplicationShell
      activeSection={activeSection}
      onNavigate={setActiveSection}
      onSignOut={() => setView('auth')}
    />
  );
};

type AuthScreenProps = {
  onAuthenticated: () => void;
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const isSignUp = mode === 'signUp';
  const canSubmit = formData.email.trim() && formData.password.trim() && (!isSignUp || formData.name.trim());

  const handleChange = (field: 'name' | 'email' | 'password') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onAuthenticated();
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#1a1f2e] via-[#232b3d] to-[#2d3748] text-[#f0f3f9]">
      <div className="relative flex h-full w-full items-center justify-center px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#ea2323]/20 blur-3xl" />
          <div className="absolute bottom-0 right-[-40px] h-80 w-80 rounded-full bg-[#ea2323]/16 blur-3xl" />
        </div>
        <div className="relative z-10 w-full max-w-5xl">
          <div className="grid gap-10 rounded-[32px] bg-white/8 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:grid-cols-[1.05fr,0.95fr] lg:p-12 border border-white/10">
            <div className="space-y-6">
              <Crew7Logo variant="horizontal" size="sm" className="mb-2" />
              <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-[2.8rem]">
                Assemble your AI crew in minutes, not months.
              </h1>
              <p className="text-sm text-[#b8c2d8] md:text-base">
                Sign in to sync your workspaces or create an account to unlock personalized project orchestration, shared context, and seamless collaboration across your team.
              </p>
              <div className="grid gap-4 text-sm text-[#cbd4e6]">
                <HighlightCard title="Unified Workspace" description="Launch coordinated frontend, backend, and AI specialists inside a single interface." />
                <HighlightCard title="Context-Aware" description="Bring your repos, briefs, and documents together so every response is instantly relevant." />
                <HighlightCard title="Ship Faster" description="Use curated prompt templates and guided orchestration to move from idea to production-ready deliverables." />
              </div>
            </div>
            <div className="rounded-[28px] border border-white/15 bg-[#1e2635]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-8">
              <div className="flex items-center justify-between rounded-full bg-[#283347] p-1">
                <button
                  type="button"
                  onClick={() => setMode('signIn')}
                  className={classNames(
                    'w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition',
                    mode === 'signIn' ? 'bg-[#ea2323] text-white shadow-[#ea232333]' : 'text-[#9099b4]'
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signUp')}
                  className={classNames(
                    'w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition',
                    mode === 'signUp' ? 'bg-[#ea2323] text-white shadow-[#ea232333]' : 'text-[#9099b4]'
                  )}
                >
                  Create account
                </button>
              </div>
              <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                {isSignUp ? (
                  <label className="block text-sm font-medium text-[#c0c6d8]">
                    <span className="mb-2 inline-block">Full name</span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleChange('name')}
                      placeholder="Taylor Edison"
                      className="w-full rounded-xl border border-[#3d4759] bg-[#1a2332] px-4 py-3 text-[#f8fafc] shadow-sm placeholder:text-[#8892a8] focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/30"
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
                    className="w-full rounded-xl border border-[#3d4759] bg-[#1a2332] px-4 py-3 text-[#f8fafc] shadow-sm placeholder:text-[#8892a8] focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/30"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-[#c0c6d8]">
                  <span className="mb-2 inline-block">Password</span>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#3d4759] bg-[#1a2332] px-4 py-3 text-[#f8fafc] shadow-sm placeholder:text-[#8892a8] focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/30"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-xl bg-[#ea2323] py-3 text-sm font-semibold text-white shadow-lg shadow-[#ea232336] transition hover:bg-[#c81f1f] disabled:cursor-not-allowed disabled:bg-[#6b1c1c]"
                >
                  {isSignUp ? 'Create your account' : 'Sign in to Crew-7'}
                </button>
              </form>
              <div className="mt-6 space-y-4 text-xs text-[#acb6cf]">
                <p>
                  By continuing you agree to our{' '}
                  <a className="font-semibold text-[#ea2323] hover:text-[#ff4040]" href="#">Terms of Service</a> and{' '}
                  <a className="font-semibold text-[#ea2323] hover:text-[#ff4040]" href="#">Privacy Policy</a>.
                </p>
                <div className="relative">
                  <div className="flex items-center justify-center">
                    <span className="h-px flex-1 bg-[#3d4759]" />
                    <span className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#a8b2c8]">or</span>
                    <span className="h-px flex-1 bg-[#3d4759]" />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <SocialButton label="Continue with Google" icon={<GoogleIcon className="w-4 h-4" />} />
                    <SocialButton label="Continue with GitHub" icon={<GitHubLogo className="w-4 h-4" />} />
                    <SocialButton label="Continue with Telegram" icon={<TelegramIcon className="w-4 h-4" />} />
                    <SocialButton label="Continue with MetaMask" icon={<MetaMaskIcon className="w-4 h-4" />} />
                  </div>
                </div>
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={onAuthenticated}
                    className="inline-flex items-center gap-2 rounded-full bg-[#ea2323]/10 px-4 py-2 text-sm font-semibold text-[#ea2323] transition hover:bg-[#ea2323]/20"
                  >
                    Continue as guest
                    <ArrowIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATION_SEED);
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('available');
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => WORKSPACE_OPTIONS[0]?.id ?? 'crew-7-command');
  const [user, setUser] = useState<User | null>(null);
  const [missionStatus, setMissionStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [runEvents, setRunEvents] = useState<RunLogEvent[]>([]);
  const [activeCrew, setActiveCrew] = useState<Crew | null>(null);
  const [activeCrewId, setActiveCrewId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('crew7_active_crew_id') ?? 'crew-atlas';
    }
    return 'crew-atlas';
  });
  const streamCloseRef = useRef<(() => void) | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);

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
      avatar: user?.avatarUrl ?? DEFAULT_AVATAR,
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
        }
      } catch (error) {
        console.error('Unable to fetch current user', error);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.timezone) return;
    setTimeZoneInfo({ id: user.timezone, label: formatTimeZoneLabel(user.timezone) });
    setLocalTime(formatLocalTime(user.timezone));
  }, [user?.timezone]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('crew7_active_crew_id', activeCrewId);
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
        }
      }
    };

    void loadCrew();

    return () => {
      cancelled = true;
    };
  }, [activeCrewId]);

  useEffect(() => {
    const disconnect = missionSocket((message: MissionMessage) => {
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
    });

    return () => disconnect();
  }, [activeCrewId]);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationMenuOpen, isProfileMenuOpen, isWorkspaceMenuOpen]);

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
      const { id: runId } = await createRun({ crew_id: activeCrewId, prompt: content, mode: 'chat' });
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
        />
      );
    }

    if (activeSection === 'dashboard') {
      return <Dashboard crew={activeCrew} missionStatus={missionStatus} runEvents={runEvents} />;
    }

    if (activeSection === 'settings') {
      return <SettingsPanel />;
    }

    const descriptions: Record<Section, string> = {
      chat: 'Chat surface rendering happens here.',
      dashboard: '',
      projects: 'Projects detail pages with run, artifact, and memory tabs will live here.',
      collections: 'Vector collections list and detail drawers are coming soon.',
      workspace: 'Workspace canvas with file tree, viewers, and context panel is on the roadmap.',
      marketplace: 'Marketplace catalog of crew templates will appear here.',
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
          'flex-1 flex flex-col px-5 py-6 md:px-10 md:py-8 lg:px-16 overflow-visible transition-[filter,opacity] duration-200 ease-out',
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
          onToggleNotifications={() => {
            setIsNotificationMenuOpen((prev) => !prev);
            setIsProfileMenuOpen(false);
            setIsWorkspaceMenuOpen(false);
          }}
          onToggleProfile={() => {
            setIsProfileMenuOpen((prev) => !prev);
            setIsNotificationMenuOpen(false);
            setIsWorkspaceMenuOpen(false);
          }}
          onToggleWorkspace={() => {
            setIsWorkspaceMenuOpen((prev) => !prev);
            setIsNotificationMenuOpen(false);
            setIsProfileMenuOpen(false);
          }}
          onMarkAllRead={handleMarkAllRead}
          onStatusChange={handleStatusChange}
          onGoToSettings={() => onNavigate('settings')}
          onSignOut={onSignOut}
          notificationMenuRef={notificationMenuRef}
          profileMenuRef={profileMenuRef}
          workspaceMenuRef={workspaceMenuRef}
          isNotificationMenuOpen={isNotificationMenuOpen}
          isProfileMenuOpen={isProfileMenuOpen}
          isWorkspaceMenuOpen={isWorkspaceMenuOpen}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
          activeSection={activeSection}
          advancedMode={advancedMode}
          onToggleAdvancedMode={() => setAdvancedMode((prev) => !prev)}
        />
        <section className="mt-4 flex-1 flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/8 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {renderMainPanel()}
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

const ShellSidebar: React.FC<ShellSidebarProps> = ({ activeSection, onNavigate, onSignOut, isExpanded, onHoverChange }) => (
  <aside
    className={classNames(
      'hidden sm:flex flex-col justify-between bg-[#1a2332]/98 text-white shadow-[6px_0_24px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[width,background-color] duration-300 ease-out py-6 border-r border-white/10',
      isExpanded ? 'w-60 px-4' : 'w-16 px-2'
    )}
    onMouseEnter={() => onHoverChange(true)}
    onMouseLeave={() => onHoverChange(false)}
    onFocusCapture={() => onHoverChange(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains((event.relatedTarget as Node) ?? null)) {
        onHoverChange(false);
      }
    }}
  >
    <div className={classNames('flex flex-col gap-6 transition-all duration-300', isExpanded ? 'items-stretch' : 'items-center')}>
      <button
        type="button"
        onClick={() => onNavigate('chat')}
        className={classNames(
          'relative flex items-center rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[#ea232326]',
          isExpanded
            ? 'w-full gap-3 border border-[#ea2323]/50 bg-[#ea2323]/15 px-3 py-2 text-sm text-white'
            : 'h-10 w-10 justify-center bg-[#ea2323] text-white hover:bg-[#c81f1f]'
        )}
        aria-label="Command feed"
      >
        <ChatBubbleIcon className="h-5 w-5 shrink-0" />
        {isExpanded ? <span className="truncate">Command feed</span> : null}
        <span
          className={classNames(
            'absolute inline-flex items-center justify-center rounded-full bg-white text-[0.55rem] font-bold text-[#ea2323] transition duration-200',
            isExpanded ? 'right-3 top-1.5 h-4 w-4' : '-right-1 -top-1 h-4 w-4'
          )}
        >
          +
        </span>
      </button>
      <nav className={classNames('flex flex-col gap-2 transition-all duration-300', isExpanded ? 'items-stretch' : 'items-center mt-2 gap-4')}>
        {(
          [
            { id: 'dashboard', label: 'Dashboard', icon: AnalyticsIcon },
            { id: 'projects', label: 'Projects', icon: FolderIcon },
            { id: 'collections', label: 'Collections', icon: LayersIcon },
            { id: 'workspace', label: 'Workspace', icon: GridIcon },
            { id: 'marketplace', label: 'Marketplace', icon: StoreIcon },
            { id: 'crews', label: 'Crews', icon: WorkflowIcon },
            { id: 'runs', label: 'Runs', icon: RefreshIcon },
          ] as Array<{ id: Section; label: string; icon: React.FC<IconProps> }>
        ).map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={classNames(
                'flex items-center rounded-lg transition-all duration-200',
                isExpanded ? 'w-full gap-3 px-3 py-2 text-sm font-medium' : 'h-9 w-9 justify-center',
                isActive
                  ? isExpanded
                    ? 'border border-[#ea2323]/60 bg-[#ea2323]/15 text-white shadow-none'
                    : 'bg-[#ea2323] text-white shadow-lg shadow-[#ea232336]'
                  : isExpanded
                  ? 'border border-transparent bg-transparent text-white/70 hover:bg-white/5 hover:text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              )}
              aria-label={item.label}
              title={item.label}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isExpanded ? <span className="truncate">{item.label}</span> : null}
            </button>
          );
        })}
      </nav>
    </div>
    <div className={classNames('flex flex-col gap-4 transition-all duration-300', isExpanded ? 'items-stretch' : 'items-center')}>
      <button
        type="button"
        onClick={() => onNavigate('settings')}
        className={classNames(
          'flex items-center rounded-xl border transition-all duration-200 shadow-[0_10px_28px_rgba(6,8,12,0.45)]',
          isExpanded ? 'w-full gap-3 px-3 py-2 text-sm font-semibold' : 'h-10 w-10 justify-center',
          activeSection === 'settings'
            ? isExpanded
              ? 'border-[#ea2323]/60 bg-[#ea2323]/15 text-[#ea2323]'
              : 'border-[#ea2323]/70 bg-[#ea2323]/20 text-[#ea2323]'
            : isExpanded
            ? 'border-[#2e3647] bg-[#1b2332]/80 text-white/75 hover:border-white/20 hover:text-white'
            : 'border-[#2e3647] bg-[#1b2332] text-white/80 hover:border-[#ea2323]/50 hover:text-[#ea2323]'
        )}
        aria-label="Settings"
        title="Settings"
      >
        <GearIcon className="h-5 w-5 shrink-0" />
        {isExpanded ? <span className="truncate">Settings</span> : null}
      </button>
      <button
        type="button"
        onClick={onSignOut}
        className={classNames(
          'flex items-center rounded-xl border border-[#2e3647] bg-[#1b2332] text-[#ea2323] shadow-[0_10px_28px_rgba(6,8,12,0.45)] transition-all duration-200 hover:border-[#ea2323]/60 hover:bg-[#2a3345]',
          isExpanded ? 'w-full gap-3 px-3 py-2 text-sm font-semibold' : 'h-10 w-10 justify-center'
        )}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOutIcon className="h-5 w-5 shrink-0" />
        {isExpanded ? <span className="truncate">Sign out</span> : null}
      </button>
    </div>
  </aside>
);

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
  isNotificationMenuOpen: boolean;
  isProfileMenuOpen: boolean;
  isWorkspaceMenuOpen: boolean;
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
  onToggleNotifications,
  onToggleProfile,
  onToggleWorkspace,
  onMarkAllRead,
  onStatusChange,
  onGoToSettings,
  onSignOut,
  notificationMenuRef,
  profileMenuRef,
  workspaceMenuRef,
  isNotificationMenuOpen,
  isProfileMenuOpen,
  isWorkspaceMenuOpen,
  onSelectWorkspace,
  onCreateWorkspace,
  activeSection,
  advancedMode = false,
  onToggleAdvancedMode,
}) => {
  const crewPreview = crewMembers.slice(0, 4);
  const overflowCount = Math.max(crewMembers.length - crewPreview.length, 0);

  return (
    <header className="relative z-20 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-[#acb6cf]">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-[#9ba7c2]">Mission signal</span>
          <span className={classNames('flex h-2.5 w-2.5 rounded-full', presence.dotClass)} aria-hidden="true" />
          <span>{presence.label}</span>
          <span className="text-[#4f576d]">•</span>
          <span>Operating from {locationLabel} • {localTime}</span>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2c3447] bg-[#121a28] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[#b4f0d0]">
            <span className="h-2 w-2 rounded-full bg-[#4cf5a1] shadow-[0_0_8px_rgba(76,245,161,0.55)]" aria-hidden="true" />
            GPT-5 mini active
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-[#1e2635]/80 px-4 py-2 text-xs font-medium text-[#acb6cf] shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
            <SparkIcon className="h-4 w-4 text-[#ea2323]" />
            <span>{messageCount ? `${messageCount} transmissions logged` : 'Awaiting first command'}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#1e2635]/80 px-3 py-2 text-xs shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
            <AgentLottie id={orchestratorAgent} size={44} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-[#7c859f]">Lead orchestrator</span>
              <span className="text-sm font-semibold text-white leading-tight">{formatAgentName(orchestratorAgent)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#1e2635]/80 px-3 py-2 text-xs text-[#acb6cf] shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
            <span className="text-[0.58rem] uppercase tracking-[0.22em] text-[#7c859f]">Crew rotation</span>
            <div className="flex items-center gap-1">
              {crewPreview.map((agent) => (
                <div
                  key={agent}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0d1523] shadow-[0_8px_20px_rgba(6,8,12,0.45)]"
                >
                  <AgentIcon id={agent} size={28} idle />
                </div>
              ))}
              {overflowCount > 0 ? (
                <span className="ml-1 text-[0.65rem] font-semibold text-white/80">+{overflowCount}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-end gap-2 self-start lg:gap-3">
      {activeSection === 'chat' && onToggleAdvancedMode && (
        <button
          type="button"
          onClick={onToggleAdvancedMode}
          className={classNames(
            'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm transition',
            advancedMode
              ? 'border-[#E5484D]/60 bg-[#2f1c1c] text-[#ff6b6b] hover:border-[#E5484D] hover:bg-[#3f2424]'
              : 'border-white/15 bg-[#1e2635]/90 text-[#acb6cf] hover:border-white/30 hover:text-white'
          )}
          aria-label="Toggle Advanced Mode"
          aria-pressed={advancedMode}
        >
          <GridIcon className="h-4 w-4" />
          <span className="uppercase tracking-wider">Advanced Mode</span>
        </button>
      )}
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
          <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-white/15 bg-[#1e2635]/95 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl z-30">
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
          className="group flex items-center gap-3 rounded-full border border-white/15 bg-[#1e2635]/90 pl-2.5 pr-3 py-1.5 text-left text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm transition hover:border-[#ea2323]/60"
          aria-haspopup="menu"
          aria-expanded={isWorkspaceMenuOpen}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b2332] text-[#ea2323]">
            <WorkspaceIcon className="h-4 w-4" />
          </span>
          <span className="sm:hidden text-sm font-semibold text-white">{workspace.name}</span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-white">{workspace.name}</span>
            <span className="text-xs text-[#9ea6bd]">Active workspace</span>
          </span>
          <ChevronDownIcon className="h-4 w-4 text-[#7c859f] transition group-hover:text-white" />
        </button>
        {isWorkspaceMenuOpen ? (
          <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-white/15 bg-[#1e2635]/95 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl z-30">
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
          className="group flex items-center gap-3 rounded-full border border-white/15 bg-[#1e2635]/90 pl-1.5 pr-3 py-1.5 text-left text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm transition hover:border-[#ea2323]/60"
          aria-haspopup="menu"
          aria-expanded={isProfileMenuOpen}
        >
          <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ea2323] via-[#f26464] to-[#f2a45c] text-sm font-semibold uppercase">
            <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${profile.avatar})` }} />
            <span className="relative z-10">{profileInitials}</span>
            <span className={classNames('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0e1626]', presence.dotClass)} aria-hidden="true" />
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-white">{profile.name}</span>
            <span className="text-xs text-[#9ea6bd]">{profile.role}</span>
          </span>
          <ChevronDownIcon className="h-4 w-4 text-[#7c859f] transition group-hover:text-white" />
        </button>
        {isProfileMenuOpen ? (
          <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-white/15 bg-[#1e2635]/95 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl z-30">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ea2323] via-[#f26464] to-[#f2a45c] text-base font-semibold uppercase">
                <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${profile.avatar})` }} />
                <span className="relative z-10">{profileInitials}</span>
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
};

const ChatSurface: React.FC<ChatSurfaceProps> = ({
  messages,
  isResponding,
  prefilledPrompt,
  onPrefillConsumed,
  onSendMessage,
  onMessageAction,
}) => (
  <section className="relative flex min-h-0 flex-1 flex-col">
    <div className="flex-1 overflow-y-auto px-5 pb-24 pt-5 md:px-8">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center text-sm md:text-base text-[#acb6cf]">
          Drop your first directive to light up the command feed.
        </div>
      ) : (
        <ul className="space-y-4 pb-8">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <li key={message.id} className={classNames('flex', isUser ? 'justify-end' : 'justify-start')}>
                <div className="max-w-[80%] space-y-2">
                  <div
                    className={classNames(
                      'rounded-2xl px-4 py-3 text-sm md:text-base shadow-sm transition',
                      isUser
                        ? 'bg-[#ea2323] text-white shadow-[#ea232336]'
                        : 'bg-[#1e2635] text-[#f8fafc] border border-white/15'
                    )}
                  >
                    {message.content}
                  </div>
                  <div className={classNames('hidden gap-2 sm:flex', isUser ? 'justify-end' : 'justify-start')}>
                    <button
                      type="button"
                      onClick={() => onMessageAction('share', message)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#1e2635]/80 text-[#acb6cf] transition hover:border-[#ea2323]/60 hover:text-white"
                      aria-label="Share message"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMessageAction('copy', message)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#1e2635]/80 text-[#acb6cf] transition hover:border-[#ea2323]/60 hover:text-white"
                      aria-label="Copy message"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMessageAction('regenerate', message)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#1e2635]/80 text-[#acb6cf] transition hover:border-[#ea2323]/60 hover:text-white"
                      aria-label="Regenerate message"
                    >
                      <ReplayIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {isResponding ? (
            <li className="flex justify-start">
              <div className="max-w-[80%] space-y-2">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-[#1e2635] px-4 py-3 text-sm text-[#f8fafc] shadow-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#ea2323]" aria-hidden="true" />
                  Thinking...
                </div>
              </div>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  <div className="pointer-events-none absolute inset-x-0 bottom-[4.5rem] h-28 bg-gradient-to-t from-[#1e2635] via-[#1e2635]/95 to-transparent md:bottom-[5rem]" />
  <div className="sticky bottom-0 z-10 border-t border-white/15 bg-[#1e2635]/95 px-5 pb-4 pt-3 backdrop-blur-xl md:px-8">
      <ChatInput
        isSending={isResponding}
        onSendMessage={onSendMessage}
        prefilledPrompt={prefilledPrompt ?? undefined}
        onPrefillConsumed={onPrefillConsumed}
      />
    </div>
  </section>
);

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
  <div className="rounded-2xl border border-white/15 bg-white/12 px-4 py-3 shadow-sm backdrop-blur">
    <p className="text-sm font-semibold text-[#ea2323]">{title}</p>
    <p className="mt-1 text-xs text-[#cbd4e6]">{description}</p>
  </div>
);

const SocialButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button
    type="button"
    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#3d4759] bg-[#1a2332] text-[#cbd4e6] shadow-sm transition hover:border-[#ea2323]/60 hover:bg-[#243140]"
    aria-label={label}
    title={label}
  >
    {icon}
  </button>
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

const GoogleIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M21.35 11.1h-9.17v2.96h5.64c-.24 1.5-1.74 4.4-5.64 4.4-3.39 0-6.16-2.8-6.16-6.26s2.77-6.26 6.16-6.26c1.93 0 3.22.82 3.96 1.53l2.71-2.63C17.45 3.34 15.32 2.3 12.18 2.3 6.94 2.3 2.7 6.6 2.7 11.8c0 5.2 4.24 9.5 9.48 9.5 5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.09-.18-1.93Z" />
  </svg>
);

const GitHubLogo: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.55-3.88-1.55-.52-1.32-1.26-1.67-1.26-1.67-1.03-.72.08-.71.08-.71 1.14.08 1.74 1.18 1.74 1.18 1.01 1.75 2.66 1.25 3.31.96.1-.74.39-1.25.71-1.54-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.18a10.82 10.82 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.18-1.5 3.14-1.18 3.14-1.18.62 1.57.23 2.73.11 3.02.73.81 1.18 1.85 1.18 3.11 0 4.44-2.69 5.42-5.26 5.7.4.35.76 1.04.76 2.11 0 1.52-.01 2.74-.01 3.11 0 .31.21.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
    />
  </svg>
);

const TelegramIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#139bd0"
      d="M22.54 3.23a1.23 1.23 0 0 0-1.39-.13L2.66 12.87a.88.88 0 0 0 .07 1.6l4.37 1.72 1.71 4.8a.88.88 0 0 0 1.52.22l2.48-3.05 4.28 3.55a1.23 1.23 0 0 0 1.93-.69l3.66-15.52a1.23 1.23 0 0 0-.14-.87ZM8.24 14.56l7.1-6.57-4.9 7.74a.88.88 0 0 0-.12.28l-.56 1.76-1.52-4.21Z"
    />
  </svg>
);

const MetaMaskIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#f6851b"
      d="m20.52 4.37-6.3 4.6 1.17-2.76 5.13-1.84ZM3.49 4.37l6.3 4.6-1.17-2.76-5.13-1.84Zm5.26 14.25-2.91.79 2.06 1.43 3.68-1.26-.68-2.27Zm6.5 0 .68 2.27 3.68 1.26 2.06-1.43-2.91-.79Zm-1.9-.17h-2.7l.26 2.06 2.44.82 2.44-.82.26-2.06h-2.7ZM4.73 13.2l-1.85 5.58 5.47-2.35-.94-2.01-2.68-1.22Zm14.54 0-2.68 1.22-.94 2.01 5.47 2.35-1.85-5.58ZM7.84 9.24l.78 3.49 2.26.16.16-1.38-3.2-2.27Zm8.32 0-3.2 2.27.16 1.38 2.26-.16.78-3.49Zm1.16-2.43-5.5 2.67.33-.78 5.17-1.89Zm-10.64 0 5.17 1.89.33.78-5.5-2.67Z"
    />
  </svg>
);

export default App;
