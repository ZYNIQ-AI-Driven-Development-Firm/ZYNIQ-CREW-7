import React, { useEffect, useMemo, useState } from 'react';
import {
  connectIntegration,
  createCheckout,
  disconnectIntegration,
  getInvoices,
  getMe,
  getNotifPrefs,
  getOrg,
  getWallet,
  initTOTP,
  listIntegrations,
  patchMe,
  patchNotifPrefs,
  patchOrg,
  setIntegrationWebhookUrl,
  setupSSO,
  verifyDevice,
  verifyTOTP,
  type Integration,
  type Invoice,
  type NotifPrefs,
  type Org,
  type User,
  type Wallet,
} from '@/src/lib/api';

const CATEGORIES = [
  { id: 'account', label: 'Account' },
  { id: 'organization', label: 'Organization' },
  { id: 'billing', label: 'Billing' },
  { id: 'security', label: 'Security' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'notifications', label: 'Notifications' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];
type NotifToggleKey = Exclude<keyof NotifPrefs, 'quietHours'>;

type SecurityStatus = {
  totpEnrolled: boolean;
  totpSvg?: string;
  totpUrl?: string;
  deviceVerified: boolean;
  ssoConfigured: boolean;
};

const planDescriptions = {
  'mission-control': 'Best for scaling teams that need coordinated crew orchestration and shared memory.',
  enterprise: 'Dedicated hardware, custom compliance, and on-call support for high-security deployments.',
} as const;

const SettingsPanel: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('account');
  const [user, setUser] = useState<User | null>(null);
  const [userDraft, setUserDraft] = useState<{ name: string; timezone: string; avatarUrl?: string }>({
    name: '',
    timezone: '',
    avatarUrl: '',
  });
  const [org, setOrg] = useState<Org | null>(null);
  const [orgDraft, setOrgDraft] = useState<{ name: string; primaryDomain: string; allowedDomainsText: string }>(
    { name: '', primaryDomain: '', allowedDomainsText: '' }
  );
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [notifPrefs, setNotifPrefsState] = useState<NotifPrefs | null>(null);
  const [quietHoursDraft, setQuietHoursDraft] = useState<{ start: string; end: string }>({ start: '22:00', end: '06:00' });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [billingPlan, setBillingPlan] = useState<'mission-control' | 'enterprise'>('mission-control');
  const [accountSaving, setAccountSaving] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({ totpEnrolled: false, deviceVerified: false, ssoConfigured: false });
  const [totpCode, setTotpCode] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [deviceCode, setDeviceCode] = useState('');
  const [ssoXml, setSsoXml] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const [me, orgRes, walletRes, integrationsRes, prefsRes, invoicesRes] = await Promise.all([
          getMe(),
          getOrg(),
          getWallet().catch(() => null),
          listIntegrations(),
          getNotifPrefs(),
          getInvoices().catch(() => []),
        ]);
        if (cancelled) return;
        setUser(me);
        setUserDraft({ name: me.name, timezone: me.timezone, avatarUrl: me.avatarUrl });
        setOrg(orgRes);
        setOrgDraft({
          name: orgRes.name,
          primaryDomain: orgRes.primaryDomain,
          allowedDomainsText: orgRes.allowedDomains.join('\n'),
        });
        setWallet(walletRes);
        setIntegrations(integrationsRes);
        setNotifPrefsState(prefsRes);
        setQuietHoursDraft(prefsRes.quietHours);
        setInvoices(invoicesRes);
        setWebhookUrl('');
      } catch (error) {
        console.error('Failed to load settings', error);
        setMessage('Unable to load settings data. Check your network and retry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const integrationIndexer = useMemo(() => new Map(integrations.map((integration) => [integration.key, integration])), [integrations]);

  const handleAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setAccountSaving(true);
    try {
      const updated = await patchMe({
        name: userDraft.name,
        timezone: userDraft.timezone,
        avatarUrl: userDraft.avatarUrl,
      });
      setUser(updated);
      setMessage('Profile updated.');
    } catch (error) {
      console.error('Account save failed', error);
      setMessage('Unable to update profile.');
    } finally {
      setAccountSaving(false);
    }
  };

  const handleOrgSubmit = async () => {
    if (!org) return;
    setOrgSaving(true);
    try {
      const allowedDomains = orgDraft.allowedDomainsText
        .split(/\s+/)
        .map((domain) => domain.trim())
        .filter(Boolean);
      const updated = await patchOrg({
        name: orgDraft.name,
        primaryDomain: orgDraft.primaryDomain,
        allowedDomains,
      });
      setOrg(updated);
      setOrgDraft({
        name: updated.name,
        primaryDomain: updated.primaryDomain,
        allowedDomainsText: updated.allowedDomains.join('\n'),
      });
      setMessage('Organization settings synced.');
    } catch (error) {
      console.error('Org update failed', error);
      setMessage('Could not update organization.');
    } finally {
      setOrgSaving(false);
    }
  };

  const handleCheckout = async () => {
    setBillingLoading(true);
    try {
      const { url } = await createCheckout();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout failed', error);
      setMessage('Unable to start checkout.');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoices.length) {
      setMessage('No invoices available yet.');
      return;
    }
    const latest = invoices[0];
    window.open(latest.hosted_pdf_url, '_blank', 'noopener');
  };

  const handleIntegrationToggle = async (key: string) => {
    const current = integrationIndexer.get(key);
    const nextConnected = !current?.connected;
    setIntegrations((prev) => prev.map((integration) => (integration.key === key ? { ...integration, connected: nextConnected } : integration)));
    try {
      if (nextConnected) {
        await connectIntegration(key, {});
      } else {
        await disconnectIntegration(key);
      }
    } catch (error) {
      console.error('Integration update failed', error);
      setMessage('Integration toggle failed; reverting.');
      setIntegrations((prev) => prev.map((integration) => (integration.key === key ? { ...integration, connected: !nextConnected } : integration)));
    }
  };

  const handleWebhookSave = async () => {
    if (!webhookUrl.trim()) {
      setMessage('Enter a webhook URL first.');
      return;
    }
    try {
      await setIntegrationWebhookUrl({ url: webhookUrl.trim() });
      setMessage('Webhook updated.');
      setWebhookUrl('');
    } catch (error) {
      console.error('Webhook sync failed', error);
      setMessage('Unable to update webhook URL.');
    }
  };

  const toggleNotification = (key: NotifToggleKey) => {
    if (!notifPrefs) return;
    const nextValue = !notifPrefs[key];
    const nextPrefs = { ...notifPrefs, [key]: nextValue } as NotifPrefs;
    setNotifPrefsState(nextPrefs);
    void patchNotifPrefs({ [key]: nextValue } as Partial<NotifPrefs>).catch((error) => {
      console.error('Notification update failed', error);
      setNotifPrefsState(notifPrefs);
      setMessage('Unable to update notification preference.');
    });
  };

  const handleQuietHoursSave = async () => {
    if (!notifPrefs) return;
    const nextPrefs = { ...notifPrefs, quietHours: quietHoursDraft };
    setNotifPrefsState(nextPrefs);
    try {
      await patchNotifPrefs({ quietHours: quietHoursDraft } as Partial<NotifPrefs>);
      setMessage('Quiet hours updated.');
    } catch (error) {
      console.error('Quiet hours update failed', error);
      setNotifPrefsState(notifPrefs);
      setMessage('Unable to update quiet hours.');
    }
  };

  const handleInitTotp = async () => {
    try {
      const totp = await initTOTP();
      setSecurityStatus((prev) => ({
        ...prev,
        totpSvg: totp.secret_svg,
        totpUrl: totp.otpauth_url,
      }));
    } catch (error) {
      console.error('TOTP init failed', error);
      setMessage('Could not start TOTP enrollment.');
    }
  };

  const handleVerifyTotp = async () => {
    try {
      await verifyTOTP(totpCode.trim());
      setSecurityStatus((prev) => ({ ...prev, totpEnrolled: true }));
      setTotpCode('');
      setMessage('TOTP verified.');
    } catch (error) {
      console.error('TOTP verify failed', error);
      setMessage('Invalid TOTP code.');
    }
  };

  const handleVerifyDevice = async () => {
    try {
      await verifyDevice({ fingerprint: deviceFingerprint.trim(), code: deviceCode.trim() });
      setSecurityStatus((prev) => ({ ...prev, deviceVerified: true }));
      setMessage('Device verified.');
    } catch (error) {
      console.error('Device verification failed', error);
      setMessage('Device verification failed.');
    }
  };

  const handleSetupSSO = async () => {
    try {
      await setupSSO({ saml_metadata_xml: ssoXml });
      setSecurityStatus((prev) => ({ ...prev, ssoConfigured: true }));
      setMessage('SSO configuration saved.');
      setSsoXml('');
    } catch (error) {
      console.error('SSO setup failed', error);
      setMessage('Unable to update SSO metadata.');
    }
  };

  const renderAccount = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#101724] p-6 shadow-[0_20px_40px_rgba(4,6,10,0.45)]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Commander profile</h2>
            <p className="mt-1 text-sm text-[#8e96ad]">Sync your display details across the Crew-7 console.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#2d3548] px-4 py-2 text-sm font-semibold text-[#dbe1f5] transition hover:border-[#ea2323]/60 hover:text-white"
          >
            Upload avatar
          </button>
        </header>
        <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleAccountSubmit} noValidate>
          <label className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Display name
            <input
              type="text"
              value={userDraft.name}
              onChange={(event) => setUserDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-white shadow-[0_8px_24px_rgba(4,6,10,0.42)] focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
              disabled={accountSaving || loading}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Email address
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="cursor-not-allowed rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-[#9aa2bd]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Timezone
            <input
              type="text"
              value={userDraft.timezone}
              onChange={(event) => setUserDraft((prev) => ({ ...prev, timezone: event.target.value }))}
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
              disabled={accountSaving || loading}
              required
            />
          </label>
          <div className="flex flex-col gap-3">
            <span className="text-sm text-[#c0c6d8]">Crew contact</span>
            <div className="rounded-2xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-sm text-[#8e96ad]">
              Linked to company directory • Auto-sync nightly
            </div>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#ea2323] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c81f1f] disabled:cursor-not-allowed disabled:bg-[#5a1a1a]"
              disabled={accountSaving || loading}
            >
              {accountSaving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => user && setUserDraft({ name: user.name, timezone: user.timezone, avatarUrl: user.avatarUrl })}
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-[#8e96ad] transition hover:text-white"
              disabled={accountSaving || loading}
            >
              Reset
            </button>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#3a4256] px-4 py-2 text-sm font-semibold text-[#f7adad] transition hover:border-[#ea2323] hover:text-white"
            >
              Request account deletion
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderOrganization = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#101724] p-6 shadow-[0_20px_40px_rgba(4,6,10,0.45)]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Organization identity</h2>
            <p className="mt-1 text-sm text-[#8e96ad]">Update domains and org details for invites and SSO.</p>
          </div>
        </header>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Company name
            <input
              type="text"
              value={orgDraft.name}
              onChange={(event) => setOrgDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
              disabled={orgSaving || loading}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Primary domain
            <input
              type="text"
              value={orgDraft.primaryDomain}
              onChange={(event) => setOrgDraft((prev) => ({ ...prev, primaryDomain: event.target.value }))}
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
              disabled={orgSaving || loading}
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Allowed email domains
            <textarea
              value={orgDraft.allowedDomainsText}
              onChange={(event) => setOrgDraft((prev) => ({ ...prev, allowedDomainsText: event.target.value }))}
              rows={3}
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
              disabled={orgSaving || loading}
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOrgSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-[#ea2323] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c81f1f] disabled:cursor-not-allowed disabled:bg-[#5a1a1a]"
            disabled={orgSaving || loading}
          >
            {orgSaving ? 'Saving…' : 'Save organization profile'}
          </button>
          <span className="text-xs text-[#8e96ad]">Changes sync across SSO and invitations instantly.</span>
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#101724] p-6 shadow-[0_20px_40px_rgba(4,6,10,0.45)]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Plan & invoices</h2>
            <p className="mt-1 text-sm text-[#8e96ad]">Manage credit balance, checkout, and invoices.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="rounded-full border border-[#2d3548] px-4 py-2 text-sm font-semibold text-[#dbe1f5] transition hover:border-[#ea2323]/60 hover:text-white"
            disabled={!invoices.length}
          >
            Download latest invoice
          </button>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(
            [
              { id: 'mission-control' as const, label: 'Mission Control', price: '$299/mo' },
              { id: 'enterprise' as const, label: 'Enterprise Orbit', price: 'Talk to crew' },
            ]
          ).map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setBillingPlan(plan.id)}
              className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 text-left transition ${
                billingPlan === plan.id
                  ? 'border-[#ea2323]/70 bg-[#ea2323]/10 text-white shadow-[0_12px_32px_rgba(234,35,35,0.3)]'
                  : 'border-[#283145] bg-[#0b121f] text-[#c0c6d8] hover:border-[#ea2323]/40'
              }`}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8e96ad]">{plan.label}</span>
              <span className="text-2xl font-semibold">{plan.price}</span>
              <p className="text-xs text-[#8e96ad]">{planDescriptions[plan.id]}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Current credits
            <div className="rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-white">
              {wallet ? `${wallet.credits.toLocaleString()} credits` : '—'}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Payment method
            <div className="flex items-center justify-between rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-[#cbd3e6]">
              <span>Managed via Stripe</span>
              <button
                type="button"
                onClick={handleCheckout}
                className="text-xs font-semibold text-[#f7adad] transition hover:text-white"
                disabled={billingLoading}
              >
                {billingLoading ? 'Redirecting…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#101724] p-6 shadow-[0_20px_40px_rgba(4,6,10,0.45)]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Access control</h2>
            <p className="mt-1 text-sm text-[#8e96ad]">Enroll TOTP, verify devices, and push SSO metadata.</p>
          </div>
        </header>
        <div className="mt-6 space-y-4">
          <ToggleCard
            title="Two-factor authentication"
            description={securityStatus.totpEnrolled ? 'TOTP enabled for this account.' : 'Require TOTP codes for every login beyond trusted devices.'}
            enabled={securityStatus.totpEnrolled}
            onToggle={securityStatus.totpEnrolled ? () => setSecurityStatus((prev) => ({ ...prev, totpEnrolled: false })) : handleInitTotp}
          />
          {securityStatus.totpSvg ? (
            <div className="rounded-2xl border border-[#283145] bg-[#0b121f] p-4 text-sm text-[#c0c6d8] space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7c859f]">Scan QR to enroll</p>
              <div className="rounded-xl bg-white p-3" dangerouslySetInnerHTML={{ __html: securityStatus.totpSvg }} />
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value)}
                  placeholder="Enter 6-digit code"
                  className="flex-1 rounded-xl border border-[#283145] bg-[#0b121f] px-3 py-2 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
                />
                <button
                  type="button"
                  onClick={handleVerifyTotp}
                  className="rounded-full bg-[#ea2323] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#c81f1f]"
                >
                  Verify
                </button>
              </div>
            </div>
          ) : null}
          <ToggleCard
            title="Device verification"
            description={securityStatus.deviceVerified ? 'Latest device verified.' : 'Flag unknown devices and send confirmation to the command channel.'}
            enabled={securityStatus.deviceVerified}
            onToggle={handleVerifyDevice}
          />
          {!securityStatus.deviceVerified ? (
            <div className="rounded-2xl border border-[#283145] bg-[#0b121f] p-4 text-sm text-[#c0c6d8] space-y-3">
              <input
                type="text"
                value={deviceFingerprint}
                onChange={(event) => setDeviceFingerprint(event.target.value)}
                placeholder="Device fingerprint"
                className="rounded-xl border border-[#283145] bg-[#0b121f] px-3 py-2 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
              />
              <input
                type="text"
                value={deviceCode}
                onChange={(event) => setDeviceCode(event.target.value)}
                placeholder="Email code"
                className="rounded-xl border border-[#283145] bg-[#0b121f] px-3 py-2 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
              />
            </div>
          ) : null}
          <div className="rounded-2xl border border-[#283145] bg-[#0b121f] px-4 py-4 text-sm text-[#c0c6d8] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">SSO via Crew-7 Relay</p>
                <p className="text-xs text-[#8e96ad]">Map roles directly to orchestrator, engineer, and reviewer tiers.</p>
              </div>
              <button
                type="button"
                onClick={handleSetupSSO}
                className="rounded-full bg-[#1f2738] px-4 py-2 text-xs font-semibold text-[#f7adad] transition hover:bg-[#ea2323]/20 hover:text-white"
              >
                {securityStatus.ssoConfigured ? 'Update SAML' : 'Configure SAML'}
              </button>
            </div>
            <textarea
              value={ssoXml}
              onChange={(event) => setSsoXml(event.target.value)}
              placeholder="Paste SAML metadata XML"
              rows={4}
              className="w-full rounded-xl border border-[#283145] bg-[#0b121f] px-3 py-2 text-xs text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#101724] p-6 shadow-[0_20px_40px_rgba(4,6,10,0.45)]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Mission integrations</h2>
            <p className="mt-1 text-sm text-[#8e96ad]">Toggle providers and sync webhook destinations.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#2d3548] px-4 py-2 text-sm font-semibold text-[#dbe1f5] transition hover:border-[#ea2323]/60 hover:text-white"
          >
            Manage API tokens
          </button>
        </header>
        <ul className="mt-6 space-y-4">
          {integrations.map((integration) => (
            <li
              key={integration.key}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#283145] bg-[#0b121f] px-4 py-4 shadow-[0_12px_32px_rgba(4,6,10,0.4)]"
            >
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm font-semibold text-white">{integration.name}</p>
                <p className="text-xs text-[#8e96ad]">{integration.connected ? 'Connected' : 'Not connected'}</p>
              </div>
              <Toggle
                enabled={integration.connected}
                onToggle={() => void handleIntegrationToggle(integration.key)}
                label={integration.connected ? 'Connected' : 'Disconnected'}
              />
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3">
          <label className="flex flex-col gap-2 text-sm text-[#c0c6d8]">
            Alert webhook URL
            <input
              type="url"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="https://"
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-4 py-3 text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
            />
          </label>
          <button
            type="button"
            onClick={handleWebhookSave}
            className="inline-flex items-center gap-2 rounded-full bg-[#ea2323] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c81f1f]"
          >
            Save webhook
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#101724] p-6 shadow-[0_20px_40px_rgba(4,6,10,0.45)]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Signal preferences</h2>
            <p className="mt-1 text-sm text-[#8e96ad]">Decide how your crew pings you for launches, failures, and approvals.</p>
          </div>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(
            [
              { id: 'email', label: 'Email alerts' },
              { id: 'sms', label: 'SMS handoff' },
              { id: 'push', label: 'Push notifications' },
              { id: 'slack_dm', label: 'Slack DM mirror' },
            ] as Array<{ id: NotifToggleKey; label: string }>
          ).map((channel) => (
            <ToggleCard
              key={channel.id}
              title={channel.label}
              description={channel.id === 'sms' ? 'Carrier rates may apply.' : 'Receive Crew-7 updates instantly.'}
              enabled={Boolean(notifPrefs?.[channel.id])}
              onToggle={() => toggleNotification(channel.id)}
              compact
            />
          ))}
        </div>
        <div className="mt-6 space-y-3 rounded-2xl border border-[#283145] bg-[#0b121f] px-4 py-4 text-xs text-[#8e96ad]">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#7c859f]">Quiet hours</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="time"
              value={quietHoursDraft.start}
              onChange={(event) => setQuietHoursDraft((prev) => ({ ...prev, start: event.target.value }))}
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-3 py-2 text-sm text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
            />
            <input
              type="time"
              value={quietHoursDraft.end}
              onChange={(event) => setQuietHoursDraft((prev) => ({ ...prev, end: event.target.value }))}
              className="rounded-xl border border-[#283145] bg-[#0b121f] px-3 py-2 text-sm text-white focus:border-[#ea2323] focus:outline-none focus:ring-2 focus:ring-[#ea2323]/25"
            />
          </div>
          <button
            type="button"
            onClick={handleQuietHoursSave}
            className="inline-flex items-center gap-2 rounded-full bg-[#ea2323] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#c81f1f]"
          >
            Save quiet hours
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrent = () => {
    if (loading) {
      return (
        <div className="rounded-3xl border border-white/10 bg-[#101724] p-6 text-sm text-[#8e96ad]">
          Loading settings…
        </div>
      );
    }
    switch (activeCategory) {
      case 'account':
        return renderAccount();
      case 'organization':
        return renderOrganization();
      case 'billing':
        return renderBilling();
      case 'security':
        return renderSecurity();
      case 'integrations':
        return renderIntegrations();
      case 'notifications':
        return renderNotifications();
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="w-full border-b border-white/10 bg-[#0d1523] px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r lg:px-6">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#7c859f]">Settings</p>
        <ul className="mt-4 space-y-2">
          {CATEGORIES.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  activeCategory === category.id
                    ? 'border-[#ea2323]/70 bg-[#ea2323]/15 text-white shadow-[0_12px_32px_rgba(234,35,35,0.25)]'
                    : 'border-transparent bg-white/5 text-[#c0c6d8] hover:border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="text-sm font-semibold">{category.label}</span>
                {activeCategory === category.id ? (
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#ea2323]">Active</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
        {message ? (
          <div className="mb-4 rounded-2xl border border-[#ea2323]/40 bg-[#ea2323]/10 px-4 py-3 text-xs text-[#fbd9d9]">
            {message}
          </div>
        ) : null}
        <div className="mx-auto max-w-4xl space-y-6">{renderCurrent()}</div>
      </section>
    </div>
  );
};

type ToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
};

const Toggle: React.FC<ToggleProps> = ({ enabled, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`inline-flex items-center gap-3 rounded-full px-3 py-1 text-xs font-semibold transition ${
      enabled ? 'bg-[#ea2323] text-white' : 'bg-[#1f2738] text-[#8e96ad] hover:text-white'
    }`}
  >
    <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${enabled ? 'bg-white/30' : 'bg-[#2a3244]'}`}>
      <span className={`absolute left-1 h-3.5 w-3.5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
    </span>
    {label ? <span>{label}</span> : null}
  </button>
);

type ToggleCardProps = {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  compact?: boolean;
};

const ToggleCard: React.FC<ToggleCardProps> = ({ title, description, enabled, onToggle, compact = false }) => (
  <div
    className={`rounded-2xl border border-[#283145] bg-[#0b121f] px-4 py-4 text-sm text-[#c0c6d8] shadow-[0_10px_28px_rgba(4,6,10,0.4)] ${
      compact ? 'flex flex-col gap-3' : 'space-y-3'
    }`}
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-[#8e96ad]">{description}</p>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} label={enabled ? 'On' : 'Off'} />
    </div>
  </div>
);

export default SettingsPanel;
