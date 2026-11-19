import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, PawPrint, HeartPulse, Bot, Syringe, BarChart3, QrCode, Milk,
  Stethoscope, Settings as SettingsIcon, Menu, X, Leaf, Search, FlaskConical, RotateCcw, Globe,
  Activity, Bell, Sun, Moon,
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

function Sidebar({ onNavigate, onClose, showMobileControls, q, setQ, onSearch, theme, toggleTheme }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand-900 to-brand-800 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-3 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Leaf size={22} /></div>
          <div>
            <p className="text-lg font-extrabold leading-none">{t('app.name')}<span className="text-brand-300"> {t('app.ai')}</span></p>
            <p className="mt-1 text-[11px] text-brand-200">{t('app.tagline')}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 lg:hidden"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Mobile Search & Quick Language Switcher inside Drawer */}
      {showMobileControls && (
        <div className="space-y-3 border-b border-white/10 px-4 pb-4 lg:hidden">
          <form onSubmit={onSearch} className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-200" />
            <input
              className="w-full min-h-[40px] rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-brand-200 focus:border-white/40 focus:outline-none"
              placeholder={t('app.searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/10 p-1">
            {LANGUAGES.map((l) => {
              const active = (i18n.language || 'en') === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => changeAppLanguage(l.code)}
                  className={`min-h-[36px] rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                    active ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-100 hover:bg-white/10'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-300" /> : <Moon size={15} />}
              <span>{theme === 'dark' ? t('app.lightTheme', { defaultValue: 'Light Theme' }) : t('app.darkTheme', { defaultValue: 'Dark Theme' })}</span>
            </button>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {NAV.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive ? 'bg-white text-brand-800 shadow-md' : 'text-brand-100 hover:bg-white/10 hover:translate-x-0.5'
              }`
            }
          >
            <Icon size={18} className="shrink-0" /> <span className="truncate">{t(labelKey)}</span>
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
  const { theme, toggleTheme, mode, toasts, dismissToast, resetDemo } = useApp();

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const search = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/animals?q=${encodeURIComponent(q.trim())}` : '/animals');
    setQ('');
    setOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <aside className="animate-slideIn fixed inset-y-0 left-0 z-10 w-72 max-w-[85vw]">
            <Sidebar
              onNavigate={() => setOpen(false)}
              onClose={() => setOpen(false)}
              showMobileControls
              q={q}
              setQ={setQ}
              onSearch={search}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200/70 bg-white/90 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-8 sm:py-3">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Leaf size={17} />
              </div>
              <span className="text-sm font-extrabold text-slate-900 sm:text-base">
                {t('app.name')} <span className="text-brand-600">{t('app.ai')}</span>
              </span>
            </div>
          </div>

          <form onSubmit={search} className="relative hidden max-w-sm flex-1 md:block">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder={t('app.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
          </form>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            {mode === 'demo' && (
              <>
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 sm:px-3 sm:text-xs"
                  title={t('app.demoTooltip')}
                >
                  <FlaskConical size={13} /> <span className="hidden xs:inline sm:inline">{t('app.demoMode')}</span>
                </span>
                <button
                  className="btn-ghost !min-h-[38px] !px-2.5 !py-1.5 text-xs sm:!px-3"
                  onClick={() => setConfirmReset(true)}
                  title={t('app.resetData')}
                >
                  <RotateCcw size={14} /> <span className="hidden md:inline">{t('app.resetData')}</span>
                </button>
              </>
            )}

            {/* Light / Dark Theme Toggle Button in Top Bar */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:px-3"
              title={theme === 'dark' ? t('app.switchToLight', { defaultValue: 'Switch to Light Theme' }) : t('app.switchToDark', { defaultValue: 'Switch to Dark Theme' })}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} className="text-amber-400" />
                  <span className="hidden sm:inline">{t('app.light', { defaultValue: 'Light' })}</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-slate-600" />
                  <span className="hidden sm:inline">{t('app.dark', { defaultValue: 'Dark' })}</span>
                </>
              )}
            </button>

            {/* Global Language Selector Dropdown (touch-friendly on mobile & desktop) */}
            <div className="relative flex items-center">
              <Globe size={15} className="pointer-events-none absolute left-2.5 text-brand-600 sm:left-3" />
              <select
                aria-label={t('app.language')}
                value={i18n.language || 'en'}
                onChange={(e) => changeAppLanguage(e.target.value)}
                className="min-h-[38px] cursor-pointer rounded-xl border border-slate-200 bg-white py-1.5 pl-7 pr-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:pl-8 sm:pr-3"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white sm:flex">
              FM
            </div>
          </div>
        </header>
        <main key={location.pathname} className="mx-auto max-w-7xl px-3.5 py-4 sm:p-6 lg:p-8"><Outlet /></main>
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
