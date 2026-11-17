import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, PawPrint, HeartPulse, Bot, Syringe, BarChart3, QrCode, Milk,
  Stethoscope, Settings as SettingsIcon, Menu, X, Leaf, Search, FlaskConical, RotateCcw, Globe,
  Activity, Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { ToastContainer, ConfirmDialog } from './ui.jsx';
import { changeAppLanguage } from '../i18n/i18n.js';

const NAV = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/animals', labelKey: 'nav.animals', icon: PawPrint },
  { to: '/digital-twin', labelKey: 'nav.digitalTwin', icon: Activity },
  { to: '/early-warning', labelKey: 'nav.earlyWarning', icon: Bell },
  { to: '/assistant', labelKey: 'nav.aiVoiceAssistant', icon: Bot },
  { to: '/scan', labelKey: 'nav.qrScanner', icon: QrCode },
  { to: '/health', labelKey: 'nav.healthMonitoring', icon: HeartPulse },
  { to: '/milk', labelKey: 'nav.milkProduction', icon: Milk },
  { to: '/vaccinations', labelKey: 'nav.vaccinations', icon: Syringe },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
  { to: '/vet-help', labelKey: 'nav.vetHelp', icon: Stethoscope },
  { to: '/settings', labelKey: 'nav.settings', icon: SettingsIcon },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];

function Sidebar({ onNavigate }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand-900 to-brand-800 text-white">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Leaf size={22} /></div>
        <div>
          <p className="text-lg font-extrabold leading-none">{t('app.name')}<span className="text-brand-300"> {t('app.ai')}</span></p>
          <p className="mt-1 text-[11px] text-brand-200">{t('app.tagline')}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to} to={to} end={to === '/'} onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-white text-brand-800 shadow-md' : 'text-brand-100 hover:bg-white/10 hover:translate-x-0.5'}`
            }
          >
            <Icon size={18} /> {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Layout() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toasts, dismissToast, resetDemo } = useApp();

  const search = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/animals?q=${encodeURIComponent(q.trim())}` : '/animals');
    setQ('');
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="animate-slideIn absolute inset-y-0 left-0 w-64">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button className="absolute right-3 top-5 text-white" onClick={() => setOpen(false)} aria-label={t('common.close')}><X /></button>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu /></button>
          <form onSubmit={search} className="relative hidden max-w-sm flex-1 sm:block">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder={t('app.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            {mode === 'demo' && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800" title={t('app.demoTooltip')}>
                  <FlaskConical size={14} /> {t('app.demoMode')}
                </span>
                <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setConfirmReset(true)}>
                  <RotateCcw size={14} /> <span className="hidden sm:inline">{t('app.resetData')}</span>
                </button>
              </>
            )}

            {/* Global Language Selector Dropdown */}
            <div className="relative flex items-center">
              <Globe size={16} className="pointer-events-none absolute left-3 text-brand-600" />
              <select
                aria-label={t('app.language')}
                value={i18n.language || 'en'}
                onChange={(e) => changeAppLanguage(e.target.value)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">FM</div>
          </div>
        </header>
        <main key={location.pathname} className="mx-auto max-w-7xl p-4 sm:p-8"><Outlet /></main>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t('app.resetDemoTitle')}
        confirmText={t('app.reset')}
        message={t('app.resetDemoMsg')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => { await resetDemo(); setConfirmReset(false); }}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
